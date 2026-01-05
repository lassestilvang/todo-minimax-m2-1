"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useUIStore } from "@/store/ui-store"
import { toggleTaskCompletionAction } from "@/app/actions/task-actions"
import { format } from "date-fns"
import {
  Search,
  CheckCircle2,
  Circle,
  Calendar,
  List,
  Tag,
  ArrowRight,
  Clock,
  AlertCircle,
  Plus,
  Loader2,
  FileText,
  Briefcase,
  Hash,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { TaskWithRelations, List as ListType, Label } from "@/lib/types"

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface SearchResult {
  tasks: (TaskWithRelations & { list: ListType | null; score: number })[]
  lists: (ListType & { task_count?: number })[]
  labels: Label[]
}

interface SearchCommandProps {
  onTaskSelect?: (taskId: string) => void
  onListSelect?: (listId: string) => void
  onLabelSelect?: (labelId: string) => void
}

export function SearchCommand({
  onTaskSelect,
  onListSelect,
  onLabelSelect,
}: SearchCommandProps) {
  const router = useRouter()
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const [query, setQuery] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [results, setResults] = React.useState<SearchResult>({
    tasks: [],
    lists: [],
    labels: [],
  })
  const [selectedStatus, setSelectedStatus] = React.useState<"all" | "active" | "completed">("all")
  const [selectedType, setSelectedType] = React.useState<"all" | "tasks" | "lists" | "labels">("all")
  const isMobile = useMediaQuery("(max-width: 768px)")

  const debouncedQuery = useDebounce(query, 300)

  // Handle keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [setCommandPaletteOpen])

  // Search when query changes
  React.useEffect(() => {
    const search = async () => {
      if (!debouncedQuery.trim()) {
        setResults({ tasks: [], lists: [], labels: [] })
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          type: selectedType,
        })

        if (selectedStatus === "completed") {
          params.set("completed", "true")
        } else if (selectedStatus === "active") {
          params.set("completed", "false")
        }

        const response = await fetch(`/api/search?${params}`)
        if (response.ok) {
          const data = await response.json()
          setResults({
            tasks: data.tasks || [],
            lists: data.lists || [],
            labels: data.labels || [],
          })
        }
      } catch (error) {
        console.error("Search failed:", error)
      } finally {
        setIsLoading(false)
      }
    }

    search()
  }, [debouncedQuery, selectedStatus, selectedType])

  // Handle task completion
  const handleCompleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await toggleTaskCompletionAction(taskId)
    // Refresh search results
    setResults((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, is_completed: !t.is_completed } : t
      ),
    }))
  }

  // Handle item selection
  const handleSelect = (item: { type: "task" | "list" | "label"; id: string }) => {
    setCommandPaletteOpen(false)
    setQuery("")

    switch (item.type) {
      case "task":
        onTaskSelect?.(item.id)
        break
      case "list":
        onListSelect?.(item.id)
        break
      case "label":
        onLabelSelect?.(item.id)
        break
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500 bg-red-500/10"
      case "medium":
        return "text-yellow-500 bg-yellow-500/10"
      case "low":
        return "text-green-500 bg-green-500/10"
      default:
        return "text-muted-foreground bg-muted"
    }
  }

  // Get status icon
  const getStatusIcon = (isCompleted: boolean) => {
    return isCompleted ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <Circle className="h-4 w-4 text-muted-foreground" />
    )
  }

  // Format date
  const formatTaskDate = (date: string | null) => {
    if (!date) return null
    try {
      return format(new Date(date), "MMM d")
    } catch {
      return null
    }
  }

  // Search content component
  const SearchContent = () => (
    <>
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandInput
          placeholder="Search tasks, lists, labels..."
          value={query}
          onValueChange={setQuery}
          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        />
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 px-3 py-2 border-b">
        <span className="text-xs text-muted-foreground mr-2">Status:</span>
        <Button
          variant={selectedStatus === "all" ? "secondary" : "ghost"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setSelectedStatus("all")}
        >
          All
        </Button>
        <Button
          variant={selectedStatus === "active" ? "secondary" : "ghost"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setSelectedStatus("active")}
        >
          Active
        </Button>
        <Button
          variant={selectedStatus === "completed" ? "secondary" : "ghost"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setSelectedStatus("completed")}
        >
          Completed
        </Button>

        <div className="h-4 w-px bg-border mx-2" />

        <span className="text-xs text-muted-foreground mr-2">Type:</span>
        <Button
          variant={selectedType === "all" ? "secondary" : "ghost"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setSelectedType("all")}
        >
          All
        </Button>
        <Button
          variant={selectedType === "tasks" ? "secondary" : "ghost"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setSelectedType("tasks")}
        >
          Tasks
        </Button>
        <Button
          variant={selectedType === "lists" ? "secondary" : "ghost"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setSelectedType("lists")}
        >
          Lists
        </Button>
        <Button
          variant={selectedType === "labels" ? "secondary" : "ghost"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setSelectedType("labels")}
        >
          Labels
        </Button>
      </div>

      <CommandList className="max-h-[400px] overflow-y-auto">
        {!query.trim() ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>Start typing to search...</p>
            <p className="text-xs mt-1">Search tasks, lists, and labels</p>
          </div>
        ) : isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2" />
            <p>Searching...</p>
          </div>
        ) : results.tasks.length === 0 && results.lists.length === 0 && results.labels.length === 0 ? (
          <CommandEmpty>
            <div className="py-6 text-center">
              <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No results found for "{query}"</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try a different search term
              </p>
              {selectedType === "all" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setQuery("")
                    // Could open create task dialog here
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create new task
                </Button>
              )}
            </div>
          </CommandEmpty>
        ) : (
          <div className="py-2">
            {/* Tasks Group */}
            {(selectedType === "all" || selectedType === "tasks") && results.tasks.length > 0 && (
              <CommandGroup heading="Tasks">
                {results.tasks.map((task) => (
                  <CommandItem
                    key={task.id}
                    value={task.name}
                    onSelect={() => handleSelect({ type: "task", id: task.id })}
                    className="flex items-start gap-3 py-3 cursor-pointer"
                  >
                    <button
                      onClick={(e) => handleCompleteTask(task.id, e)}
                      className="mt-0.5 hover:scale-110 transition-transform"
                    >
                      {getStatusIcon(task.is_completed)}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "truncate",
                            task.is_completed && "line-through text-muted-foreground"
                          )}
                        >
                          {task.name}
                        </span>
                        {task.priority !== "none" && (
                          <Badge
                            variant="outline"
                            className={cn("text-xs px-1.5 py-0", getPriorityColor(task.priority))}
                          >
                            {task.priority}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {task.list && (
                          <span className="flex items-center gap-1">
                            {task.list.emoji && <span>{task.list.emoji}</span>}
                            <span>{task.list.name}</span>
                          </span>
                        )}
                        {task.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatTaskDate(task.date)}
                          </span>
                        )}
                        {task.labels.length > 0 && (
                          <div className="flex items-center gap-1">
                            {task.labels.slice(0, 3).map((label) => (
                              <span
                                key={label.id}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs"
                                style={{
                                  backgroundColor: label.color ? `${label.color}20` : undefined,
                                  color: label.color || undefined,
                                }}
                              >
                                <Hash className="h-2.5 w-2.5" />
                                {label.name}
                              </span>
                            ))}
                            {task.labels.length > 3 && (
                              <span className="text-xs">+{task.labels.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Lists Group */}
            {(selectedType === "all" || selectedType === "lists") && results.lists.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Lists">
                  {results.lists.map((list) => (
                    <CommandItem
                      key={list.id}
                      value={list.name}
                      onSelect={() => handleSelect({ type: "list", id: list.id })}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <div
                        className="h-6 w-6 rounded flex items-center justify-center text-sm"
                        style={{
                          backgroundColor: list.color ? `${list.color}20` : undefined,
                        }}
                      >
                        {list.emoji || <List className="h-3.5 w-3.5" />}
                      </div>
                      <span className="flex-1">{list.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {list.task_count || 0} tasks
                      </span>
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {/* Labels Group */}
            {(selectedType === "all" || selectedType === "labels") && results.labels.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Labels">
                  {results.labels.map((label) => (
                    <CommandItem
                      key={label.id}
                      value={label.name}
                      onSelect={() => handleSelect({ type: "label", id: label.id })}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <div
                        className="h-6 w-6 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: label.color || "#888",
                        }}
                      >
                        {label.icon ? (
                          <span className="text-xs">{label.icon}</span>
                        ) : (
                          <Tag className="h-3.5 w-3.5 text-white" />
                        )}
                      </div>
                      <span className="flex-1">{label.name}</span>
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </div>
        )}
      </CommandList>

      {/* Footer with keyboard shortcuts */}
      <div className="border-t px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              ↑↓
            </kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              ↵ 
            </kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              esc
            </kbd>
            Close
          </span>
        </div>
        <span className="flex items-center gap-1">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            ⌘K
          </kbd>
          Search
        </span>
      </div>
    </>
  )

  // Desktop: Use CommandDialog
  if (!isMobile) {
    return (
      <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
        <DialogContent className="overflow-hidden p-0 max-w-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>
              Search for tasks, lists, and labels
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col">
            <SearchContent />
          </div>
        </DialogContent>
      </CommandDialog>
    )
  }

  // Mobile: Use Sheet
  return (
    <Sheet open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <SheetContent
        side="bottom"
        className="h-[80vh] rounded-t-2xl"
        showCloseButton={false}
      >
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full pt-4">
          <SearchContent />
        </div>
      </SheetContent>
    </Sheet>
  )
}
