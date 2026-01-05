export type TaskPriority = 'high' | 'medium' | 'low' | 'none';
export type TaskAction = 'created' | 'updated' | 'completed' | 'uncompleted' | 'deleted';

export interface List {
  id: string;
  name: string;
  color: string | null;
  emoji: string | null;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Task {
  id: string;
  list_id: string;
  name: string;
  description: string | null;
  date: string | null;
  deadline: string | null;
  priority: TaskPriority;
  is_completed: boolean;
  completed_at: string | null;
  estimate_minutes: number | null;
  actual_minutes: number | null;
  recurring_pattern: string | null;
  attachments: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Label {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  created_at: Date;
}

export interface TaskLabel {
  task_id: string;
  label_id: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  name: string;
  is_completed: boolean;
  created_at: Date;
}

export interface TaskReminder {
  id: string;
  task_id: string;
  reminder_time: Date;
  is_triggered: boolean;
  created_at: Date;
}

export interface TaskLog {
  id: string;
  task_id: string;
  action: TaskAction;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: Date;
  created_by: string | null;
}

// Extended types with relations
export interface TaskWithRelations extends Omit<Task, 'labels' | 'subtasks' | 'reminders'> {
  labels: Label[];
  subtasks: Subtask[];
  reminders: TaskReminder[];
}

export interface ListWithTaskCount extends List {
  task_count: number;
  completed_count: number;
}

// Input types for create operations
export interface CreateListInput {
  name: string;
  color?: string | null;
  emoji?: string | null;
  is_default?: boolean;
}

export interface CreateTaskInput {
  list_id: string;
  name: string;
  description?: string | null;
  date?: string | null;
  deadline?: string | null;
  priority?: TaskPriority;
  estimate_minutes?: number | null;
  recurring_pattern?: string | null;
  attachments?: string | null;
}

export interface CreateLabelInput {
  name: string;
  color?: string | null;
  icon?: string | null;
}

export interface CreateSubtaskInput {
  task_id: string;
  name: string;
}

export interface CreateReminderInput {
  task_id: string;
  reminder_time: string;
}

export interface CreateLogInput {
  task_id: string;
  action: TaskAction;
  field_changed?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  created_by?: string | null;
}

export interface UpdateListInput {
  name?: string;
  color?: string | null;
  emoji?: string | null;
}

export interface UpdateTaskInput {
  name?: string;
  description?: string | null;
  date?: string | null;
  deadline?: string | null;
  priority?: TaskPriority;
  list_id?: string;
  estimate_minutes?: number | null;
  actual_minutes?: number | null;
  recurring_pattern?: string | null;
  attachments?: string | null;
}

export interface UpdateSubtaskInput {
  name?: string;
  is_completed?: boolean;
}

export type ViewMode = 'today' | 'week' | 'upcoming' | 'all' | 'list';
