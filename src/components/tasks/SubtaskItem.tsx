"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Circle, GripVertical, Edit2, Trash2, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { updateSubtaskAction, deleteSubtaskAction } from "@/app/actions/task-actions"
import type { Subtask } from "@/lib/types"

interface SubtaskItemProps {
  subtask: Subtask
  onUpdate?: () => void
  onDelete?: () => void
}

export function SubtaskItem({ subtask, onUpdate, onDelete }: SubtaskItemProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editName, setEditName] = React.useState(subtask.name)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleToggle = async () => {
    setIsUpdating(true)
    try {
      await updateSubtaskAction({ id: subtask.id, is_completed: !subtask.is_completed })
      onUpdate?.()
    } catch (error) {
      console.error("Error toggling subtask:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSave = async () => {
    if (editName.trim() === subtask.name) {
      setIsEditing(false)
      return
    }

    try {
      await updateSubtaskAction({ id: subtask.id, name: editName.trim() })
      setIsEditing(false)
      onUpdate?.()
    } catch (error) {
      console.error("Error updating subtask:", error)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteSubtaskAction(subtask.id, subtask.task_id)
      onDelete?.()
    } catch (error) {
      console.error("Error deleting subtask:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    }
    if (e.key === "Escape") {
      setEditName(subtask.name)
      setIsEditing(false)
    }
  }

  React.useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
    }
  }, [isEditing])

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2 group"
      >
        <div className="w-8" /> {/* Spacer for alignment */}
        <Input
          ref={inputRef}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 h-8"
          disabled={isUpdating}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleSave}
          disabled={!editName.trim()}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => {
            setEditName(subtask.name)
            setIsEditing(false)
          }}
        >
          <X className="h-4 w-4" />
        </Button>
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
        "flex items-center gap-2 group transition-opacity",
        isDeleting && "opacity-50"
      )}
    >
      {/* Drag Handle */}
      <button
        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Checkbox */}
      <Checkbox
        checked={subtask.is_completed}
        onCheckedChange={handleToggle}
        disabled={isUpdating}
        className="h-4 w-4"
      />

      {/* Name */}
      <span
        className={cn(
          "flex-1 text-sm cursor-pointer",
          subtask.is_completed && "line-through text-muted-foreground"
        )}
        onClick={handleToggle}
      >
        {subtask.name}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation()
            setIsEditing(true)
          }}
        >
          <Edit2 className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            handleDelete()
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  )
}

// Compact version for inline display
export function SubtaskProgress({ subtasks }: { subtasks: Subtask[] }) {
  if (subtasks.length === 0) return null

  const completed = subtasks.filter((st) => st.is_completed).length
  const total = subtasks.length
  const progress = (completed / total) * 100

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
          className="h-full bg-primary"
        />
      </div>
      <span className="text-xs text-muted-foreground">
        {completed}/{total}
      </span>
    </div>
  )
}
