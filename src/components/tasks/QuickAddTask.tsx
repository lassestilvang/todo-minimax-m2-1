"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus, Calendar, Clock, Tag, X } from "lucide-react"
import { format, parse, addDays } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { createTaskAction } from "@/app/actions/task-actions"
import type { List } from "@/lib/types"

interface QuickAddTaskProps {
  defaultListId?: string
  lists: List[]
  placeholder?: string
  autoFocus?: boolean
  onTaskCreated?: () => void
}

export function QuickAddTask({
  defaultListId,
  lists,
  placeholder = "Add a task...",
  autoFocus = true,
  onTaskCreated,
}: QuickAddTaskProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [date, setDate] = React.useState<Date | undefined>()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [suggestedDate, setSuggestedDate] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Smart date parsing patterns
  const datePatterns = [
    { pattern: /\b(today|td)\b/i, getDate: () => new Date() },
    { pattern: /\b(tomorrow|tm)\b/i, getDate: () => addDays(new Date(), 1) },
    { pattern: /\b(next week|nw)\b/i, getDate: () => addDays(new Date(), 7) },
    { pattern: /\b(next month|nm)\b/i, getDate: () => addDays(new Date(), 30) },
  ]

  // Parse smart dates from input
  const parseSmartDate = (input: string): { date: Date | null; cleanedInput: string } => {
    for (const { pattern, getDate } of datePatterns) {
      if (pattern.test(input)) {
        return {
          date: getDate(),
          cleanedInput: input.replace(pattern, "").trim(),
        }
      }
    }
    
    // Try to parse explicit dates
    const dateFormats = [
      "MM/dd/yyyy",
      "dd/MM/yyyy",
      "yyyy-MM-dd",
      "MM-dd-yyyy",
      "dd-MM-yyyy",
    ]
    
    for (const fmt of dateFormats) {
      try {
        const parsed = parse(input, fmt, new Date())
        if (!isNaN(parsed.getTime())) {
          return {
            date: parsed,
            cleanedInput: "",
          }
        }
      } catch {
        // Continue to next format
      }
    }
    
    return { date: null, cleanedInput: input }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setName(input)
    
    // Check for smart date patterns
    const { date: smartDate, cleanedInput } = parseSmartDate(input)
    if (smartDate && cleanedInput !== input) {
      setDate(smartDate)
      setSuggestedDate(format(smartDate, "yyyy-MM-dd"))
      // Keep the full input for the task name
    } else if (!suggestedDate) {
      setDate(undefined)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("list_id", defaultListId || lists[0]?.id || "")
      formData.append("name", name.trim())
      formData.append("date", suggestedDate || date ? format(date!, "yyyy-MM-dd") : "")
      formData.append("priority", "none")
      formData.append("label_ids", "[]")

      const result = await createTaskAction(formData)

      if (result.success) {
        setName("")
        setDate(undefined)
        setSuggestedDate(null)
        onTaskCreated?.()
      }
    } catch (error) {
      console.error("Error creating task:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // If user is editing the date, don't submit on Enter
    if (e.key === "Enter" && e.metaKey) {
      handleSubmit(e)
    }
  }

  React.useEffect(() => {
    if (isOpen && autoFocus) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isOpen, autoFocus])

  if (!isOpen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground h-auto py-3"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {placeholder}
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={name}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pr-20"
            disabled={isSubmitting}
          />
          
          {/* Date Indicator */}
          {(date || suggestedDate) && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{format(date || new Date(suggestedDate!), "MMM d")}</span>
            </div>
          )}
        </div>

        {/* Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn(date && "border-primary")}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
            />
            {date && (
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setDate(undefined)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear date
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Submit Button */}
        <Button type="submit" disabled={!name.trim() || isSubmitting}>
          {isSubmitting ? "Adding..." : "Add"}
        </Button>

        {/* Cancel Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsOpen(false)
            setName("")
            setDate(undefined)
            setSuggestedDate(null)
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </form>

      {/* Quick Tips */}
      <p className="text-xs text-muted-foreground mt-2">
        💡 Tip: Type &quot;today&quot;, &quot;tomorrow&quot;, or &quot;next week&quot; for smart dates
      </p>
    </motion.div>
  )
}

// Compact version for headers
export function QuickAddTaskButton({
  defaultListId,
  lists,
  onTaskCreated,
}: {
  defaultListId?: string
  lists: List[]
  onTaskCreated?: () => void
}) {
  const [isAdding, setIsAdding] = React.useState(false)

  if (isAdding) {
    return (
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <Input
          placeholder="Add a task..."
          autoFocus
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const input = e.currentTarget
              if (input.value.trim()) {
                const formData = new FormData()
                formData.append("list_id", defaultListId || lists[0]?.id || "")
                formData.append("name", input.value.trim())
                formData.append("priority", "none")
                formData.append("label_ids", "[]")
                createTaskAction(formData).then(() => {
                  setIsAdding(false)
                  onTaskCreated?.()
                })
              }
            }
            if (e.key === "Escape") {
              setIsAdding(false)
            }
          }}
        />
        <Button
          size="sm"
          onClick={() => setIsAdding(false)}
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={() => setIsAdding(true)}>
      <Plus className="mr-2 h-4 w-4" />
      Add task
    </Button>
  )
}
