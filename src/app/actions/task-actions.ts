"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
import {
  createTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  createReminder,
  deleteReminder as dbDeleteReminder,
  addLabelToTask,
  removeLabelFromTask,
  createLog,
  getTaskById,
  getTaskByIdWithRelations,
  getTasksByListId,
  getTodayTasks,
  getWeekTasks,
  getUpcomingTasks,
  getAllTasks,
  getLabelsForTask,
} from "@/lib/db/operations"
import { createLabel, getLabels } from "@/lib/db/operations"
import type {
  CreateTaskInput,
  UpdateTaskInput,
  CreateSubtaskInput,
  UpdateSubtaskInput,
  CreateReminderInput,
  CreateLabelInput,
} from "@/lib/validators/task-validators"
import type { TaskAction } from "@/lib/types"

// ============ Task Actions ============

export async function createTaskAction(formData: FormData): Promise<{ success: boolean; error?: string; taskId?: string }> {
  try {
    const list_id = formData.get("list_id") as string
    const name = formData.get("name") as string
    const description = formData.get("description") as string || null
    const date = formData.get("date") as string || null
    const deadline = formData.get("deadline") as string || null
    const priority = formData.get("priority") as "high" | "medium" | "low" | "none" || "none"
    const estimate_minutes = formData.get("estimate_minutes") as string || null
    const recurring_pattern = formData.get("recurring_pattern") as string || null
    const label_ids = JSON.parse(formData.get("label_ids") as string || "[]") as string[]

    // Validate required fields
    if (!list_id || !name) {
      return { success: false, error: "List ID and task name are required" }
    }

    const task = createTask({
      list_id,
      name,
      description,
      date,
      deadline,
      priority,
      estimate_minutes: estimate_minutes ? parseInt(estimate_minutes) : null,
      recurring_pattern,
    })

    // Add labels to task
    for (const labelId of label_ids) {
      addLabelToTask(task.id, labelId)
    }

    revalidatePath("/")
    return { success: true, taskId: task.id }
  } catch (error) {
    console.error("Error creating task:", error)
    return { success: false, error: "Failed to create task" }
  }
}

export async function updateTaskAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const description = formData.get("description") as string || null
    const date = formData.get("date") as string || null
    const deadline = formData.get("deadline") as string || null
    const priority = formData.get("priority") as "high" | "medium" | "low" | "none" || undefined
    const list_id = formData.get("list_id") as string || undefined
    const estimate_minutes = formData.get("estimate_minutes") as string || null
    const actual_minutes = formData.get("actual_minutes") as string || null
    const recurring_pattern = formData.get("recurring_pattern") as string || null
    const label_ids = formData.get("label_ids") ? JSON.parse(formData.get("label_ids") as string) as string[] : undefined

    if (!id) {
      return { success: false, error: "Task ID is required" }
    }

    // Get current task for comparison
    const currentTask = getTaskById(id)
    if (!currentTask) {
      return { success: false, error: "Task not found" }
    }

    // Update task
    updateTask(id, {
      name,
      description,
      date,
      deadline,
      priority,
      list_id,
      estimate_minutes: estimate_minutes ? parseInt(estimate_minutes) : null,
      actual_minutes: actual_minutes ? parseInt(actual_minutes) : null,
      recurring_pattern,
    })

    // Update labels if provided
    if (label_ids !== undefined) {
      const currentLabels = await getLabelsForTaskAction(id)
      const currentLabelIds = currentLabels.map(l => l.id)
      
      // Remove labels that are no longer selected
      for (const labelId of currentLabelIds) {
        if (!label_ids.includes(labelId)) {
          removeLabelFromTask(id, labelId)
        }
      }
      
      // Add new labels
      for (const labelId of label_ids) {
        if (!currentLabelIds.includes(labelId)) {
          addLabelToTask(id, labelId)
        }
      }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error updating task:", error)
    return { success: false, error: "Failed to update task" }
  }
}

export async function deleteTaskAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!id) {
      return { success: false, error: "Task ID is required" }
    }

    deleteTask(id)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting task:", error)
    return { success: false, error: "Failed to delete task" }
  }
}

export async function toggleTaskCompletionAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!id) {
      return { success: false, error: "Task ID is required" }
    }

    toggleTaskCompletion(id)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error toggling task completion:", error)
    return { success: false, error: "Failed to toggle task completion" }
  }
}

// ============ Subtask Actions ============

