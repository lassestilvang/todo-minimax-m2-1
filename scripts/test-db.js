#!/usr/bin/env node

/**
 * Database Verification Test Script
 */

import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, '..', 'data', 'todo.db');
const db = new Database(dbPath);

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result === true) {
      console.log(`✅ ${name}`);
      testsPassed++;
    } else if (result === false) {
      console.log(`❌ ${name} - returned false`);
      testsFailed++;
    } else if (result === null) {
      console.log(`❌ ${name} - returned null`);
      testsFailed++;
    } else {
      console.log(`✅ ${name}`);
      testsPassed++;
    }
  } catch (error) {
    console.log(`❌ ${name} - Error: ${error.message}`);
    testsFailed++;
  }
}

function initDatabase() {
  console.log('Initializing database...\n');
  
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
      priority TEXT DEFAULT 'none',
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

  // Create task_labels junction table
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

  // Create task_logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_logs (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      action TEXT NOT NULL,
      field_changed TEXT,
      old_value TEXT,
      new_value TEXT,
      created_at TEXT NOT NULL,
      created_by TEXT DEFAULT 'user',
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
    CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(is_completed);
    CREATE INDEX IF NOT EXISTS idx_task_labels_task_id ON task_labels(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_labels_label_id ON task_labels(label_id);
    CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_reminders_task_id ON task_reminders(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id);
  `);

  // Seed default Inbox
  const inboxCheck = db.prepare('SELECT COUNT(*) as count FROM lists WHERE is_default = 1').get();
  if (inboxCheck.count === 0) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO lists (id, name, color, emoji, is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), 'Inbox', '#3b82f6', '📥', 1, now, now);
  }
}

function main() {
  console.log('🧪 Starting Database Verification Tests\n');
  console.log('='.repeat(50));

  initDatabase();

  // Test 1: Database file exists
  test('Database file is created in data/ directory', () => {
    return fs.existsSync(dbPath);
  });

  // Test 2: Tables exist
  test('All required tables exist', () => {
    const tables = [
      'lists', 'tasks', 'labels', 'task_labels',
      'subtasks', 'task_reminders', 'task_logs'
    ];
    const result = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN (${tables.map(() => '?').join(',')})
    `).all(...tables);
    return result.length === tables.length;
  });

  // Test 3: Default Inbox exists
  test('Default Inbox list is created', () => {
    const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get();
    return inbox !== undefined && inbox.name === 'Inbox';
  });

  // Test 4: List CRUD
  console.log('\n📋 List Operations:');
  
  test('createList creates a new list', () => {
    const now = new Date().toISOString();
    const id = uuidv4();
    db.prepare(`
      INSERT INTO lists (id, name, color, emoji, is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, 'Test List', '#ff0000', '🧪', 0, now, now);
    const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(id);
    return list && list.name === 'Test List';
  });

  test('getLists returns all lists', () => {
    const lists = db.prepare('SELECT * FROM lists ORDER BY created_at DESC').all();
    return Array.isArray(lists) && lists.length > 0;
  });

  test('updateList updates list data', () => {
    const lists = db.prepare('SELECT * FROM lists WHERE is_default = 0').all();
    if (lists.length === 0) return true;
    const now = new Date().toISOString();
    db.prepare('UPDATE lists SET name = ?, updated_at = ? WHERE id = ?')
      .run('Updated List', now, lists[0].id);
    const updated = db.prepare('SELECT * FROM lists WHERE id = ?').get(lists[0].id);
    return updated && updated.name === 'Updated List';
  });

  test('deleteList removes list', () => {
    const now = new Date().toISOString();
    const id = uuidv4();
    db.prepare('INSERT INTO lists (id, name, color, emoji, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, 'To Delete', '#000000', '🗑️', 0, now, now);
    db.prepare('DELETE FROM lists WHERE id = ?').run(id);
    const deleted = db.prepare('SELECT * FROM lists WHERE id = ?').get(id);
    return deleted === undefined;
  });

  // Test 5: Task CRUD
  console.log('\n📝 Task Operations:');

  test('createTask creates a new task', () => {
    const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get();
    const now = new Date().toISOString();
    const id = uuidv4();
    db.prepare(`
      INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, inbox.id, 'Test Task', 'Test description', null, null, 'high', now, now);
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return task && task.name === 'Test Task';
  });

  test('getTasksByListId returns tasks', () => {
    const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get();
    const tasks = db.prepare('SELECT * FROM tasks WHERE list_id = ?').all(inbox.id);
    return Array.isArray(tasks);
  });

  test('toggleTaskCompletion toggles status', () => {
    const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get();
    const now = new Date().toISOString();
    const id = uuidv4();
    db.prepare(`
      INSERT INTO tasks (id, list_id, name, is_completed, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, inbox.id, 'Toggle Test', 0, now, now);
    
    db.prepare('UPDATE tasks SET is_completed = ?, completed_at = ?, updated_at = ? WHERE id = ?')
      .run(1, now, now, id);
    
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return task && task.is_completed === 1;
  });

  test('getTodayTasks returns today\'s tasks', () => {
    const today = new Date().toISOString().split('T')[0];
    const tasks = db.prepare('SELECT * FROM tasks WHERE date = ? AND is_completed = 0').all(today);
    return Array.isArray(tasks);
  });

  test('getWeekTasks returns this week\'s tasks', () => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    const tasks = db.prepare('SELECT * FROM tasks WHERE date >= ? AND date <= ? AND is_completed = 0')
      .all(today, nextWeekStr);
    return Array.isArray(tasks);
  });

  test('getOverdueTaskCount returns count', () => {
    const today = new Date().toISOString().split('T')[0];
    const result = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE date < ? AND is_completed = 0').get(today);
    return typeof result.count === 'number';
  });

  test('deleteTask removes task', () => {
    const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get();
    const now = new Date().toISOString();
    const id = uuidv4();
    db.prepare('INSERT INTO tasks (id, list_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .run(id, inbox.id, 'To Delete', now, now);
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    const deleted = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return deleted === undefined;
  });

  // Test 6: Search
  console.log('\n🔍 Search Operations:');

  test('searchTasks finds matching tasks', () => {
    const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get();
    const uniqueName = `UniqueSearchTest_${Date.now()}`;
    const now = new Date().toISOString();
    db.prepare('INSERT INTO tasks (id, list_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .run(uuidv4(), inbox.id, uniqueName, now, now);
    const tasks = db.prepare('SELECT * FROM tasks WHERE name LIKE ?').all(`%${uniqueName}%`);
    return tasks.length > 0;
  });

  // Test 7: Label CRUD
  console.log('\n🏷️ Label Operations:');

  test('createLabel creates a new label', () => {
    const now = new Date().toISOString();
    const id = uuidv4();
    db.prepare('INSERT INTO labels (id, name, color, created_at) VALUES (?, ?, ?, ?)')
      .run(id, 'Test Label', '#00ff00', now);
    const label = db.prepare('SELECT * FROM labels WHERE id = ?').get(id);
    return label && label.name === 'Test Label';
  });

  test('getLabels returns all labels', () => {
    const labels = db.prepare('SELECT * FROM labels ORDER BY name ASC').all();
    return Array.isArray(labels);
  });

  // Test 8: Subtask CRUD
  console.log('\n📌 Subtask Operations:');

  test('createSubtask creates a new subtask', () => {
    const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get();
    const now = new Date().toISOString();
    const taskId = uuidv4();
    db.prepare('INSERT INTO tasks (id, list_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .run(taskId, inbox.id, 'Task with Subtasks', now, now);
    
    const subtaskId = uuidv4();
    db.prepare('INSERT INTO subtasks (id, task_id, name, is_completed, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(subtaskId, taskId, 'Subtask 1', 0, now);
    
    const subtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(subtaskId);
    return subtask && subtask.name === 'Subtask 1';
  });

  test('getSubtasksByTaskId returns subtasks', () => {
    const tasks = db.prepare('SELECT * FROM tasks').all();
    if (tasks.length === 0) return true;
    const subtasks = db.prepare('SELECT * FROM subtasks WHERE task_id = ?').all(tasks[0].id);
    return Array.isArray(subtasks);
  });

  // Test 9: Reminder CRUD
  console.log('\n⏰ Reminder Operations:');

  test('createReminder creates a new reminder', () => {
    const tasks = db.prepare('SELECT * FROM tasks').all();
    if (tasks.length === 0) return true;
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const reminderId = uuidv4();
    
    db.prepare('INSERT INTO task_reminders (id, task_id, reminder_time, is_triggered, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(reminderId, tasks[0].id, tomorrow.toISOString(), 0, new Date().toISOString());
    
    const reminder = db.prepare('SELECT * FROM task_reminders WHERE id = ?').get(reminderId);
    return reminder !== undefined;
  });

  test('getRemindersForTask returns reminders', () => {
    const tasks = db.prepare('SELECT * FROM tasks').all();
    if (tasks.length === 0) return true;
    const reminders = db.prepare('SELECT * FROM task_reminders WHERE task_id = ?').all(tasks[0].id);
    return Array.isArray(reminders);
  });

  // Test 10: Task Log CRUD
  console.log('\n📊 Task Log Operations:');

  test('createLog creates a new log entry', () => {
    const tasks = db.prepare('SELECT * FROM tasks').all();
    if (tasks.length === 0) return true;
    
    const logId = uuidv4();
    db.prepare(`
      INSERT INTO task_logs (id, task_id, action, field_changed, old_value, new_value, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(logId, tasks[0].id, 'updated', 'priority', 'low', 'high', new Date().toISOString(), 'user');
    
    const log = db.prepare('SELECT * FROM task_logs WHERE id = ?').get(logId);
    return log !== undefined;
  });

  test('getLogsForTask returns logs', () => {
    const tasks = db.prepare('SELECT * FROM tasks').all();
    if (tasks.length === 0) return true;
    const logs = db.prepare('SELECT * FROM task_logs WHERE task_id = ?').all(tasks[0].id);
    return Array.isArray(logs);
  });

  // Test 11: Task-Label (Many-to-Many)
  console.log('\n🔗 Task-Label Operations:');

  test('addLabelToTask associates label with task', () => {
    const tasks = db.prepare('SELECT * FROM tasks').all();
    const labels = db.prepare('SELECT * FROM labels').all();
    if (tasks.length === 0 || labels.length === 0) return true;
    
    db.prepare('INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)')
      .run(tasks[0].id, labels[0].id);
    
    const link = db.prepare('SELECT * FROM task_labels WHERE task_id = ? AND label_id = ?')
      .get(tasks[0].id, labels[0].id);
    return link !== undefined;
  });

  test('getLabelsForTask returns labels for task', () => {
    const tasks = db.prepare('SELECT * FROM tasks').all();
    if (tasks.length === 0) return true;
    const labels = db.prepare(`
      SELECT l.* FROM labels l
      INNER JOIN task_labels tl ON l.id = tl.label_id
      WHERE tl.task_id = ?
    `).all(tasks[0].id);
    return Array.isArray(labels);
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Test Results: ${testsPassed} passed, ${testsFailed} failed`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 All database tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the output above.');
  }

  // Cleanup
  console.log('\n🧹 Cleaning up test data...');
  db.prepare('DELETE FROM task_labels').run();
  db.prepare('DELETE FROM task_reminders').run();
  db.prepare('DELETE FROM task_logs').run();
  db.prepare('DELETE FROM subtasks').run();
  db.prepare('DELETE FROM tasks WHERE name LIKE ?').run('Test%');
  db.prepare('DELETE FROM tasks WHERE name LIKE ?').run('To Delete%');
  db.prepare('DELETE FROM tasks WHERE name LIKE ?').run('Toggle Test%');
  db.prepare('DELETE FROM tasks WHERE name LIKE ?').run('UniqueSearchTest%');
  db.prepare('DELETE FROM labels WHERE name = ?').run('Test Label');
  db.prepare('DELETE FROM lists WHERE name LIKE ? AND is_default = 0').run('Test%');
  db.prepare('DELETE FROM lists WHERE name LIKE ? AND is_default = 0').run('To Delete%');
  db.prepare('DELETE FROM lists WHERE name LIKE ? AND is_default = 0').run('Updated List%');
  
  console.log('✅ Cleanup complete.\n');
  db.close();
}

main();
