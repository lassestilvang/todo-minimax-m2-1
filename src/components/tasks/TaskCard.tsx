"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  AlertTriangle,
  Edit2,
  Trash2,
  Bell,
  ChevronDown,
  ChevronUp,
  Tag,
  GripVertical,
  MoreHorizontal,
} from "lucide-react"
import { format, isPast, isToday, isTomorrow, differenceInDays } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toggleTaskCompletionAction, deleteTaskAction } from "@/app/actions/task-actions"
import type { TaskWithRelations } from "@/lib/types"

interface TaskCardProps {
  task: TaskWithRelations
  compact?: boolean
  onEdit?: () => void
  onViewDetails?: () => void
}

const PRIORITY_CONFIG = {
  high: { color: "bg-red-500", label: "High", icon: AlertTriangle },
  medium: { color: "bg-yellow-500", label: "Medium", icon: AlertTriangle },
  low: { color: "bg-blue-500", label: "Low", icon: AlertTriangle },
  none: { color: "bg-muted", label: "None", icon: Circle },
} as const

export function TaskCard({
  task,
  compact = false,
  onEdit,
  onViewDetails,
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isCompleting, setIsCompleting] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const priorityConfig = PRIORITY_CONFIG[task.priority]
  const isOverdue = task.date && !task.is_completed && isPast(new Date(task.date)) && !isToday(new Date(task.date))
  const isDueToday = task.date && isToday(new Date(task.date))
  const isDueTomorrow = task.date && isTomorrow(new Date(task.date))

  const completedSubtasks = task.subtasks.filter((st) => st.is_completed).length
  const totalSubtasks = task.subtasks.length

  const handleToggleComplete = async () => {
    setIsCompleting(true)
    try {
      await toggleTaskCompletionAction(task.id)
    } catch (error) {
      console.error("Error toggling task completion:", error)
    } finally {
      setIsCompleting(false)
    }
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this task?")) {
      setIsDeleting(true)
      try {
        await deleteTaskAction(task.id)
      } catch (error) {
        console.error("Error deleting task:", error)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const formatDateDisplay = () => {
    if (!task.date) return null

    const date = new Date(task.date)
    if (isToday(date)) {
      return { icon: Calendar, text: "Today", className: "text-primary" }
    }
    if (isTomorrow(date)) {
      return { icon: Calendar, text: "Tomorrow", className: "text-blue-500" }
    }
    if (isPast(date) && !task.is_completed) {
      const days = differenceInDays(new Date(), date)
      return { icon: AlertTriangle, text: `${days} day${days > 1 ? "s" : ""} ago`, className: "text-red-500" }
    }
    return { icon: Calendar, text: format(date, "MMM d"), className: "text-muted-foreground" }
  }

  const dateDisplay = formatDateDisplay()
  const deadlineDisplay = task.deadline
    ? {
        date: new Date(task.deadline),
        isOverdue: isPast(new Date(task.deadline)) && !task.is_completed,
      }
    : null

  if (compact) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all hover:shadow-md cursor-pointer",
          task.is_completed && "opacity-60",
          isDeleting && "opacity-50"
        )}
        onClick={onViewDetails}
      >
        <Checkbox
          checked={task.is_completed}
          onCheckedChange={handleToggleComplete}
          onClick={(e) => e.stopPropagation()}
          disabled={isCompleting}
        />

        <div className={cn("flex-1 min-w-0", task.is_completed && "line-through text-muted-foreground")}>
          <p className="font-medium truncate">{task.name}</p>
        </div>

        {dateDisplay && (
          <span className={cn("text-xs flex items-center gap-1", dateDisplay.className)}>
            <dateDisplay.icon className="h-3 w-3" />
            {dateDisplay.text}
          </span>
        )}

        <span className={cn("w-2 h-2 rounded-full", priorityConfig.color)} title={priorityConfig.label} />
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={cn(
        "group relative rounded-lg border bg-card transition-all hover:shadow-md",
        task.is_completed && "opacity-60",
        isOverdue && "border-red-300 dark:border-red-800",
        isDeleting && "opacity-50"
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Drag Handle */}
        <button
          className="mt-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Completion Checkbox */}
        <Checkbox
          checked={task.is_completed}
          onCheckedChange={handleToggleComplete}
          disabled={isCompleting}
          className="mt-1"
        />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Task Name */}
          <div className="flex items-center gap-2 mb-1">
            <p
              className={cn(
                "font-medium truncate",
                task.is_completed && "line-through text-muted-foreground"
              )}
            >
              {task.name}
            </p>
            {task.priority !== "none" && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs px-1.5 py-0",
                  priorityConfig.color,
                  "text-white dark:text-white"
                )}
                style={{ backgroundColor: priorityConfig.color.replace("bg-", "") }}
              >
                {priorityConfig.label}
              </Badge>
            )}
          </div>

          {/* Description Preview */}
          {task.description && !isExpanded && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {task.description}
            </p>
          )}

          {/* Metadata Row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {/* Date */}
            {dateDisplay && (
              <span className={cn("flex items-center gap-1", dateDisplay.className)}>
                <dateDisplay.icon className="h-3 w-3" />
                {dateDisplay.text}
              </span>
            )}

            {/* Deadline */}
            {deadlineDisplay && (
              <span
                className={cn(
                  "flex items-center gap-1",
                  deadlineDisplay.isOverdue && "text-red-500"
                )}
              >
                <Clock className="h-3 w-3" />
                {format(deadlineDisplay.date, "MMM d, h:mm a")}
              </span>
            )}

            {/* Estimate Time */}
            {task.estimate_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {Math.floor(task.estimate_minutes / 60)}h {task.estimate_minutes % 60}m
              </span>
            )}

            {/* Subtask Progress */}
            {totalSubtasks > 0 && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {completedSubtasks}/{totalSubtasks}
              </span>
            )}

            {/* Labels */}
            {task.labels.length > 0 && (
              <div className="flex items-center gap-1">
                {task.labels.slice(0, 2).map((label) => (
                  <Badge
                    key={label.id}
                    variant="secondary"
                    className="text-xs px-1 py-0"
                    style={label.color ? { backgroundColor: label.color + "20", color: label.color } : {}}
                  >
                    {label.name}
                  </Badge>
                ))}
                {task.labels.length > 2 && (
                  <span className="text-xs">+{task.labels.length - 2}</span>
                )}
              </div>
            )}
          </div>

          {/* Expanded Description */}
          <AnimatePresence>
            {isExpanded && task.description && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t"
              >
                <p className="text-sm text-muted-foreground">{task.description}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expanded Subtasks */}
          <AnimatePresence>
            {isExpanded && totalSubtasks > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2"
              >
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={subtask.is_completed}
                      className="h-3 w-3"
                      disabled
                    />
                    <span
                      className={cn(
                        "flex-1",
                        subtask.is_completed && "line-through text-muted-foreground"
                      )}
                    >
                      {subtask.name}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Expand/Collapse Button */}
        {task.description || totalSubtasks > 0 ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        ) : null}

        {/* Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onViewDetails}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Bell className="mr-2 h-4 w-4" />
              Set Reminder
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  )
}
