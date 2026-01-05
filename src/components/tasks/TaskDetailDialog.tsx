"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format, formatDistanceToNow } from "date-fns"
import {
  Calendar,
  Clock,
  Tag,
  Bell,
  Paperclip,
  Repeat,
  CheckCircle2,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Activity,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  toggleTaskCompletionAction,
  deleteTaskAction,
  addSubtaskAction,
  updateSubtaskAction,
  deleteSubtaskAction,
  addReminderAction,
  deleteReminderAction,
} from "@/app/actions/task-actions"
import { TaskActivityLog } from "./TaskActivityLog"
import type { TaskWithRelations, TaskLog } from "@/lib/types"

interface TaskDetailDialogProps {
  task: TaskWithRelations | null
  logs?: TaskLog[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: () => void
}

const PRIORITY_CONFIG = {
  high: { color: "bg-red-500", label: "High" },
  medium: { color: "bg-yellow-500", label: "Medium" },
  low: { color: "bg-blue-500", label: "Low" },
  none: { color: "bg-muted", label: "None" },
} as const

export function TaskDetailDialog({
  task,
  logs = [],
  open,
  onOpenChange,
  onEdit,
}: TaskDetailDialogProps) {
  const [isCompleting, setIsCompleting] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [showActivity, setShowActivity] = React.useState(false)
  const [newSubtask, setNewSubtask] = React.useState("")
  const [showReminderInput, setShowReminderInput] = React.useState(false)
  const [reminderDate, setReminderDate] = React.useState<Date>()

  if (!task) return null

  const priorityConfig = PRIORITY_CONFIG[task.priority]
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
    if (confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      setIsDeleting(true)
      try {
        await deleteTaskAction(task.id)
        onOpenChange(false)
      } catch (error) {
        console.error("Error deleting task:", error)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return
    
    try {
      await addSubtaskAction(task.id, newSubtask.trim())
      setNewSubtask("")
    } catch (error) {
      console.error("Error adding subtask:", error)
    }
  }

  const handleToggleSubtask = async (subtaskId: string, currentStatus: boolean) => {
    try {
      await updateSubtaskAction({ id: subtaskId, is_completed: !currentStatus })
    } catch (error) {
      console.error("Error toggling subtask:", error)
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await deleteSubtaskAction(subtaskId, task.id)
    } catch (error) {
      console.error("Error deleting subtask:", error)
    }
  }

  const handleAddReminder = async () => {
    if (!reminderDate) return
    
    try {
      await addReminderAction(task.id, format(reminderDate, "yyyy-MM-dd'T'HH:mm"))
      setShowReminderInput(false)
      setReminderDate(undefined)
    } catch (error) {
      console.error("Error adding reminder:", error)
    }
  }

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      await deleteReminderAction(reminderId, task.id)
    } catch (error) {
      console.error("Error deleting reminder:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={task.is_completed}
                onCheckedChange={handleToggleComplete}
                disabled={isCompleting}
                className="h-5 w-5"
              />
              <div>
                <DialogTitle
                  className={cn(
                    "text-xl",
                    task.is_completed && "line-through text-muted-foreground"
                  )}
                >
                  {task.name}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                </DialogDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {task.priority !== "none" && (
                <Badge
                  className={cn("text-white", priorityConfig.color)}
                  style={{ backgroundColor: priorityConfig.color.replace("bg-", "") }}
                >
                  {priorityConfig.label} Priority
                </Badge>
              )}
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6">
            {/* Description */}
            {task.description && (
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            )}

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              {task.date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Scheduled: {format(new Date(task.date), "MMMM d, yyyy")}
                  </span>
                </div>
              )}

              {/* Deadline */}
              {task.deadline && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Due: {format(new Date(task.deadline), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
              )}

              {/* Estimate */}
              {task.estimate_minutes && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Est. {Math.floor(task.estimate_minutes / 60)}h {task.estimate_minutes % 60}m
                  </span>
                </div>
              )}

              {/* Recurring */}
              {task.recurring_pattern && (
                <div className="flex items-center gap-2 text-sm">
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                  <span>Recurring</span>
                </div>
              )}
            </div>

            {/* Labels */}
            {task.labels.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Labels
                </h4>
                <div className="flex flex-wrap gap-2">
                  {task.labels.map((label) => (
                    <Badge
                      key={label.id}
                      variant="secondary"
                      style={label.color ? { backgroundColor: label.color + "20", color: label.color } : {}}
                    >
                      {label.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Subtasks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Subtasks
                  {totalSubtasks > 0 && (
                    <span className="text-muted-foreground">
                      ({completedSubtasks}/{totalSubtasks})
                    </span>
                  )}
                </h4>
              </div>
              
              {/* Subtask Progress Bar */}
              {totalSubtasks > 0 && (
                <div className="h-1 bg-muted rounded-full mb-3 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${(completedSubtasks / totalSubtasks) * 100}%`,
                    }}
                  />
                </div>
              )}

              {/* Subtask List */}
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 group"
                  >
                    <Checkbox
                      checked={subtask.is_completed}
                      onCheckedChange={() => handleToggleSubtask(subtask.id, subtask.is_completed)}
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        subtask.is_completed && "line-through text-muted-foreground"
                      )}
                    >
                      {subtask.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteSubtask(subtask.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                {/* Add Subtask */}
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="Add subtask..."
                    className="flex-1 h-8"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddSubtask()
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddSubtask}
                    disabled={!newSubtask.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Reminders */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Reminders
              </h4>
              <div className="space-y-2">
                {task.reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
                  >
                    <span>
                      {format(new Date(reminder.reminder_time), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDeleteReminder(reminder.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {!showReminderInput ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReminderInput(true)}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Add Reminder
                  </Button>
                ) : (
                  <div className="p-3 border rounded-lg space-y-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <Calendar className="mr-2 h-4 w-4" />
                          {reminderDate ? format(reminderDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={reminderDate}
                          onSelect={setReminderDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddReminder} disabled={!reminderDate}>
                        Add
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowReminderInput(false)
                          setReminderDate(undefined)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments - Placeholder */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments
              </h4>
              <Button variant="outline" size="sm">
                <Paperclip className="h-4 w-4 mr-2" />
                Add Attachment
              </Button>
            </div>

            {/* Activity Log */}
            <Separator />
            <div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
                onClick={() => setShowActivity(!showActivity)}
              >
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Activity Log
                  {logs.length > 0 && (
                    <Badge variant="secondary">{logs.length}</Badge>
                  )}
                </span>
                {showActivity ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              
              <AnimatePresence>
                {showActivity && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <TaskActivityLog logs={logs} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