export async function addSubtaskAction(taskId: string, name: string): Promise<{ success: boolean; error?: string; subtaskId?: string }> {
  try {
    if (!taskId || !name) {
      return { success: false, error: "Task ID and subtask name are required" }
    }

    const subtask = createSubtask({ task_id: taskId, name })
    createLog({ task_id: taskId, action: "updated", field_changed: "subtasks", new_value: `Added subtask: ${name}` })
    
    revalidatePath("/")
    return { success: true, subtaskId: subtask.id }
  } catch (error) {
    console.error("Error adding subtask:", error)
    return { success: false, error: "Failed to add subtask" }
  }
}

export async function updateSubtaskAction(data: UpdateSubtaskInput): Promise<{ success: boolean; error?: string }> {
  try {
    if (!data.id) {
      return { success: false, error: "Subtask ID is required" }
    }

    updateSubtask(data.id, data)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error updating subtask:", error)
    return { success: false, error: "Failed to update subtask" }
  }
}

export async function deleteSubtaskAction(id: string, taskId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!id) {
      return { success: false, error: "Subtask ID is required" }
    }

    deleteSubtask(id)
    createLog({ task_id: taskId, action: "updated", field_changed: "subtasks", new_value: "Deleted subtask" })
    
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting subtask:", error)
    return { success: false, error: "Failed to delete subtask" }
  }
}

// ============ Reminder Actions ============

export async function addReminderAction(taskId: string, reminderTime: string): Promise<{ success: boolean; error?: string; reminderId?: string }> {
  try {
    if (!taskId || !reminderTime) {
      return { success: false, error: "Task ID and reminder time are required" }
    }

    const reminder = createReminder({ task_id: taskId, reminder_time: reminderTime })
    createLog({ task_id: taskId, action: "updated", field_changed: "reminder", new_value: `Reminder set for ${reminderTime}` })
    
    revalidatePath("/")
    return { success: true, reminderId: reminder.id }
  } catch (error) {
    console.error("Error adding reminder:", error)
    return { success: false, error: "Failed to add reminder" }
  }
}

export async function deleteReminderAction(id: string, taskId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!id) {
      return { success: false, error: "Reminder ID is required" }
    }

    dbDeleteReminder(id)
    createLog({ task_id: taskId, action: "updated", field_changed: "reminder", new_value: "Removed reminder" })
    
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting reminder:", error)
    return { success: false, error: "Failed to delete reminder" }
  }
}

// ============ Label Actions ============

export async function createLabelAction(data: CreateLabelInput): Promise<{ success: boolean; error?: string; labelId?: string }> {
  try {
    if (!data.name) {
      return { success: false, error: "Label name is required" }
    }

    const label = createLabel(data)
    return { success: true, labelId: label.id }
  } catch (error) {
    console.error("Error creating label:", error)
    return { success: false, error: "Failed to create label" }
  }
}

export async function addLabelToTaskAction(taskId: string, labelId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!taskId || !labelId) {
      return { success: false, error: "Task ID and label ID are required" }
    }

    addLabelToTask(taskId, labelId)
    createLog({ task_id: taskId, action: "updated", field_changed: "labels", new_value: `Added label ${labelId}` })
    
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error adding label to task:", error)
    return { success: false, error: "Failed to add label to task" }
  }
}

export async function removeLabelFromTaskAction(taskId: string, labelId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!taskId || !labelId) {
      return { success: false, error: "Task ID and label ID are required" }
    }

    removeLabelFromTask(taskId, labelId)
    createLog({ task_id: taskId, action: "updated", field_changed: "labels", new_value: `Removed label ${labelId}` })
    
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error removing label from task:", error)
    return { success: false, error: "Failed to remove label from task" }
  }
}

export async function getLabelsForTaskAction(taskId: string) {
  try {
    const labels = getLabelsForTask(taskId)
    return labels
  } catch (error) {
    console.error("Error getting labels for task:", error)
    return []
  }
}

// ============ Task Log Actions ============

export async function logTaskChangeAction(
  taskId: string,
  action: TaskAction,
  field: string | null,
  oldValue: string | null,
  newValue: string | null
): Promise<{ success: boolean }> {
  try {
    createLog({ task_id: taskId, action, field_changed: field, old_value: oldValue, new_value: newValue })
    return { success: true }
  } catch (error) {
    console.error("Error logging task change:", error)
    return { success: false }
  }
}

// ============ Query Actions ============

