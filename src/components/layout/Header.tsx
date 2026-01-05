"use client"

import * as React from "react"
import { useUIStore } from "@/store/ui-store"
import { useAppTheme } from "@/hooks/useTheme"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Plus,
  Moon,
  Sun,
  Menu,
  Settings,
  User,
  CheckCircle2,
  Circle,
  Filter,
  ArrowUpDown,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface HeaderProps {
  onMenuClick?: () => void
  taskCount?: number
  overdueCount?: number
}

export function Header({ onMenuClick, taskCount = 0, overdueCount = 0 }: HeaderProps) {
  const { 
    setSearchOpen, 
    setAddTaskOpen, 
    setCommandPaletteOpen,
    showCompletedTasks,
    toggleShowCompletedTasks,
    currentView,
    setCurrentView,
  } = useUIStore()
  const { toggleTheme, isDark } = useAppTheme()
  const [mounted, setMounted] = React.useState(false)

  // Handle keyboard shortcuts for view switching
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      // View shortcuts (with Cmd/Ctrl)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case "1":
            e.preventDefault()
            setCurrentView("today")
            break
          case "2":
            e.preventDefault()
            setCurrentView("week")
            break
          case "3":
            e.preventDefault()
            setCurrentView("upcoming")
            break
          case "4":
            e.preventDefault()
            setCurrentView("all")
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [setCurrentView])

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Get view title
  const getViewTitle = () => {
    const viewTitles: Record<string, string> = {
      today: "📥 Today's Tasks",
      week: "📅 Next 7 Days",
      upcoming: "🔮 Upcoming",
      all: "📋 All Tasks",
    }
    return viewTitles[currentView] || "Tasks"
  }

  // Get view subtitle
  const getViewSubtitle = () => {
    const now = new Date()
    switch (currentView) {
      case "today":
        return format(now, "EEEE, MMMM d")
      case "week":
        return "Next 7 days"
      case "upcoming":
        return format(now, "MMMM yyyy")
      case "all":
        return `${taskCount} task${taskCount !== 1 ? "s" : ""}`
      default:
        return format(now, "MMMM d, yyyy")
    }
  }

  if (!mounted) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-4">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-32 bg-muted animate-pulse rounded" />
            <div className="h-9 w-9 bg-muted animate-pulse rounded-full" />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* View Title */}
        <div className="hidden sm:flex flex-col">
          <h1 className="text-sm font-semibold leading-none tracking-tight">
            {getViewTitle()}
          </h1>
          <span className="text-xs text-muted-foreground">
            {getViewSubtitle()}
          </span>
        </div>

        {/* Quick Search */}
        <Button
          variant="outline"
          className="relative h-9 w-full max-w-sm justify-start text-sm text-muted-foreground sm:pr-12 ml-auto md:ml-0"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="hidden lg:inline-flex">Search tasks...</span>
          <span className="inline-flex lg:hidden">Search...</span>
          <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          {/* Show Completed Toggle */}
          <Button
            variant={showCompletedTasks ? "default" : "ghost"}
            size="sm"
            onClick={toggleShowCompletedTasks}
            className="hidden sm:flex"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Completed
          </Button>

          {/* Task Stats */}
          {taskCount > 0 && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs">
              <span>{taskCount} task{taskCount !== 1 ? "s" : ""}</span>
              {overdueCount > 0 && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-destructive font-medium">{overdueCount} overdue</span>
                </>
              )}
            </div>
          )}

          {/* Add task button */}
          <Button onClick={() => setAddTaskOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Add task</span>
          </Button>

          {/* Theme toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* View Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Filter className="h-5 w-5" />
                <span className="sr-only">View options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => setCurrentView("today")}
                className={cn(
                  "flex items-center gap-2",
                  currentView === "today" && "bg-accent"
                )}
              >
                <Circle className="h-4 w-4" />
                <span>Today</span>
                <kbd className="ml-auto text-xs text-muted-foreground">⌘1</kbd>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCurrentView("week")}
                className={cn(
                  "flex items-center gap-2",
                  currentView === "week" && "bg-accent"
                )}
              >
                <Circle className="h-4 w-4" />
                <span>Next 7 Days</span>
                <kbd className="ml-auto text-xs text-muted-foreground">⌘2</kbd>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCurrentView("upcoming")}
                className={cn(
                  "flex items-center gap-2",
                  currentView === "upcoming" && "bg-accent"
                )}
              >
                <Circle className="h-4 w-4" />
                <span>Upcoming</span>
                <kbd className="ml-auto text-xs text-muted-foreground">⌘3</kbd>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCurrentView("all")}
                className={cn(
                  "flex items-center gap-2",
                  currentView === "all" && "bg-accent"
                )}
              >
                <Circle className="h-4 w-4" />
                <span>All Tasks</span>
                <kbd className="ml-auto text-xs text-muted-foreground">⌘4</kbd>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showCompletedTasks}
                onCheckedChange={() => toggleShowCompletedTasks()}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Show Completed
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
