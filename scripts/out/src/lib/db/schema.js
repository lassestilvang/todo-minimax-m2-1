"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbPath = void 0;
exports.initDatabase = initDatabase;
exports.getDatabase = getDatabase;
exports.closeDatabase = closeDatabase;
var path_1 = __importDefault(require("path"));
var url_1 = require("url");
var uuid_1 = require("uuid");
var __dirname = path_1.default.dirname((0, url_1.fileURLToPath)(import.meta.url));
var dbPath = path_1.default.join(__dirname, '..', '..', '..', 'data', 'todo.db');
exports.dbPath = dbPath;
function initDatabase(db) {
    // Create lists table
    db.exec("\n    CREATE TABLE IF NOT EXISTS lists (\n      id TEXT PRIMARY KEY,\n      name TEXT NOT NULL,\n      color TEXT,\n      emoji TEXT,\n      is_default INTEGER DEFAULT 0,\n      created_at TEXT NOT NULL,\n      updated_at TEXT NOT NULL\n    )\n  ");
    // Create tasks table
    db.exec("\n    CREATE TABLE IF NOT EXISTS tasks (\n      id TEXT PRIMARY KEY,\n      list_id TEXT NOT NULL,\n      name TEXT NOT NULL,\n      description TEXT,\n      date TEXT,\n      deadline TEXT,\n      priority TEXT DEFAULT 'none' CHECK(priority IN ('high', 'medium', 'low', 'none')),\n      is_completed INTEGER DEFAULT 0,\n      completed_at TEXT,\n      estimate_minutes INTEGER,\n      actual_minutes INTEGER,\n      recurring_pattern TEXT,\n      attachments TEXT,\n      created_at TEXT NOT NULL,\n      updated_at TEXT NOT NULL,\n      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE\n    )\n  ");
    // Create labels table
    db.exec("\n    CREATE TABLE IF NOT EXISTS labels (\n      id TEXT PRIMARY KEY,\n      name TEXT NOT NULL,\n      color TEXT,\n      icon TEXT,\n      created_at TEXT NOT NULL\n    )\n  ");
    // Create task_labels junction table (many-to-many)
    db.exec("\n    CREATE TABLE IF NOT EXISTS task_labels (\n      task_id TEXT NOT NULL,\n      label_id TEXT NOT NULL,\n      PRIMARY KEY (task_id, label_id),\n      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,\n      FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE\n    )\n  ");
    // Create subtasks table
    db.exec("\n    CREATE TABLE IF NOT EXISTS subtasks (\n      id TEXT PRIMARY KEY,\n      task_id TEXT NOT NULL,\n      name TEXT NOT NULL,\n      is_completed INTEGER DEFAULT 0,\n      created_at TEXT NOT NULL,\n      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE\n    )\n  ");
    // Create task_reminders table
    db.exec("\n    CREATE TABLE IF NOT EXISTS task_reminders (\n      id TEXT PRIMARY KEY,\n      task_id TEXT NOT NULL,\n      reminder_time TEXT NOT NULL,\n      is_triggered INTEGER DEFAULT 0,\n      created_at TEXT NOT NULL,\n      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE\n    )\n  ");
    // Create task_logs table for tracking all changes
    db.exec("\n    CREATE TABLE IF NOT EXISTS task_logs (\n      id TEXT PRIMARY KEY,\n      task_id TEXT NOT NULL,\n      action TEXT NOT NULL CHECK(action IN ('created', 'updated', 'completed', 'uncompleted', 'deleted')),\n      field_changed TEXT,\n      old_value TEXT,\n      new_value TEXT,\n      created_at TEXT NOT NULL,\n      created_by TEXT DEFAULT 'user',\n      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE\n    )\n  ");
    // Create indexes for better query performance
    db.exec("\n    CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);\n    CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);\n    CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(is_completed);\n    CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);\n    CREATE INDEX IF NOT EXISTS idx_task_labels_task_id ON task_labels(task_id);\n    CREATE INDEX IF NOT EXISTS idx_task_labels_label_id ON task_labels(label_id);\n    CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);\n    CREATE INDEX IF NOT EXISTS idx_task_reminders_task_id ON task_reminders(task_id);\n    CREATE INDEX IF NOT EXISTS idx_task_reminders_time ON task_reminders(reminder_time);\n    CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id);\n    CREATE INDEX IF NOT EXISTS idx_task_logs_created_at ON task_logs(created_at);\n  ");
    // Seed default Inbox list if none exists
    var inboxCheck = db.prepare('SELECT COUNT(*) as count FROM lists WHERE is_default = 1').get();
    if (inboxCheck.count === 0) {
        var now = new Date().toISOString();
        db.prepare("\n      INSERT INTO lists (id, name, color, emoji, is_default, created_at, updated_at)\n      VALUES (?, ?, ?, ?, ?, ?, ?)\n    ").run((0, uuid_1.v4)(), 'Inbox', '#3b82f6', '📥', 1, now, now);
    }
}
function getDatabase() {
    var db = new better_sqlite3_1.Database(dbPath);
    initDatabase(db);
    return db;
}
function closeDatabase(db) {
    db.close();
}
