/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, closeDatabase } from './schema';
import type {
  List,
  Task,
  Label,
  TaskLabel,
  Subtask,
  TaskReminder,
  TaskLog,
  TaskWithRelations,
  ListWithTaskCount,
  CreateListInput,
  CreateTaskInput,
  CreateLabelInput,
  CreateSubtaskInput,
  CreateReminderInput,
  CreateLogInput,
  UpdateListInput,
  UpdateTaskInput,
  UpdateSubtaskInput,
  TaskPriority,
  TaskAction,
} from '../types';

// ============== Utility Functions ==============

function parseJSON<T>(json: string | null, defaultValue: T): T {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}

function formatDate(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  if (typeof date === 'string') return date;
  return date.toISOString();
}

// ============== List Operations ==============

export function createList(data: CreateListInput): List {
  const db = getDatabase();
  const now = new Date().toISOString();
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO lists (id, name, color, emoji, is_default, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, data.name, data.color ?? null, data.emoji ?? null, data.is_default ? 1 : 0, now, now);
  closeDatabase(db);

  return {
    id,
    name: data.name,
    color: data.color ?? null,
    emoji: data.emoji ?? null,
    is_default: data.is_default ?? false,
    created_at: new Date(now),
    updated_at: new Date(now),
  };
}

export function updateList(id: string, data: UpdateListInput): List | null {
  const db = getDatabase();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.color !== undefined) {
    updates.push('color = ?');
    values.push(data.color);
  }
  if (data.emoji !== undefined) {
    updates.push('emoji = ?');
    values.push(data.emoji);
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);

  const stmt = db.prepare(`UPDATE lists SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  closeDatabase(db);

  return getListById(id);
}

export function deleteList(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM lists WHERE id = ?');
  const result = stmt.run(id);
  closeDatabase(db);
  return result.changes > 0;
}

export function getLists(): List[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM lists ORDER BY is_default DESC, created_at ASC');
  const rows = stmt.all() as any[];
  closeDatabase(db);

  return rows.map((row) => ({
    ...row,
    is_default: row.is_default === 1,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  }));
}

export function getListById(id: string): List | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM lists WHERE id = ?');
  const row = stmt.get(id) as any;
  closeDatabase(db);

  if (!row) return null;

  return {
    ...row,
    is_default: row.is_default === 1,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

export function getDefaultList(): List | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM lists WHERE is_default = 1 LIMIT 1');
  const row = stmt.get() as any;
  closeDatabase(db);

  if (!row) return null;

  return {
    ...row,
    is_default: row.is_default === 1,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

export function getListsWithTaskCount(): ListWithTaskCount[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT 
      l.*,
      COUNT(t.id) as task_count,
      SUM(CASE WHEN t.is_completed = 1 THEN 1 ELSE 0 END) as completed_count
    FROM lists l
    LEFT JOIN tasks t ON l.id = t.list_id
    GROUP BY l.id
    ORDER BY l.is_default DESC, l.created_at ASC
  `);
  const rows = stmt.all() as any[];
  closeDatabase(db);

  return rows.map((row) => ({
    ...row,
    is_default: row.is_default === 1,
    task_count: row.task_count || 0,
    completed_count: row.completed_count || 0,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  }));
}

// ============== Label Operations ==============

