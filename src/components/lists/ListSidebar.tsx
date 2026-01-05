"use client"

import * as React from "react"
import { Inbox, List as ListIcon, Plus, Search } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"
import { useUIStore } from "@/store/ui-store"
import { ListItem } from "./ListItem"
import { CreateListDialog } from "./CreateListDialog"
import type { ListWithTaskCount } from "@/lib/types"

interface ListSidebarProps {
  initialLists: ListWithTaskCount[]
  overdueCount?: number
  onItemClick?: () => void
}

export function ListSidebar({ initialLists, overdueCount = 0, onItemClick }: ListSidebarProps) {
  const {
    currentView,
    setCurrentView,
    selectedListId,
    setSelectedListId,
  } = useUIStore()

  const [listsOpen, setListsOpen] = React.useState(true)
  const [lists, setLists] = React.useState<ListWithTaskCount[]>(initialLists)
  const [filterQuery, setFilterQuery] = React.useState("")

  // Refresh lists when initialLists changes (e.g., after server action)
  React.useEffect(() => {
    setLists(initialLists)
  }, [initialLists])

  // Separate default list from custom lists
  const defaultList = lists.find((list) => list.is_default)
  const customLists = lists
    .filter((list) => !list.is_default)
    .filter((list) =>
      list.name.toLowerCase().includes(filterQuery.toLowerCase())
    )

  const handleInboxClick = () => {
    if (defaultList) {
      setSelectedListId(defaultList.id)
    }
    setCurrentView("today")
    onItemClick?.()
  }

  const isInboxActive = (currentView === "today" && !selectedListId) || 
    (selectedListId === defaultList?.id)

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Main navigation */}
      <nav className="flex flex-col gap-1 px-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleInboxClick}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isInboxActive
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
          )}
        >
          <Inbox className="h-4 w-4" />
          <span className="flex-1 text-left">Inbox</span>
          {defaultList && defaultList.task_count > 0 && (
            <Badge variant="secondary" className="h-5 min-w-[20px] justify-center">
              {defaultList.task_count - defaultList.completed_count > 99 
                ? "99+" 
                : defaultList.task_count - defaultList.completed_count}
            </Badge>
          )}
        </motion.button>

        {/* Overdue indicator */}
        {overdueCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
            )}
            onClick={() => {
              setCurrentView("today")
              onItemClick?.()
            }}
          >
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="flex-1 text-left">Overdue</span>
            <Badge variant="destructive" className="h-5 min-w-[20px] justify-center">
              {overdueCount > 99 ? "99+" : overdueCount}
            </Badge>
          </motion.button>
        )}
      </nav>

      {/* My Lists */}
      <Collapsible open={listsOpen} onOpenChange={setListsOpen}>
        <div className="flex items-center px-2 gap-1">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 flex-1 justify-start px-2">
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform",
                  listsOpen && "rotate-90"
                )}
              />
              <span className="ml-1 text-sm font-medium">My Lists</span>
            </Button>
          </CollapsibleTrigger>
          <CreateListDialog
            triggerClassName="h-8 w-8"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </CreateListDialog>
        </div>
        
        {/* Filter input */}
        {listsOpen && (
          <div className="px-2 mt-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter lists..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        )}
        <CollapsibleContent>
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <nav className="flex flex-col gap-1 px-2 py-1">
              {customLists.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No lists yet. Create one!
                </div>
              ) : (
                customLists.map((list) => (
                  <ListItem key={list.id} list={list} />
                ))
              )}
            </nav>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
