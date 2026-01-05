import { z } from "zod"

// Task priority enum
export const taskPrioritySchema = z.enum(['high', 'medium', 'low', 'none'])

export type TaskPriority = z.infer<typeof taskPrioritySchema>

// Recurring pattern types
export const recurringPatternSchema = z.object({
  type: z.enum(['none', 'every_day', 'every_week', 'every_weekday', 'every_month', 'every_year', 'custom']),
  interval: z.number().min(1).optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  month: z.number().min(1).max(12).optional(),
})

export type RecurringPattern = z.infer<typeof recurringPatternSchema>

// Time format validation (HH:mm)
const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/

// Date validation helper
function parseDateString(date: string | null | undefined): string | null {
  if (!date) return null
  try {
    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) return null
    return parsed.toISOString().split('T')[0]
  } catch {
    return null
  }
}

// Create Task Schema
export const createTaskSchema = z.object({
  list_id: z.string().uuid("Invalid list ID"),
  name: z.string().min(1, "Task name is required").max(200, "Task name must be 200 characters or less"),
  description: z.string().max(5000, "Description must be 5000 characters or less").nullable().optional(),
  date: z.union([z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), { message: "Date must be in YYYY-MM-DD format" }), z.literal("")]).nullable().optional(),
  deadline: z.union([z.string().refine((val) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val), { message: "Deadline must be in ISO datetime format" }), z.literal("")]).nullable().optional(),
  priority: taskPrioritySchema.default('none'),
  estimate_minutes: z.number().min(0).max(1440).nullable().optional(),
  recurring_pattern: z.string().nullable().optional(),
  label_ids: z.array(z.string().uuid()).default([]),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>

// Update Task Schema
export const updateTaskSchema = z.object({
  id: z.string().uuid("Invalid task ID"),
  name: z.string().min(1, "Task name is required").max(200, "Task name must be 200 characters or less").optional(),
  description: z.string().max(5000, "Description must be 5000 characters or less").nullable().optional(),
  date: z.union([z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), { message: "Date must be in YYYY-MM-DD format" }), z.literal("")]).nullable().optional(),
  deadline: z.union([z.string().refine((val) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val), { message: "Deadline must be in ISO datetime format" }), z.literal("")]).nullable().optional(),
  priority: taskPrioritySchema.optional(),
  list_id: z.string().uuid("Invalid list ID").optional(),
  estimate_minutes: z.number().min(0).max(1440).nullable().optional(),
  actual_minutes: z.number().min(0).max(1440).nullable().optional(),
  recurring_pattern: z.string().nullable().optional(),
  label_ids: z.array(z.string().uuid()).optional(),
}).refine((data) => {
  // If both date and deadline are provided, deadline must be after date
  if (data.date && data.deadline) {
    const date = new Date(data.date)
    const deadline = new Date(data.deadline)
    return deadline >= date
  }
  return true
}, {
  message: "Deadline must be on or after the scheduled date",
  path: ["deadline"],
})

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>

// Subtask Schema
export const subtaskSchema = z.object({
  task_id: z.string().uuid("Invalid task ID"),
  name: z.string().min(1, "Subtask name is required").max(200, "Subtask name must be 200 characters or less"),
})

export type CreateSubtaskInput = z.infer<typeof subtaskSchema>

export const updateSubtaskSchema = z.object({
  id: z.string().uuid("Invalid subtask ID"),
  name: z.string().min(1).max(200).optional(),
  is_completed: z.boolean().optional(),
})

export type UpdateSubtaskInput = z.infer<typeof updateSubtaskSchema>

// Reminder Schema
export const reminderSchema = z.object({
  task_id: z.string().uuid("Invalid task ID"),
  reminder_time: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val), {
    message: "Reminder time must be in ISO datetime format",
  }),
})

export type CreateReminderInput = z.infer<typeof reminderSchema>

// Label Schema
export const createLabelSchema = z.object({
  name: z.string().min(1, "Label name is required").max(50, "Label name must be 50 characters or less"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color").nullable().optional(),
  icon: z.string().max(10).nullable().optional(),
})

export type CreateLabelInput = z.infer<typeof createLabelSchema>

// Time tracking schema
export const timeEntrySchema = z.object({
  task_id: z.string().uuid("Invalid task ID"),
  minutes: z.number().min(0).max(1440),
})

export type TimeEntryInput = z.infer<typeof timeEntrySchema>