export function createLabel(data: CreateLabelInput): Label {
  const db = getDatabase();
  const now = new Date().toISOString();
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO labels (id, name, color, icon, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(id, data.name, data.color ?? null, data.icon ?? null, now);
  closeDatabase(db);

  return {
    id,
    name: data.name,
    color: data.color ?? null,
    icon: data.icon ?? null,
    created_at: new Date(now),
  };
}

export function updateLabel(id: string, data: Partial<CreateLabelInput>): Label | null {
  const db = getDatabase();
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.color !== undefined) {
    updates.push('color = ?');
    values.push(data.color);
  }
  if (data.icon !== undefined) {
    updates.push('icon = ?');
    values.push(data.icon);
  }

  if (updates.length === 0) return getLabelById(id);

  values.push(id);
  const stmt = db.prepare(`UPDATE labels SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  closeDatabase(db);

  return getLabelById(id);
}

export function deleteLabel(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM labels WHERE id = ?');
  const result = stmt.run(id);
  closeDatabase(db);
  return result.changes > 0;
}

export function getLabels(): Label[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM labels ORDER BY name ASC');
  const rows = stmt.all() as any[];
  closeDatabase(db);

  return rows.map((row) => ({
    ...row,
    created_at: new Date(row.created_at),
  }));
}

export function getLabelById(id: string): Label | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM labels WHERE id = ?');
  const row = stmt.get(id) as any;
  closeDatabase(db);

  if (!row) return null;

  return {
    ...row,
    created_at: new Date(row.created_at),
  };
}

// ============== Task Operations ==============

export function createTask(data: CreateTaskInput, logAction: boolean = true): Task {
  const db = getDatabase();
  const now = new Date().toISOString();
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, 
      estimate_minutes, recurring_pattern, attachments, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.list_id,
    data.name,
    data.description ?? null,
    formatDate(data.date),
    formatDate(data.deadline),
    data.priority ?? 'none',
    data.estimate_minutes ?? null,
    data.recurring_pattern ?? null,
    data.attachments ? JSON.stringify(data.attachments) : null,
    now,
    now
  );

  if (logAction) {
    createLog({ task_id: id, action: 'created' });
  }

  closeDatabase(db);

  return {
    id,
    ...data,
    description: data.description ?? null,
    date: data.date ?? null,
    deadline: data.deadline ?? null,
    priority: data.priority ?? 'none',
    is_completed: false,
    completed_at: null,
    estimate_minutes: data.estimate_minutes ?? null,
    actual_minutes: null,
    recurring_pattern: data.recurring_pattern ?? null,
    attachments: data.attachments ? JSON.stringify(data.attachments) : null,
    created_at: new Date(now),
    updated_at: new Date(now),
  };
}

export function updateTask(id: string, data: UpdateTaskInput, logAction: boolean = true): Task | null {
  const db = getDatabase();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  if (data.date !== undefined) {
    updates.push('date = ?');
    values.push(formatDate(data.date));
  }
  if (data.deadline !== undefined) {
    updates.push('deadline = ?');
    values.push(formatDate(data.deadline));
  }
  if (data.priority !== undefined) {
    updates.push('priority = ?');
    values.push(data.priority);
  }
  if (data.list_id !== undefined) {
    updates.push('list_id = ?');
    values.push(data.list_id);
  }
  if (data.estimate_minutes !== undefined) {
    updates.push('estimate_minutes = ?');
    values.push(data.estimate_minutes);
  }
  if (data.actual_minutes !== undefined) {
    updates.push('actual_minutes = ?');
    values.push(data.actual_minutes);
  }
  if (data.recurring_pattern !== undefined) {
    updates.push('recurring_pattern = ?');
    values.push(data.recurring_pattern);
  }
  if (data.attachments !== undefined) {
    updates.push('attachments = ?');
    values.push(data.attachments ? JSON.stringify(data.attachments) : null);
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);

  const stmt = db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  if (logAction) {
    createLog({ task_id: id, action: 'updated' });
  }

  closeDatabase(db);

  return getTaskById(id);
}

export function deleteTask(id: string, logAction: boolean = true): boolean {
  const db = getDatabase();

  if (logAction) {
    createLog({ task_id: id, action: 'deleted' });
  }

  const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
  const result = stmt.run(id);
  closeDatabase(db);
  return result.changes > 0;
}

export function getTaskById(id: string): Task | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  const row = stmt.get(id) as any;
  closeDatabase(db);

  if (!row) return null;

  return {
    ...row,
    is_completed: row.is_completed === 1,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
    completed_at: row.completed_at ? new Date(row.completed_at) : null,
  };
}

export function getTaskByIdWithRelations(id: string): TaskWithRelations | null {
  const task = getTaskById(id);
  if (!task) return null;

  const labels = getLabelsForTask(id);
  const subtasks = getSubtasksByTaskId(id);
  const reminders = getRemindersForTask(id);

  return {
    ...task,
    labels,
    subtasks,
    reminders,
  };
}

export function getTasksByListId(listId: string): Task[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM tasks WHERE list_id = ? ORDER BY created_at DESC');
  const rows = stmt.all(listId) as any[];
  closeDatabase(db);

  return rows.map((row) => ({
    ...row,
    is_completed: row.is_completed === 1,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
    completed_at: row.completed_at ? new Date(row.completed_at) : null,
  }));
}

export function getTasksByDateRange(startDate: string, endDate: string): Task[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM tasks 
    WHERE date >= ? AND date <= ?
    ORDER BY date ASC, created_at DESC
  `);
  const rows = stmt.all(startDate, endDate) as any[];
  closeDatabase(db);

  return rows.map((row) => ({
    ...row,
    is_completed: row.is_completed === 1,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
    completed_at: row.completed_at ? new Date(row.completed_at) : null,
  }));
}

