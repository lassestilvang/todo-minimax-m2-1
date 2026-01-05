import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbPath = path.join(__dirname, '..', '..', '..', 'data', 'test.db');

// Test database utilities
export function createTestDb(): Database.Database {
  // Remove existing test database
  try {
    require('fs').unlinkSync(testDbPath);
  } catch {
    // Ignore if file doesn't exist
  }

  const db = new Database(testDbPath);

  // Initialize schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT,
      emoji TEXT,
      is_default INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      list_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      date TEXT,
      deadline TEXT,
      priority TEXT DEFAULT 'none' CHECK(priority IN ('high', 'medium', 'low', 'none')),
      is_completed INTEGER DEFAULT 0,
      completed_at TEXT,
      estimate_minutes INTEGER,
      actual_minutes INTEGER,
      recurring_pattern TEXT,
      attachments TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS labels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT,
      icon TEXT,
      created_at TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS task_labels (
      task_id TEXT NOT NULL,
      label_id TEXT NOT NULL,
      PRIMARY KEY (task_id, label_id),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      name TEXT NOT NULL,
      is_completed INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS task_reminders (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      reminder_time TEXT NOT NULL,
      is_triggered INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS task_logs (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('created', 'updated', 'completed', 'uncompleted', 'deleted')),
      field_changed TEXT,
      old_value TEXT,
      new_value TEXT,
      created_at TEXT NOT NULL,
      created_by TEXT DEFAULT 'user',
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);

  // Seed default Inbox
  const inboxCheck = db.prepare('SELECT COUNT(*) as count FROM lists WHERE is_default = 1').get() as { count: number };
  if (inboxCheck.count === 0) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO lists (id, name, color, emoji, is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), 'Inbox', '#3b82f6', '📥', 1, now, now);
  }

  return db;
}

export function closeTestDb(db: Database.Database) {
  db.close();
}

export function cleanupTestDb(db: Database.Database) {
  // Clean up test data
  db.prepare('DELETE FROM task_labels').run();
  db.prepare('DELETE FROM task_reminders').run();
  db.prepare('DELETE FROM task_logs').run();
  db.prepare('DELETE FROM subtasks').run();
  db.prepare('DELETE FROM tasks').run();
  db.prepare('DELETE FROM labels').run();
  db.prepare('DELETE FROM lists WHERE is_default = 0').run();
}

export function generateTestList() {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    name: `Test List ${Date.now()}`,
    color: '#ff0000',
    emoji: '🧪',
    is_default: false,
    created_at: now,
    updated_at: now,
  };
}

export function generateTestTask(listId: string) {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    list_id: listId,
    name: `Test Task ${Date.now()}`,
    description: 'Test description',
    date: new Date().toISOString().split('T')[0],
    deadline: null,
    priority: 'high' as const,
    is_completed: 0,
    completed_at: null,
    estimate_minutes: 30,
    actual_minutes: null,
    recurring_pattern: null,
    attachments: null,
    created_at: now,
    updated_at: now,
  };
}

export function generateTestLabel() {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    name: `Test Label ${Date.now()}`,
    color: '#00ff00',
    icon: '🏷️',
    created_at: now,
  };
}

export function generateTestSubtask(taskId: string) {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    task_id: taskId,
    name: `Test Subtask ${Date.now()}`,
    is_completed: 0,
    created_at: now,
  };
}
