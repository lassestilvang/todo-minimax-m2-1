"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock, Tag, Plus, X, GripVertical, Repeat, Bell, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createTaskAction, updateTaskAction } from "@/app/actions/task-actions"
import type { TaskWithRelations, List, Label as LabelType } from "@/lib/types"
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validators/task-validators"
import { createTaskSchema, updateTaskSchema } from "@/lib/validators/task-validators"

interface TaskFormProps {
  task?: TaskWithRelations | null
  lists: List[]
  allLabels: LabelType[]
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultListId?: string
}

const PRIORITY_OPTIONS = [
  { value: "none", label: "None", color: "bg-muted" },
  { value: "low", label: "Low", color: "bg-blue-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "high", label: "High", color: "bg-red-500" },
] as const

const RECURRING_OPTIONS = [
  { value: "none", label: "None" },
  { value: "every_day", label: "Every day" },
  { value: "every_week", label: "Every week" },
  { value: "every_weekday", label: "Every weekday" },
  { value: "every_month", label: "Every month" },
  { value: "every_year", label: "Every year" },
  { value: "custom", label: "Custom..." },
]

export function TaskForm({
  task,
  lists,
  allLabels,
  open,
  onOpenChange,
  defaultListId,
}: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [subtasks, setSubtasks] = React.useState<{ id: string; name: string; is_completed: boolean }[]>([])
  const [newLabelName, setNewLabelName] = React.useState("")
  const [showLabelInput, setShowLabelInput] = React.useState(false)

  const isEditing = !!task

  // Define form data type
  interface FormDataType {
    id?: string
    name: string
    description: string
    date: string
    deadline: string
    priority: "high" | "medium" | "low" | "none"
    estimate_minutes: number | null
    list_id: string
    recurring_pattern: string | null
    label_ids: string[]
  }

  // Use type assertion for resolver to avoid complex type mismatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<FormDataType>({
    resolver: zodResolver(isEditing ? updateTaskSchema : createTaskSchema) as any,
    defaultValues: {
      id: task?.id,
      name: task?.name || "",
      description: task?.description || "",
      date: task?.date || "",
      deadline: task?.deadline?.split("T")[0] + "T" + (task?.deadline?.split("T")[1]?.slice(0, 5) || "") || "",
      priority: (task?.priority || "none") as "high" | "medium" | "low" | "none",
      estimate_minutes: task?.estimate_minutes || null,
      list_id: task?.list_id || defaultListId || lists[0]?.id || "",
      recurring_pattern: task?.recurring_pattern || null,
      label_ids: task?.labels?.map(l => l.id) || [],
    },
  })

  // Initialize subtasks when task loads
  React.useEffect(() => {
    if (task?.subtasks) {
      setSubtasks(task.subtasks.map(st => ({
        id: st.id,
        name: st.name,
        is_completed: st.is_completed,
      })))
    } else {
      setSubtasks([])
    }
  }, [task])

  const handleSubmit = async (data: FormDataType) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      
      if (isEditing && task) {
        formData.append("id", task.id)
      }
      
      formData.append("list_id", data.list_id || "")
      formData.append("name", data.name || "")
      formData.append("description", data.description || "")
      formData.append("date", data.date || "")
      formData.append("deadline", data.deadline || "")
      formData.append("priority", data.priority || "none")
      formData.append("estimate_minutes", String(data.estimate_minutes || ""))
      formData.append("recurring_pattern", data.recurring_pattern || "")
      formData.append("label_ids", JSON.stringify(data.label_ids || []))

      let result
      if (isEditing) {
        result = await updateTaskAction(formData)
      } else {
        result = await createTaskAction(formData)
      }

      if (result.success) {
        onOpenChange(false)
      } else {
        console.error(result.error)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addSubtask = () => {
    const newSubtasks = [...subtasks, { id: crypto.randomUUID(), name: "", is_completed: false }]
    setSubtasks(newSubtasks)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.setValue("subtasks" as any, newSubtasks)
  }

  const updateSubtask = (id: string, name: string) => {
    const newSubtasks = subtasks.map(st => st.id === id ? { ...st, name } : st)
    setSubtasks(newSubtasks)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.setValue("subtasks" as any, newSubtasks)
  }

  const removeSubtask = (id: string) => {
    const newSubtasks = subtasks.filter(st => st.id !== id)
    setSubtasks(newSubtasks)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.setValue("subtasks" as any, newSubtasks)
  }

  const toggleLabel = (labelId: string) => {
    const currentLabels = form.getValues("label_ids") || []
    const newLabels = currentLabels.includes(labelId)
      ? currentLabels.filter(id => id !== labelId)
      : [...currentLabels, labelId]
    form.setValue("label_ids", newLabels)
  }

  const formatEstimateTime = (minutes: number | null): string => {
    if (!minutes) return ""
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}`
    }
    return `0:${mins.toString().padStart(2, "0")}`
  }

  const parseEstimateTime = (time: string): number | null => {
    if (!time) return null
    const [hours, minutes] = time.split(":").map(Number)
    if (isNaN(hours) || isNaN(minutes)) return null
    return hours * 60 + minutes
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your task details below."
              : "Add a new task to your list."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Task Name - Required */}
          <div className="space-y-2">
            <Label htmlFor="name" className="required">Task name</Label>
            <Input
              id="name"
              placeholder="What needs to be done?"
              {...form.register("name")}
              className="text-lg font-medium"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add more details about this task..."
              {...form.register("description")}
              rows={3}
            />
          </div>

          {/* List Selection */}
          <div className="space-y-2">
            <Label htmlFor="list_id">List</Label>
            <Select
              value={form.watch("list_id")}
              onValueChange={(value) => form.setValue("list_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a list" />
              </SelectTrigger>
              <SelectContent>
                {lists.map((list) => (
                  <SelectItem key={list.id} value={list.id}>
                    <span className="flex items-center gap-2">
                      {list.emoji && <span>{list.emoji}</span>}
                      <span>{list.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Deadline Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Scheduled Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch("date") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("date") ? format(new Date(form.watch("date")), "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch("date") ? new Date(form.watch("date")) : undefined}
                    onSelect={(date) => form.setValue("date", date ? format(date, "yyyy-MM-dd") : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch("deadline") && "text-muted-foreground"
                    )}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {form.watch("deadline")
                      ? format(new Date(form.watch("deadline")), "PPP p")
                      : "Set deadline"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch("deadline") ? new Date(form.watch("deadline")) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const time = form.watch("deadline") 
                          ? form.watch("deadline").split("T")[1] 
                          : "23:59"
                        form.setValue("deadline", format(date, "yyyy-MM-dd") + "T" + time)
                      } else {
                        form.setValue("deadline", "")
                      }
                    }}
                    initialFocus
                  />
                  <div className="p-3 border-t">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={form.watch("deadline") ? form.watch("deadline").split("T")[1]?.slice(0, 5) || "23:59" : "23:59"}
                      onChange={(e) => {
                        const date = form.watch("deadline")?.split("T")[0] || format(new Date(), "yyyy-MM-dd")
                        form.setValue("deadline", date + "T" + e.target.value)
                      }}
                      className="mt-1"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Priority and Estimate Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(value: "high" | "medium" | "low" | "none") =>
                  form.setValue("priority", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <span className={cn("w-3 h-3 rounded-full", option.color)} />
                        <span>{option.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimate_minutes">Estimated Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="estimate_minutes"
                  type="time"
                  step="60"
                  value={formatEstimateTime(form.watch("estimate_minutes"))}
                  onChange={(e) => {
                    const minutes = parseEstimateTime(e.target.value)
                    form.setValue("estimate_minutes", minutes)
                  }}
                  className="pl-9"
                  placeholder="HH:mm"
                />
              </div>
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <Label>Labels</Label>
            <div className="flex flex-wrap gap-2">
              {allLabels.map((label) => {
                const isSelected = form.watch("label_ids")?.includes(label.id)
                return (
                  <Badge
                    key={label.id}
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-colors",
                      isSelected && label.color
                        ? `bg-[${label.color}]`
                        : ""
                    )}
                    style={isSelected && label.color ? { backgroundColor: label.color } : {}}
                    onClick={() => toggleLabel(label.id)}
                  >
                    <span className="mr-1">{label.icon || <Tag className="h-3 w-3" />}</span>
                    {label.name}
                  </Badge>
                )
              })}
              {showLabelInput ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="Label name"
                    className="h-7 w-24 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        if (newLabelName.trim()) {
                          // In a real implementation, create new label here
                          setNewLabelName("")
                          setShowLabelInput(false)
                        }
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      if (newLabelName.trim()) {
                        setNewLabelName("")
                        setShowLabelInput(false)
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-muted-foreground"
                  onClick={() => setShowLabelInput(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add label
                </Button>
              )}
            </div>
          </div>

          {/* Subtasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Subtasks</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addSubtask}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add subtask
              </Button>
            </div>
            <div className="space-y-2">
              {subtasks.map((subtask, index) => (
                <div key={subtask.id} className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <Input
                    value={subtask.name}
                    onChange={(e) => updateSubtask(subtask.id, e.target.value)}
                    placeholder={`Subtask ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeSubtask(subtask.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {subtasks.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No subtasks yet</p>
              )}
            </div>
          </div>

          {/* Recurring */}
          <div className="space-y-2">
            <Label htmlFor="recurring">Recurring</Label>
            <Select
              value={form.watch("recurring_pattern") || "none"}
              onValueChange={(value) =>
                form.setValue("recurring_pattern", value === "none" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select recurrence" />
              </SelectTrigger>
              <SelectContent>
                {RECURRING_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <Repeat className="h-4 w-4" />
                      <span>{option.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reminders - Placeholder for future implementation */}
          <div className="space-y-2">
            <Label>Reminders</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
            >
              <Bell className="mr-2 h-4 w-4" />
              Add reminder
            </Button>
          </div>

          {/* Attachments - Placeholder for future implementation */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
            >
              <Paperclip className="mr-2 h-4 w-4" />
              Add attachment
            </Button>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