export function getTodayTasks(): Task[] {
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];

  const stmt = db.prepare(`
    SELECT * FROM tasks 
    WHERE date = ? AND is_completed = 0
    ORDER BY priority DESC, created_at DESC
  `);
  const rows = stmt.all(today) as any[];
  closeDatabase(db);

  return rows.map((row) => ({
    ...row,
    is_completed: row.is_completed === 1,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
    completed_at: row.completed_at ? new Date(row.completed_at) : null,
  }));
}

export function getWeekTasks(): Task[] {
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const stmt = db.prepare(`
    SELECT * FROM tasks 
    WHERE date >= ? AND date <= ? AND is_completed = 0
    ORDER BY date ASC, priority DESC
  `);
  const rows = stmt.all(today, nextWeekStr) as any[];
  closeDatabase(db);

  return rows.map((row) => ({
    ...row,
    is_completed: row.is_completed === 1,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
    completed_at: row.completed_at ? new Date(row.completed_at) : null,
  }));
}

export function getUpcomingTasks(): Task[] {
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];

  const stmt = db.prepare(`
    SELECT * FROM tasks 
    WHERE date >= ? AND is_completed = 0
    ORDER BY date ASC, priority DESC
  `);
  const rows = stmt.all(today) as any[];
  closeDatabase(db);

  return rows.map((row) => ({
    ...row,
    is_completed: row.is_completed === 1,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
    completed_at: row.completed_at ? new Date(row.completed_at) : null,
  }));
}

export function getAllTasks(): Task[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC');
  const rows = stmt.all() as any[];
  closeDatabase(db);

  return rows.map((row) => ({
    ...row,
    is_completed: row.is_completed === 1,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
    completed_at: row.completed_at ? new Date(row.completed_at) : null,
  }));
}

export function toggleTaskCompletion(id: string): Task | null {
  const db = getDatabase();
  const now = new Date().toISOString();

  const task = getTaskById(id);
  if (!task) return null;

  const newCompleted = !task.is_completed;
  const completedAt = newCompleted ? now : null;
  const action: TaskAction = newCompleted ? 'completed' : 'uncompleted';

  const stmt = db.prepare(`
    UPDATE tasks SET is_completed = ?, completed_at = ?, updated_at = ? WHERE id = ?
  `);
  stmt.run(newCompleted ? 1 : 0, completedAt, now, id);

  createLog({ task_id: id, action });
  closeDatabase(db);

  return getTaskById(id);
}

export function getOverdueTaskCount(): number {
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];

  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM tasks 
    WHERE date < ? AND is_completed = 0
  `);
  const result = stmt.get(today) as { count: number };
  closeDatabase(db);

  return result.count;
}

export function getOverdueTasks(): Task[] {
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];

  const stmt = db.prepare(`
    SELECT * FROM tasks 
    WHERE date < ? AND is_completed = 0
    ORDER BY date ASC, priority DESC
  `);
  const rows = stmt.all(today) as any[];
  closeDatabase(db);

  return rows.map((row) => ({
    ...row,
    is_completed: row.is_completed === 1,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
    completed_at: row.completed_at ? new Date(row.completed_at) : null,
  }));
}

// ============== Subtask Operations ==============

export function createSubtask(data: CreateSubtaskInput): Subtask {
  const db = getDatabase();
  const now = new Date().toISOString();
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO subtasks (id, task_id, name, is_completed, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(id, data.task_id, data.name, 0, now);
  closeDatabase(db);

  return {
    id,
    task_id: data.task_id,
    name: data.name,
    is_completed: false,
    created_at: new Date(now),
  };
}

export function updateSubtask(id: string, data: UpdateSubtaskInput): Subtask | null {
  const db = getDatabase();
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.is_completed !== undefined) {
    updates.push('is_completed = ?');
    values.push(data.is_completed ? 1 : 0);
  }

  if (updates.length === 0) return getSubtaskById(id);

  values.push(id);
  const stmt = db.prepare(`UPDATE subtasks SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  closeDatabase(db);

  return getSubtaskById(id);
}

