"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format, isToday, isTomorrow, isPast, addDays, startOfWeek, endOfWeek } from "date-fns"
import { CheckCircle2, Circle, Calendar, ChevronDown, ChevronUp, Filter, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUIStore } from "@/store/ui-store"
import { TaskCard } from "./TaskCard"
import type { TaskWithRelations } from "@/lib/types"

interface TaskListProps {
  tasks: TaskWithRelations[]
  isLoading?: boolean
  onTaskEdit?: (task: TaskWithRelations) => void
  onTaskView?: (task: TaskWithRelations) => void
}

type SortOption = "date" | "priority" | "name" | "custom"
type GroupOption = "date" | "none"

const SORT_OPTIONS = [
  { value: "date", label: "Date", icon: Calendar },
  { value: "priority", label: "Priority", icon: ArrowUpDown },
  { value: "name", label: "Name", icon: ArrowUpDown },
  { value: "custom", label: "Custom", icon: ArrowUpDown },
] as const

export function TaskList({
  tasks,
  isLoading = false,
  onTaskEdit,
  onTaskView,
}: TaskListProps) {
  const { showCompletedTasks, setShowCompletedTasks } = useUIStore()
  const [sortBy, setSortBy] = React.useState<SortOption>("date")
  const [groupBy, setGroupBy] = React.useState<GroupOption>("date")

  // Filter tasks
  const filteredTasks = React.useMemo(() => {
    let result = [...tasks]
    
    if (!showCompletedTasks) {
      result = result.filter((task) => !task.is_completed)
    }
    
    return result
  }, [tasks, showCompletedTasks])

  // Sort tasks
  const sortedTasks = React.useMemo(() => {
    const sorted = [...filteredTasks]
    
    switch (sortBy) {
      case "date":
        sorted.sort((a, b) => {
          // Tasks with no date go last
          if (!a.date && !b.date) return 0
          if (!a.date) return 1
          if (!b.date) return -1
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        })
        break
      case "priority":
        const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 }
        sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
        break
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "custom":
        // Default to creation date
        sorted.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        break
    }
    
    return sorted
  }, [filteredTasks, sortBy])

  // Group tasks by date
  const groupedTasks = React.useMemo(() => {
    if (groupBy === "none") {
      return [{ id: "all", title: "All Tasks", tasks: sortedTasks }]
    }

    const groups: { id: string; title: string; tasks: TaskWithRelations[] }[] = []
    const now = new Date()
    const today = format(now, "yyyy-MM-dd")
    const tomorrow = format(addDays(now, 1), "yyyy-MM-dd")
    const weekStart = startOfWeek(now)
    const weekEnd = endOfWeek(now)

    const todayTasks: TaskWithRelations[] = []
    const tomorrowTasks: TaskWithRelations[] = []
    const thisWeekTasks: TaskWithRelations[] = []
    const laterTasks: TaskWithRelations[] = []
    const noDateTasks: TaskWithRelations[] = []
    const overdueTasks: TaskWithRelations[] = []

    sortedTasks.forEach((task) => {
      if (!task.date) {
        noDateTasks.push(task)
        return
      }

      const taskDate = new Date(task.date)
      const taskDateStr = format(taskDate, "yyyy-MM-dd")

      if (isPast(taskDate) && !isToday(taskDate) && !task.is_completed) {
        overdueTasks.push(task)
      } else if (taskDateStr === today) {
        todayTasks.push(task)
      } else if (taskDateStr === tomorrow) {
        tomorrowTasks.push(task)
      } else if (taskDate >= weekStart && taskDate <= weekEnd) {
        thisWeekTasks.push(task)
      } else {
        laterTasks.push(task)
      }
    })

    if (overdueTasks.length > 0) {
      groups.push({ id: "overdue", title: "Overdue", tasks: overdueTasks })
    }
    if (todayTasks.length > 0) {
      groups.push({ id: "today", title: "Today", tasks: todayTasks })
    }
    if (tomorrowTasks.length > 0) {
      groups.push({ id: "tomorrow", title: "Tomorrow", tasks: tomorrowTasks })
    }
    if (thisWeekTasks.length > 0) {
      groups.push({ id: "thisweek", title: "This Week", tasks: thisWeekTasks })
    }
    if (laterTasks.length > 0) {
      groups.push({ id: "later", title: "Later", tasks: laterTasks })
    }
    if (noDateTasks.length > 0) {
      groups.push({ id: "nodate", title: "No Date", tasks: noDateTasks })
    }

    return groups
  }, [sortedTasks, groupBy])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12 text-center">
        <Circle className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold">No tasks</h3>
        <p className="text-muted-foreground mb-4">
          {showCompletedTasks
            ? "No tasks found"
            : "Add a task to get started"}
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Show Completed Toggle */}
          <Button
            variant={showCompletedTasks ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCompletedTasks(!showCompletedTasks)}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Completed
          </Button>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={sortBy === option.value}
                  onCheckedChange={() => setSortBy(option.value)}
                >
                  <option.icon className="mr-2 h-4 w-4" />
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Group Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Group
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Group by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={groupBy === "date"}
                onCheckedChange={() => setGroupBy(groupBy === "date" ? "none" : "date")}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Date
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={groupBy === "none"}
                onCheckedChange={() => setGroupBy(groupBy === "none" ? "date" : "none")}
              >
                <Circle className="mr-2 h-4 w-4" />
                None
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Task Groups */}
      <AnimatePresence mode="popLayout">
        {groupedTasks.map((group) => (
          <div key={group.id} className="space-y-3">
            {/* Group Header */}
            {groupedTasks.length > 1 && (
              <motion.h3
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-6 mb-2"
              >
                {group.title}
                <span className="ml-2 text-xs">({group.tasks.length})</span>
              </motion.h3>
            )}

            {/* Tasks */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {group.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={() => onTaskEdit?.(task)}
                    onViewDetails={() => onTaskView?.(task)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </AnimatePresence>

      {/* Empty state for filtered view */}
      {filteredTasks.length === 0 && tasks.length > 0 && (
        <Card className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <h3 className="font-medium">All tasks completed!</h3>
          <p className="text-sm text-muted-foreground">
            Great job! Toggle "Completed" to see finished tasks.
          </p>
        </Card>
      )}
    </div>
  )
}
