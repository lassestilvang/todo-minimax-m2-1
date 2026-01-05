import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', '..', 'data', 'todo.db');

export function initDatabase(db: Database.Database) {
  // Create lists table
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

  // Create tasks table
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

  // Create labels table
  db.exec(`
    CREATE TABLE IF NOT EXISTS labels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT,
      icon TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // Create task_labels junction table (many-to-many)
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_labels (
      task_id TEXT NOT NULL,
      label_id TEXT NOT NULL,
      PRIMARY KEY (task_id, label_id),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
    )
  `);

  // Create subtasks table
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

  // Create task_reminders table
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

  // Create task_logs table for tracking all changes
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

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
    CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(is_completed);
    CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
    CREATE INDEX IF NOT EXISTS idx_task_labels_task_id ON task_labels(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_labels_label_id ON task_labels(label_id);
    CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_reminders_task_id ON task_reminders(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_reminders_time ON task_reminders(reminder_time);
    CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_logs_created_at ON task_logs(created_at);
  `);

  // Seed default Inbox list if none exists
  const inboxCheck = db.prepare('SELECT COUNT(*) as count FROM lists WHERE is_default = 1').get() as { count: number };
  if (inboxCheck.count === 0) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO lists (id, name, color, emoji, is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), 'Inbox', '#3b82f6', '📥', 1, now, now);
  }
}

export function getDatabase(): Database.Database {
  const db = new Database(dbPath);
  initDatabase(db);
  return db;
}

export function closeDatabase(db: Database.Database) {
  db.close();
}

export { dbPath };