export function deleteSubtask(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM subtasks WHERE id = ?');
  const result = stmt.run(id);
  closeDatabase(db);
  return result.changes > 0;
}

export function getSubtasksByTaskId(taskId: string): Subtask[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY created_at ASC');
  const rows = stmt.all(taskId) as any[];
  closeDatabase(db);

  return rows.map((row) => ({
    ...row,
    is_completed: row.is_completed === 1,
    created_at: new Date(row.created_at),
  }));
}

export function getSubtaskById(id: string): Subtask | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM subtasks WHERE id = ?');
  const row = stmt.get(id) as any;
  closeDatabase(db);

  if (!row) return null;

  return {
    ...row,
    is_completed: row.is_completed === 1,
    created_at: new Date(row.created_at),
  };
}

// ============== Task Label Operations (Many-to-Many) ==============

export function addLabelToTask(taskId: string, labelId: string): boolean {
  const db = getDatabase();
  
  // Check if already exists
  const existing = db.prepare('SELECT * FROM task_labels WHERE task_id = ? AND label_id = ?').get(taskId, labelId);
  if (existing) {
    closeDatabase(db);
    return false;
  }

  const stmt = db.prepare('INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)');
  const result = stmt.run(taskId, labelId);
  closeDatabase(db);
  return result.changes > 0;
}

export function removeLabelFromTask(taskId: string, labelId: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM task_labels WHERE task_id = ? AND label_id = ?');
  const result = stmt.run(taskId, labelId);
  closeDatabase(db);
  return result.changes > 0;
}

export function getLabelsForTask(taskId: string): Label[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT l.* FROM labels l
    INNER JOIN task_labels tl ON l.id = tl.label_id
    WHERE tl.task_id = ?
    ORDER BY l.name ASC
  `);
  const rows = stmt.all(taskId) as any[];
  closeDatabase(db);

  return rows.map((row) => ({
    ...row,
    created_at: new Date(row.created_at),
  }));
}

export function getTasksForLabel(labelId: string): Task[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT t.* FROM tasks t
    INNER JOIN task_labels tl ON t.id = tl.task_id
    WHERE tl.label_id = ?
    ORDER BY t.created_at DESC
  `);
  const rows = stmt.all(labelId) as any[];
  closeDatabase(db);

  return rows.map((row) => ({
    ...row,
    is_completed: row.is_completed === 1,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
    completed_at: row.completed_at ? new Date(row.completed_at) : null,
  }));
}

// ============== Reminder Operations ==============

export function createReminder(data: CreateReminderInput): TaskReminder {
  const db = getDatabase();
  const now = new Date().toISOString();
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO task_reminders (id, task_id, reminder_time, is_triggered, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(id, data.task_id, data.reminder_time, 0, now);
  closeDatabase(db);

  return {
    id,
    task_id: data.task_id,
    reminder_time: new Date(data.reminder_time),
    is_triggered: false,
    created_at: new Date(now),
  };
}

export function getRemindersForTask(taskId: string): TaskReminder[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM task_reminders 
    WHERE task_id = ? 
    ORDER BY reminder_time ASC
  `);
  const rows = stmt.all(taskId) as any[];
  closeDatabase(db);

  return rows.map((row) => ({
    ...row,
    is_triggered: row.is_triggered === 1,
    reminder_time: new Date(row.reminder_time),
    created_at: new Date(row.created_at),
  }));
}

export function getPendingReminders(): TaskReminder[] {
  const db = getDatabase();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    SELECT * FROM task_reminders 
    WHERE reminder_time <= ? AND is_triggered = 0
    ORDER BY reminder_time ASC
  `);
  const rows = stmt.all(now) as any[];
  closeDatabase(db);

  return rows.map((row) => ({
    ...row,
    is_triggered: row.is_triggered === 1,
    reminder_time: new Date(row.reminder_time),
    created_at: new Date(row.created_at),
  }));
}