export async function getTaskAction(id: string) {
  try {
    const task = getTaskByIdWithRelations(id)
    return task
  } catch (error) {
    console.error("Error getting task:", error)
    return null
  }
}

export async function getTasksByListIdAction(listId: string) {
  try {
    const tasks = getTasksByListId(listId)
    return tasks
  } catch (error) {
    console.error("Error getting tasks:", error)
    return []
  }
}

export async function getTodayTasksAction() {
  try {
    const tasks = getTodayTasks()
    return tasks
  } catch (error) {
    console.error("Error getting today's tasks:", error)
    return []
  }
}

export async function getWeekTasksAction() {
  try {
    const tasks = getWeekTasks()
    return tasks
  } catch (error) {
    console.error("Error getting week's tasks:", error)
    return []
  }
}

export async function getUpcomingTasksAction() {
  try {
    const tasks = getUpcomingTasks()
    return tasks
  } catch (error) {
    console.error("Error getting upcoming tasks:", error)
    return []
  }
}

export async function getAllTasksAction() {
  try {
    const tasks = getAllTasks()
    return tasks
  } catch (error) {
    console.error("Error getting all tasks:", error)
    return []
  }
}

export async function getAllLabelsAction() {
  try {
    const labels = getLabels()
    return labels
  } catch (error) {
    console.error("Error getting labels:", error)
    return []
  }
}

// ============ Recurring Task Actions ============

export async function completeRecurringTaskAction(taskId: string): Promise<{ success: boolean; error?: string; nextTaskId?: string }> {
  try {
    const task = getTaskById(taskId)
    if (!task) {
      return { success: false, error: "Task not found" }
    }

    // Mark current task as completed
    toggleTaskCompletion(taskId)

    // If task is recurring, create next occurrence
    if (task.recurring_pattern) {
      try {
        const pattern = JSON.parse(task.recurring_pattern)
        const nextDate = calculateNextOccurrence(new Date(task.date || new Date()), pattern)
        
        const newTask = createTask({
          list_id: task.list_id,
          name: task.name,
          description: task.description,
          date: nextDate,
          deadline: task.deadline ? calculateNextOccurrence(new Date(task.deadline), pattern) : null,
          priority: task.priority,
          estimate_minutes: task.estimate_minutes,
          recurring_pattern: task.recurring_pattern,
        })

        return { success: true, nextTaskId: newTask.id }
      } catch {
        // If recurring pattern is invalid, just complete the task
        return { success: true }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error completing recurring task:", error)
    return { success: false, error: "Failed to complete recurring task" }
  }
}

function calculateNextOccurrence(currentDate: Date, pattern: any): string {
  const nextDate = new Date(currentDate)
  
  switch (pattern.type) {
    case 'every_day':
      nextDate.setDate(nextDate.getDate() + 1)
      break
    case 'every_week':
      nextDate.setDate(nextDate.getDate() + 7)
      break
    case 'every_weekday':
      do {
        nextDate.setDate(nextDate.getDate() + 1)
      } while (nextDate.getDay() === 0 || nextDate.getDay() === 6)
      break
    case 'every_month':
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    case 'every_year':
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      break
    case 'custom':
      if (pattern.interval) {
        nextDate.setDate(nextDate.getDate() + pattern.interval)
      } else {
        nextDate.setDate(nextDate.getDate() + 1)
      }
      break
    default:
      nextDate.setDate(nextDate.getDate() + 1)
  }
  
  return nextDate.toISOString().split('T')[0]
}

// ============ Time Tracking Actions ============

export async function startTimerAction(taskId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Store start time in a cookie or database
    // For now, we'll just update the task to track that a timer is running
    const startTime = new Date().toISOString()
    
    // In a real implementation, you'd want to store the start time more persistently
    // This is a simplified version
    console.log(`Timer started for task ${taskId} at ${startTime}`)
    
    return { success: true }
  } catch (error) {
    console.error("Error starting timer:", error)
    return { success: false, error: "Failed to start timer" }
  }
}

export async function stopTimerAction(taskId: string): Promise<{ success: boolean; error?: string; minutes?: number }> {
  try {
    // Calculate elapsed time and update actual_minutes
    // In a real implementation, you'd retrieve the stored start time
    console.log(`Timer stopped for task ${taskId}`)
    
    // For demo purposes, we'll just return success
    return { success: true, minutes: 0 }
  } catch (error) {
    console.error("Error stopping timer:", error)
    return { success: false, error: "Failed to stop timer" }
  }
}


