"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format, isToday, isTomorrow, isPast, addDays, startOfWeek, endOfWeek, parseISO } from "date-fns"
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  AlertTriangle,
  ChevronRight,
  Plus,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUIStore } from "@/store/ui-store"
import type { TaskWithRelations, List } from "@/lib/types"

interface UpcomingViewProps {
  onTaskEdit?: (task: TaskWithRelations) => void
  onTaskView?: (task: TaskWithRelations) => void
  onAddTask?: () => void
}

export function UpcomingView({ onTaskEdit, onTaskView, onAddTask }: UpcomingViewProps) {
  const { showCompletedTasks } = useUIStore()
  const [isLoading, setIsLoading] = React.useState(true)
  const [tasks, setTasks] = React.useState<TaskWithRelations[]>([])
  const [lists, setLists] = React.useState<List[]>([])
  const [overdueCount, setOverdueCount] = React.useState(0)

  const loadTasks = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("view", "upcoming")
      
      const response = await fetch(`/api/tasks?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
        setLists(data.lists || [])
      }
      
      // Fetch overdue count
      const overdueRes = await fetch("/api/tasks/overdue-count")
      if (overdueRes.ok) {
        const overdueData = await overdueRes.json()
        setOverdueCount(overdueData.count || 0)
      }
    } catch (error) {
      console.error("Failed to load upcoming tasks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    loadTasks()
  }, [])

  // Group tasks for upcoming view
  const groupedTasks = React.useMemo(() => {
    const groups: { id: string; title: string; tasks: TaskWithRelations[] }[] = []
    const now = new Date()
    const today = format(now, "yyyy-MM-dd")
    const tomorrow = format(addDays(now, 1), "yyyy-MM-dd")
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const nextWeekStart = addDays(weekStart, 7)
    const nextWeekEnd = addDays(weekEnd, 7)
    const monthEnd = endOfWeek(new Date(now.getFullYear(), now.getMonth() + 1, 0), { weekStartsOn: 1 })
    
    const overdueTasks: TaskWithRelations[] = []
    const todayTasks: TaskWithRelations[] = []
    const tomorrowTasks: TaskWithRelations[] = []
    const thisWeekTasks: TaskWithRelations[] = []
    const nextWeekTasks: TaskWithRelations[] = []
    const thisMonthTasks: TaskWithRelations[] = []
    const laterTasks: TaskWithRelations[] = []

    tasks.forEach((task) => {
      if (!task.date) {
        laterTasks.push(task)
        return
      }

      const taskDate = parseISO(task.date)
      const taskDateStr = format(taskDate, "yyyy-MM-dd")
      
      if (isPast(taskDate) && !isToday(taskDate) && !task.is_completed) {
        overdueTasks.push(task)
      } else if (taskDateStr === today) {
        todayTasks.push(task)
      } else if (taskDateStr === tomorrow) {
        tomorrowTasks.push(task)
      } else if (taskDate >= weekStart && taskDate <= weekEnd) {
        thisWeekTasks.push(task)
      } else if (taskDate >= nextWeekStart && taskDate <= nextWeekEnd) {
        nextWeekTasks.push(task)
      } else if (taskDate >= weekEnd && taskDate <= monthEnd) {
        thisMonthTasks.push(task)
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
    if (nextWeekTasks.length > 0) {
      groups.push({ id: "nextweek", title: "Next Week", tasks: nextWeekTasks })
    }
    if (thisMonthTasks.length > 0) {
      groups.push({ id: "thismonth", title: "This Month", tasks: thisMonthTasks })
    }
    if (laterTasks.length > 0) {
      groups.push({ id: "later", title: "Later", tasks: laterTasks })
    }

    return groups
  }, [tasks])

  const filteredTasks = React.useMemo(() => {
    if (showCompletedTasks) return tasks
    return tasks.filter((t) => !t.is_completed)
  }, [tasks, showCompletedTasks])

  const taskCount = filteredTasks.length

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-muted animate-pulse rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <EmptyUpcomingState onAddTask={onAddTask} />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Upcoming</h2>
          <p className="text-muted-foreground">
            {format(new Date(), "MMMM yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {overdueCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {overdueCount} overdue
            </Badge>
          )}
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            {taskCount} upcoming
          </Badge>
        </div>
      </div>

      {/* Task Groups */}
      <AnimatePresence mode="popLayout">
        {groupedTasks.map((group) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <h3 className={cn(
              "text-sm font-medium uppercase tracking-wider mt-6 mb-2 flex items-center gap-2",
              group.id === "overdue" ? "text-destructive" : "text-muted-foreground"
            )}>
              {group.title}
              <span className="text-xs font-normal">({group.tasks.length})</span>
            </h3>
            
            <div className="space-y-3">
              {group.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => onTaskEdit?.(task)}
                  onViewDetails={() => onTaskView?.(task)}
                  isOverdue={group.id === "overdue"}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty state when all completed */}
      {filteredTasks.length === 0 && tasks.length > 0 && (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold">All caught up!</h3>
          <p className="text-muted-foreground mb-4">
            You&apos;ve completed all your upcoming tasks.
          </p>
          <Button onClick={onAddTask}>
            <Plus className="mr-2 h-4 w-4" />
            Add a task
          </Button>
        </Card>
      )}
    </div>
  )
}

// Task Card Component
function TaskCard({
  task,
  onEdit,
  onViewDetails,
  isOverdue = false,
}: {
  task: TaskWithRelations
  onEdit?: () => void
  onViewDetails?: () => void
  isOverdue?: boolean
}) {
  const handleToggle = async () => {
    try {
      await fetch(`/api/tasks/${task.id}/toggle`, { method: "POST" })
      window.location.reload()
    } catch (error) {
      console.error("Failed to toggle task:", error)
    }
  }

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all hover:shadow-md",
        isOverdue && "border-destructive/50 bg-destructive/5"
      )}
    >
      <CardContent className="flex items-start gap-3 p-4">
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleToggle()
          }}
          className={cn(
            "mt-1 h-5 w-5 rounded-full border-2 transition-colors flex-shrink-0",
            task.is_completed
              ? "bg-primary border-primary text-primary-foreground"
              : "border-muted-foreground/30 hover:border-primary"
          )}
        >
          {task.is_completed && (
            <svg className="h-3 w-3 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        
        <div className="flex-1 min-w-0" onClick={onViewDetails}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "font-medium",
              task.is_completed && "line-through text-muted-foreground"
            )}>
              {task.name}
            </span>
            {isOverdue && !task.is_completed && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0">
                Overdue
              </Badge>
            )}
          </div>
          
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {task.priority !== "none" && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  task.priority === "high" && "border-red-500 text-red-500",
                  task.priority === "medium" && "border-yellow-500 text-yellow-500",
                  task.priority === "low" && "border-blue-500 text-blue-500"
                )}
              >
                {task.priority}
              </Badge>
            )}
            
            {task.date && (
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {format(parseISO(task.date), "MMM d")}
              </Badge>
            )}
            
            {task.labels?.map((label) => (
              <Badge 
                key={label.id}
                variant="secondary"
                className="text-xs"
                style={{ backgroundColor: (label.color || undefined) ? `${label.color}20` : undefined, color: label.color || undefined }}
              >
                {label.name}
              </Badge>
            ))}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onEdit?.()
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

// Empty State
function EmptyUpcomingState({ onAddTask }: { onAddTask?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-full bg-muted mb-4">
        <Sparkles className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No upcoming tasks</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        You&apos;re all caught up! Future tasks will appear here.
      </p>
      <Button onClick={onAddTask}>
        <Plus className="mr-2 h-4 w-4" />
        Schedule a task
      </Button>
    </div>
  )
}