export function markReminderTriggered(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE task_reminders SET is_triggered = 1 WHERE id = ?');
  const result = stmt.run(id);
  closeDatabase(db);
  return result.changes > 0;
}

export function deleteReminder(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM task_reminders WHERE id = ?');
  const result = stmt.run(id);
  closeDatabase(db);
  return result.changes > 0;
}

// ============== Task Log Operations ==============

export function createLog(data: CreateLogInput): TaskLog {
  const db = getDatabase();
  const now = new Date().toISOString();
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO task_logs (id, task_id, action, field_changed, old_value, new_value, created_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.task_id,
    data.action,
    data.field_changed ?? null,
    data.old_value ?? null,
    data.new_value ?? null,
    now,
    data.created_by ?? 'user'
  );
  closeDatabase(db);

  return {
    id,
    task_id: data.task_id,
    action: data.action,
    field_changed: data.field_changed ?? null,
    old_value: data.old_value ?? null,
    new_value: data.new_value ?? null,
    created_at: new Date(now),
    created_by: data.created_by ?? 'user',
  };
}

export function getLogsForTask(taskId: string): TaskLog[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM task_logs 
    WHERE task_id = ?
    ORDER BY created_at DESC
  `);
  const rows = stmt.all(taskId) as any[];
  closeDatabase(db);

  return rows.map((row) => ({
    ...row,
    created_at: new Date(row.created_at),
  }));
}

export function getRecentLogs(limit: number = 50): TaskLog[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM task_logs 
    ORDER BY created_at DESC
    LIMIT ?
  `);
  const rows = stmt.all(limit) as any[];
  closeDatabase(db);

  return rows.map((row) => ({
    ...row,
    created_at: new Date(row.created_at),
  }));
}

// ============== Search Operations ==============

export function searchTasks(query: string): Task[] {
  if (!query.trim()) return [];

  const db = getDatabase();
  const searchTerm = `%${query.toLowerCase()}%`;

  const stmt = db.prepare(`
    SELECT * FROM tasks 
    WHERE LOWER(name) LIKE ? OR LOWER(description) LIKE ?
    ORDER BY 
      CASE 
        WHEN LOWER(name) LIKE ? THEN 1 
        ELSE 2 
      END,
      created_at DESC
    LIMIT 50
  `);

  const rows = stmt.all(searchTerm, searchTerm, searchTerm) as any[];
  closeDatabase(db);

  return rows.map((row) => ({
    ...row,
    is_completed: row.is_completed === 1,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
    completed_at: row.completed_at ? new Date(row.completed_at) : null,
  }));
}

export function searchTasksWithRelations(query: string): (TaskWithRelations & { score: number })[] {
  const tasks = searchTasks(query);
  
  return tasks.map((task) => ({
    ...task,
    labels: getLabelsForTask(task.id),
    subtasks: getSubtasksByTaskId(task.id),
    reminders: getRemindersForTask(task.id),
    score: calculateSearchScore(task, query),
  }));
}

function calculateSearchScore(task: Task, query: string): number {
  const queryLower = query.toLowerCase();
  const nameLower = task.name.toLowerCase();
  const descLower = (task.description || '').toLowerCase();

  let score = 0;

  // Exact match in name
  if (nameLower === queryLower) score += 100;
  // Starts with query
  else if (nameLower.startsWith(queryLower)) score += 50;
  // Contains in name
  else if (nameLower.includes(queryLower)) score += 30;

  // Contains in description
  if (descLower.includes(queryLower)) score += 10;

  // Boost for incomplete tasks
  if (!task.is_completed) score += 5;

  // Boost for high priority
  if (task.priority === 'high') score += 3;

  return score;
}

// ============== Bulk Operations ==============

export function deleteTasksByListId(listId: string): number {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM tasks WHERE list_id = ?');
  const result = stmt.run(listId);
  closeDatabase(db);
  return result.changes;
}

export function completeAllTasksInList(listId: string): number {
  const db = getDatabase();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE tasks SET is_completed = 1, completed_at = ?, updated_at = ? 
    WHERE list_id = ? AND is_completed = 0
  `);
  const result = stmt.run(now, now, listId);
  closeDatabase(db);
  return result.changes;
}
