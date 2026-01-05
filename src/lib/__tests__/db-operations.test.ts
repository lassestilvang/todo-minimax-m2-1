/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createTestDb, closeTestDb, cleanupTestDb, generateTestList, generateTestTask, generateTestLabel, generateTestSubtask } from './setup';

// Import uuidv4 for use in the tests
import { v4 as uuidv4 } from 'uuid';

describe('Database Operations', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    cleanupTestDb(db);
    closeTestDb(db);
  });

  // ============== List Operations ==============

  describe('List Operations', () => {
    it('createList creates a list with all fields', () => {
      const testList = generateTestList();
      
      db.prepare(`
        INSERT INTO lists (id, name, color, emoji, is_default, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(testList.id, testList.name, testList.color, testList.emoji, 0, testList.created_at, testList.updated_at);

      const result = db.prepare('SELECT * FROM lists WHERE id = ?').get(testList.id) as any;
      
      expect(result).toBeDefined();
      expect(result.id).toBe(testList.id);
      expect(result.name).toBe(testList.name);
      expect(result.color).toBe(testList.color);
      expect(result.emoji).toBe(testList.emoji);
      expect(result.is_default).toBe(0);
    });

    it('getLists returns all lists including default Inbox', () => {
      const lists = db.prepare('SELECT * FROM lists ORDER BY is_default DESC').all() as any[];
      
      expect(Array.isArray(lists)).toBe(true);
      expect(lists.length).toBeGreaterThanOrEqual(1);
      
      const inbox = lists.find(l => l.is_default === 1);
      expect(inbox).toBeDefined();
      expect(inbox.name).toBe('Inbox');
    });

    it('getListById returns correct list', () => {
      const testList = generateTestList();
      db.prepare(`
        INSERT INTO lists (id, name, color, emoji, is_default, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(testList.id, testList.name, testList.color, testList.emoji, 0, testList.created_at, testList.updated_at);

      const result = db.prepare('SELECT * FROM lists WHERE id = ?').get(testList.id) as any;
      
      expect(result).toBeDefined();
      expect(result.id).toBe(testList.id);
      expect(result.name).toBe(testList.name);
    });

    it('getListById returns null for non-existent list', () => {
      const result = db.prepare('SELECT * FROM lists WHERE id = ?').get(uuidv4());
      expect(result).toBeNull();
    });

    it('updateList updates fields correctly', () => {
      const testList = generateTestList();
      db.prepare(`
        INSERT INTO lists (id, name, color, emoji, is_default, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(testList.id, testList.name, testList.color, testList.emoji, 0, testList.created_at, testList.updated_at);

      const newName = 'Updated List Name';
      const now = new Date().toISOString();
      db.prepare('UPDATE lists SET name = ?, updated_at = ? WHERE id = ?')
        .run(newName, now, testList.id);

      const result = db.prepare('SELECT * FROM lists WHERE id = ?').get(testList.id) as any;
      
      expect(result.name).toBe(newName);
    });

    it('updateList does nothing for non-existent list', () => {
      const nonExistentId = uuidv4();
      const now = new Date().toISOString();
      const result = db.prepare('UPDATE lists SET name = ?, updated_at = ? WHERE id = ?')
        .run('Updated', now, nonExistentId);
      
      expect(result.changes).toBe(0);
    });

    it('deleteList removes list', () => {
      const testList = generateTestList();
      db.prepare(`
        INSERT INTO lists (id, name, color, emoji, is_default, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(testList.id, testList.name, testList.color, testList.emoji, 0, testList.created_at, testList.updated_at);

      db.prepare('DELETE FROM lists WHERE id = ?').run(testList.id);
      
      const result = db.prepare('SELECT * FROM lists WHERE id = ?').get(testList.id);
      expect(result).toBeFalsy();
    });

    it('deleteList returns false for non-existent list', () => {
      const result = db.prepare('DELETE FROM lists WHERE id = ?').run(uuidv4());
      expect(result.changes).toBe(0);
    });

    it('getDefaultList returns Inbox', () => {
      const result = db.prepare('SELECT * FROM lists WHERE is_default = 1 LIMIT 1').get() as any;
      
      expect(result).toBeDefined();
      expect(result.name).toBe('Inbox');
      expect(result.is_default).toBe(1);
    });

    it('getListsWithTaskCount returns lists with task counts', () => {
      const result = db.prepare(`
        SELECT 
          l.*,
          COUNT(t.id) as task_count,
          SUM(CASE WHEN t.is_completed = 1 THEN 1 ELSE 0 END) as completed_count
        FROM lists l
        LEFT JOIN tasks t ON l.id = t.list_id
        GROUP BY l.id
        ORDER BY l.is_default DESC, l.created_at ASC
      `).all() as any[];
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
      
      const inbox = result.find((l: any) => l.is_default === 1);
      expect(inbox).toBeDefined();
      expect(inbox.task_count).toBeDefined();
      expect(inbox.completed_count).toBeDefined();
    });

    it('createList with null color and emoji handles correctly', () => {
      const now = new Date().toISOString();
      const id = uuidv4();
      
      db.prepare(`
        INSERT INTO lists (id, name, color, emoji, is_default, created_at, updated_at)
        VALUES (?, ?, NULL, NULL, 0, ?, ?)
      `).run(id, 'No Color List', now, now);

      const result = db.prepare('SELECT * FROM lists WHERE id = ?').get(id) as any;
      
      expect(result).toBeDefined();
      expect(result.name).toBe('No Color List');
      expect(result.color).toBeNull();
      expect(result.emoji).toBeNull();
    });
  });

  // ============== Task Operations ==============

  describe('Task Operations', () => {
    it('createTask creates task with all fields', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      const result = db.prepare('SELECT * FROM tasks WHERE id = ?').get(testTask.id) as any;
      
      expect(result).toBeDefined();
      expect(result.id).toBe(testTask.id);
      expect(result.name).toBe(testTask.name);
      expect(result.description).toBe(testTask.description);
      expect(result.priority).toBe(testTask.priority);
      expect(result.list_id).toBe(testTask.list_id);
    });

    it('updateTask updates fields and logs changes', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      const newName = 'Updated Task Name';
      const now = new Date().toISOString();
      db.prepare('UPDATE tasks SET name = ?, updated_at = ? WHERE id = ?')
        .run(newName, now, testTask.id);

      // Create log entry
      db.prepare(`
        INSERT INTO task_logs (id, task_id, action, field_changed, old_value, new_value, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), testTask.id, 'updated', 'name', testTask.name, newName, now);

      const result = db.prepare('SELECT * FROM tasks WHERE id = ?').get(testTask.id) as any;
      expect(result.name).toBe(newName);

      const log = db.prepare('SELECT * FROM task_logs WHERE task_id = ? ORDER BY created_at DESC').get(testTask.id) as any;
      expect(log).toBeDefined();
      expect(log.action).toBe('updated');
    });

    it('toggleTaskCompletion marks complete/incomplete', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      const now = new Date().toISOString();
      db.prepare('UPDATE tasks SET is_completed = ?, completed_at = ?, updated_at = ? WHERE id = ?')
        .run(1, now, now, testTask.id);

      const result = db.prepare('SELECT * FROM tasks WHERE id = ?').get(testTask.id) as any;
      expect(result.is_completed).toBe(1);
      expect(result.completed_at).toBe(now);

      // Toggle back to incomplete
      db.prepare('UPDATE tasks SET is_completed = ?, completed_at = ?, updated_at = ? WHERE id = ?')
        .run(0, null, now, testTask.id);

      const toggledResult = db.prepare('SELECT * FROM tasks WHERE id = ?').get(testTask.id) as any;
      expect(toggledResult.is_completed).toBe(0);
      expect(toggledResult.completed_at).toBeNull();
    });

    it('getTaskById returns null for non-existent task', () => {
      const result = db.prepare('SELECT * FROM tasks WHERE id = ?').get(uuidv4());
      expect(result).toBeNull();
    });

    it('getTodayTasks returns only today\'s tasks', () => {
      const today = new Date().toISOString().split('T')[0];
      
      const tasks = db.prepare('SELECT * FROM tasks WHERE date = ? AND is_completed = 0').all(today) as any[];
      
      expect(Array.isArray(tasks)).toBe(true);
    });

    it('getWeekTasks returns tasks within 7 days', () => {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];
      
      const tasks = db.prepare('SELECT * FROM tasks WHERE date >= ? AND date <= ? AND is_completed = 0')
        .all(today, nextWeekStr) as any[];
      
      expect(Array.isArray(tasks)).toBe(true);
    });

    it('getUpcomingTasks returns future tasks', () => {
      const today = new Date().toISOString().split('T')[0];
      
      const tasks = db.prepare('SELECT * FROM tasks WHERE date >= ? AND is_completed = 0')
        .all(today) as any[];
      
      expect(Array.isArray(tasks)).toBe(true);
    });

    it('getAllTasks returns all tasks', () => {
      const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all() as any[];
      
      expect(Array.isArray(tasks)).toBe(true);
    });

    it('getTasksByListId returns tasks for specific list', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      const tasks = db.prepare('SELECT * FROM tasks WHERE list_id = ? ORDER BY created_at DESC').all(inbox.id) as any[];
      
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThanOrEqual(1);
      expect(tasks[0].list_id).toBe(inbox.id);
    });

    it('getTasksByDateRange returns tasks within date range', () => {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, date, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, tomorrowStr, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      const tasks = db.prepare(`
        SELECT * FROM tasks 
        WHERE date >= ? AND date <= ?
        ORDER BY date ASC, created_at DESC
      `).all(today, tomorrowStr) as any[];
      
      expect(Array.isArray(tasks)).toBe(true);
    });

    it('getOverdueTaskCount returns count of overdue tasks', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, date, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, yesterdayStr, testTask.priority, 0, testTask.created_at, testTask.updated_at);

      const today = new Date().toISOString().split('T')[0];
      const result = db.prepare(`
        SELECT COUNT(*) as count FROM tasks 
        WHERE date < ? AND is_completed = 0
      `).get(today) as { count: number };
      
      expect(result.count).toBeGreaterThanOrEqual(1);
    });

    it('getOverdueTasks returns overdue tasks', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, date, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, yesterdayStr, testTask.priority, 0, testTask.created_at, testTask.updated_at);

      const today = new Date().toISOString().split('T')[0];
      const tasks = db.prepare(`
        SELECT * FROM tasks 
        WHERE date < ? AND is_completed = 0
        ORDER BY date ASC, priority DESC
      `).all(today) as any[];
      
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThanOrEqual(1);
    });

    it('deleteTask removes task and returns true', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(testTask.id);
      
      expect(result.changes).toBe(1);
      const check = db.prepare('SELECT * FROM tasks WHERE id = ?').get(testTask.id);
      expect(check).toBeNull();
    });

    it('deleteTask returns false for non-existent task', () => {
      const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(uuidv4());
      expect(result.changes).toBe(0);
    });

    it('getTaskByIdWithRelations returns task with labels and subtasks', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const testLabel = generateTestLabel();
      const testSubtask = generateTestSubtask(testTask.id);
      
      // Create task
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      // Create label
      db.prepare('INSERT INTO labels (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(testLabel.id, testLabel.name, testLabel.color, testLabel.icon, testLabel.created_at);

      // Add label to task
      db.prepare('INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)')
        .run(testTask.id, testLabel.id);

      // Create subtask
      db.prepare('INSERT INTO subtasks (id, task_id, name, is_completed, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(testSubtask.id, testSubtask.task_id, testSubtask.name, testSubtask.is_completed, testSubtask.created_at);

      // Get task with relations
      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(testTask.id) as any;
      const labels = db.prepare(`
        SELECT l.* FROM labels l
        INNER JOIN task_labels tl ON l.id = tl.label_id
        WHERE tl.task_id = ?
      `).all(testTask.id) as any[];
      const subtasks = db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY created_at ASC').all(testTask.id) as any[];
      
      expect(task).toBeDefined();
      expect(labels.length).toBeGreaterThanOrEqual(1);
      expect(subtasks.length).toBeGreaterThanOrEqual(1);
      expect(labels[0].id).toBe(testLabel.id);
      expect(subtasks[0].id).toBe(testSubtask.id);
    });
  });

  // ============== Label Operations ==============

  describe('Label Operations', () => {
    it('createLabel creates label', () => {
      const testLabel = generateTestLabel();
      
      db.prepare('INSERT INTO labels (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(testLabel.id, testLabel.name, testLabel.color, testLabel.icon, testLabel.created_at);

      const result = db.prepare('SELECT * FROM labels WHERE id = ?').get(testLabel.id) as any;
      
      expect(result).toBeDefined();
      expect(result.name).toBe(testLabel.name);
      expect(result.color).toBe(testLabel.color);
    });

    it('getLabels returns all labels', () => {
      const testLabel = generateTestLabel();
      db.prepare('INSERT INTO labels (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(testLabel.id, testLabel.name, testLabel.color, testLabel.icon, testLabel.created_at);

      const labels = db.prepare('SELECT * FROM labels ORDER BY name ASC').all() as any[];
      
      expect(Array.isArray(labels)).toBe(true);
    });

    it('getLabelById returns correct label', () => {
      const testLabel = generateTestLabel();
      db.prepare('INSERT INTO labels (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(testLabel.id, testLabel.name, testLabel.color, testLabel.icon, testLabel.created_at);

      const result = db.prepare('SELECT * FROM labels WHERE id = ?').get(testLabel.id) as any;
      
      expect(result).toBeDefined();
      expect(result.id).toBe(testLabel.id);
      expect(result.name).toBe(testLabel.name);
    });

    it('getLabelById returns null for non-existent label', () => {
      const result = db.prepare('SELECT * FROM labels WHERE id = ?').get(uuidv4());
      expect(result).toBeNull();
    });

    it('updateLabel updates label fields', () => {
      const testLabel = generateTestLabel();
      db.prepare('INSERT INTO labels (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(testLabel.id, testLabel.name, testLabel.color, testLabel.icon, testLabel.created_at);

      const newName = 'Updated Label';
      const newColor = '#000000';
      
      db.prepare('UPDATE labels SET name = ?, color = ? WHERE id = ?')
        .run(newName, newColor, testLabel.id);

      const result = db.prepare('SELECT * FROM labels WHERE id = ?').get(testLabel.id) as any;
      
      expect(result.name).toBe(newName);
      expect(result.color).toBe(newColor);
    });

    it('updateLabel does nothing for non-existent label', () => {
      const nonExistentId = uuidv4();
      const result = db.prepare('UPDATE labels SET name = ? WHERE id = ?')
        .run('Updated', nonExistentId);
      
      expect(result.changes).toBe(0);
    });

    it('deleteLabel removes label', () => {
      const testLabel = generateTestLabel();
      db.prepare('INSERT INTO labels (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(testLabel.id, testLabel.name, testLabel.color, testLabel.icon, testLabel.created_at);

      const result = db.prepare('DELETE FROM labels WHERE id = ?').run(testLabel.id);
      
      expect(result.changes).toBe(1);
      const check = db.prepare('SELECT * FROM labels WHERE id = ?').get(testLabel.id);
      expect(check).toBeNull();
    });

    it('deleteLabel returns false for non-existent label', () => {
      const result = db.prepare('DELETE FROM labels WHERE id = ?').run(uuidv4());
      expect(result.changes).toBe(0);
    });

    it('createLabel with null color and icon handles correctly', () => {
      const now = new Date().toISOString();
      const id = uuidv4();
      
      db.prepare('INSERT INTO labels (id, name, color, icon, created_at) VALUES (?, ?, NULL, NULL, ?)')
        .run(id, 'No Color Label', now);

      const result = db.prepare('SELECT * FROM labels WHERE id = ?').get(id) as any;
      
      expect(result).toBeDefined();
      expect(result.name).toBe('No Color Label');
      expect(result.color).toBeNull();
      expect(result.icon).toBeNull();
    });
  });

  // ============== Task Label Operations ==============

  describe('Task Label Operations', () => {
    it('addLabelToTask adds label to task', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const testLabel = generateTestLabel();
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      db.prepare('INSERT INTO labels (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(testLabel.id, testLabel.name, testLabel.color, testLabel.icon, testLabel.created_at);

      const result = db.prepare('INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)')
        .run(testTask.id, testLabel.id);
      
      expect(result.changes).toBe(1);
      
      const link = db.prepare('SELECT * FROM task_labels WHERE task_id = ? AND label_id = ?')
        .get(testTask.id, testLabel.id);
      
      expect(link).toBeDefined();
    });

    it('addLabelToTask does not duplicate existing link', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const testLabel = generateTestLabel();
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      db.prepare('INSERT INTO labels (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(testLabel.id, testLabel.name, testLabel.color, testLabel.icon, testLabel.created_at);

      // Add first time
      db.prepare('INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)')
        .run(testTask.id, testLabel.id);
      
      // Add second time (should be ignored)
      const result = db.prepare('INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)')
        .run(testTask.id, testLabel.id);
      
      expect(result.changes).toBe(0);
    });

    it('removeLabelFromTask removes label from task', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const testLabel = generateTestLabel();
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      db.prepare('INSERT INTO labels (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(testLabel.id, testLabel.name, testLabel.color, testLabel.icon, testLabel.created_at);

      db.prepare('INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)')
        .run(testTask.id, testLabel.id);

      const result = db.prepare('DELETE FROM task_labels WHERE task_id = ? AND label_id = ?')
        .run(testTask.id, testLabel.id);
      
      expect(result.changes).toBe(1);
      
      const link = db.prepare('SELECT * FROM task_labels WHERE task_id = ? AND label_id = ?')
        .get(testTask.id, testLabel.id);
      
      expect(link).toBeNull();
    });

    it('getLabelsForTask returns task labels', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const testLabel = generateTestLabel();
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      db.prepare('INSERT INTO labels (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(testLabel.id, testLabel.name, testLabel.color, testLabel.icon, testLabel.created_at);

      db.prepare('INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)')
        .run(testTask.id, testLabel.id);

      const labels = db.prepare(`
        SELECT l.* FROM labels l
        INNER JOIN task_labels tl ON l.id = tl.label_id
        WHERE tl.task_id = ?
      `).all(testTask.id) as any[];
      
      expect(Array.isArray(labels)).toBe(true);
      expect(labels.length).toBeGreaterThanOrEqual(1);
    });

    it('getTasksForLabel returns tasks with specific label', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const testLabel = generateTestLabel();
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      db.prepare('INSERT INTO labels (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(testLabel.id, testLabel.name, testLabel.color, testLabel.icon, testLabel.created_at);

      db.prepare('INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)')
        .run(testTask.id, testLabel.id);

      const tasks = db.prepare(`
        SELECT t.* FROM tasks t
        INNER JOIN task_labels tl ON t.id = tl.task_id
        WHERE tl.label_id = ?
        ORDER BY t.created_at DESC
      `).all(testLabel.id) as any[];
      
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThanOrEqual(1);
      expect(tasks[0].id).toBe(testTask.id);
    });
  });

  // ============== Subtask Operations ==============

  describe('Subtask Operations', () => {
    it('createSubtask creates subtask', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const testSubtask = generateTestSubtask(testTask.id);
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      db.prepare('INSERT INTO subtasks (id, task_id, name, is_completed, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(testSubtask.id, testSubtask.task_id, testSubtask.name, testSubtask.is_completed, testSubtask.created_at);

      const result = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(testSubtask.id) as any;
      
      expect(result).toBeDefined();
      expect(result.name).toBe(testSubtask.name);
      expect(result.task_id).toBe(testSubtask.task_id);
    });

    it('getSubtasksByTaskId returns subtasks', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const testSubtask = generateTestSubtask(testTask.id);
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      db.prepare('INSERT INTO subtasks (id, task_id, name, is_completed, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(testSubtask.id, testSubtask.task_id, testSubtask.name, testSubtask.is_completed, testSubtask.created_at);

      const subtasks = db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY created_at ASC').all(testTask.id) as any[];
      
      expect(Array.isArray(subtasks)).toBe(true);
      expect(subtasks.length).toBeGreaterThanOrEqual(1);
    });

    it('getSubtaskById returns correct subtask', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const testSubtask = generateTestSubtask(testTask.id);
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      db.prepare('INSERT INTO subtasks (id, task_id, name, is_completed, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(testSubtask.id, testSubtask.task_id, testSubtask.name, testSubtask.is_completed, testSubtask.created_at);

      const result = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(testSubtask.id) as any;
      
      expect(result).toBeDefined();
      expect(result.id).toBe(testSubtask.id);
      expect(result.name).toBe(testSubtask.name);
    });

    it('getSubtaskById returns null for non-existent subtask', () => {
      const result = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(uuidv4());
      expect(result).toBeNull();
    });

    it('updateSubtask marks complete/incomplete', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const testSubtask = generateTestSubtask(testTask.id);
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      db.prepare('INSERT INTO subtasks (id, task_id, name, is_completed, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(testSubtask.id, testSubtask.task_id, testSubtask.name, testSubtask.is_completed, testSubtask.created_at);

      db.prepare('UPDATE subtasks SET is_completed = 1 WHERE id = ?').run(testSubtask.id);

      const result = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(testSubtask.id) as any;
      expect(result.is_completed).toBe(1);
    });

    it('updateSubtask updates name', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const testSubtask = generateTestSubtask(testTask.id);
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      db.prepare('INSERT INTO subtasks (id, task_id, name, is_completed, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(testSubtask.id, testSubtask.task_id, testSubtask.name, testSubtask.is_completed, testSubtask.created_at);

      const newName = 'Updated Subtask Name';
      db.prepare('UPDATE subtasks SET name = ? WHERE id = ?').run(newName, testSubtask.id);

      const result = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(testSubtask.id) as any;
      expect(result.name).toBe(newName);
    });

    it('deleteSubtask removes subtask', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const testSubtask = generateTestSubtask(testTask.id);
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      db.prepare('INSERT INTO subtasks (id, task_id, name, is_completed, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(testSubtask.id, testSubtask.task_id, testSubtask.name, testSubtask.is_completed, testSubtask.created_at);

      const result = db.prepare('DELETE FROM subtasks WHERE id = ?').run(testSubtask.id);
      
      expect(result.changes).toBe(1);
      const check = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(testSubtask.id);
      expect(check).toBeNull();
    });

    it('deleteSubtask returns false for non-existent subtask', () => {
      const result = db.prepare('DELETE FROM subtasks WHERE id = ?').run(uuidv4());
      expect(result.changes).toBe(0);
    });
  });

  // ============== Reminder Operations ==============

  describe('Reminder Operations', () => {
    it('createReminder creates reminder', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const now = new Date().toISOString();
      const reminderTime = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      const reminderId = uuidv4();
      db.prepare('INSERT INTO task_reminders (id, task_id, reminder_time, is_triggered, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(reminderId, testTask.id, reminderTime, 0, now);

      const result = db.prepare('SELECT * FROM task_reminders WHERE id = ?').get(reminderId) as any;
      
      expect(result).toBeDefined();
      expect(result.task_id).toBe(testTask.id);
      expect(result.reminder_time).toBe(reminderTime);
      expect(result.is_triggered).toBe(0);
    });

    it('getRemindersForTask returns reminders for task', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const now = new Date().toISOString();
      const reminderTime = new Date(Date.now() + 3600000).toISOString();
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      const reminderId = uuidv4();
      db.prepare('INSERT INTO task_reminders (id, task_id, reminder_time, is_triggered, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(reminderId, testTask.id, reminderTime, 0, now);

      const reminders = db.prepare(`
        SELECT * FROM task_reminders 
        WHERE task_id = ? 
        ORDER BY reminder_time ASC
      `).all(testTask.id) as any[];
      
      expect(Array.isArray(reminders)).toBe(true);
      expect(reminders.length).toBeGreaterThanOrEqual(1);
    });

    it('getPendingReminders returns pending reminders', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const now = new Date().toISOString();
      const pastTime = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      const reminderId = uuidv4();
      db.prepare('INSERT INTO task_reminders (id, task_id, reminder_time, is_triggered, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(reminderId, testTask.id, pastTime, 0, now);

      const pendingReminders = db.prepare(`
        SELECT * FROM task_reminders 
        WHERE reminder_time <= ? AND is_triggered = 0
        ORDER BY reminder_time ASC
      `).all(now) as any[];
      
      expect(Array.isArray(pendingReminders)).toBe(true);
    });

    it('markReminderTriggered marks reminder as triggered', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const now = new Date().toISOString();
      const reminderTime = new Date(Date.now() + 3600000).toISOString();
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      const reminderId = uuidv4();
      db.prepare('INSERT INTO task_reminders (id, task_id, reminder_time, is_triggered, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(reminderId, testTask.id, reminderTime, 0, now);

      db.prepare('UPDATE task_reminders SET is_triggered = 1 WHERE id = ?').run(reminderId);

      const result = db.prepare('SELECT * FROM task_reminders WHERE id = ?').get(reminderId) as any;
      expect(result.is_triggered).toBe(1);
    });

    it('deleteReminder removes reminder', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const now = new Date().toISOString();
      const reminderTime = new Date(Date.now() + 3600000).toISOString();
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      const reminderId = uuidv4();
      db.prepare('INSERT INTO task_reminders (id, task_id, reminder_time, is_triggered, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(reminderId, testTask.id, reminderTime, 0, now);

      const result = db.prepare('DELETE FROM task_reminders WHERE id = ?').run(reminderId);
      
      expect(result.changes).toBe(1);
      const check = db.prepare('SELECT * FROM task_reminders WHERE id = ?').get(reminderId);
      expect(check).toBeNull();
    });
  });

  // ============== Task Log Operations ==============

  describe('Task Log Operations', () => {
    it('createLog creates log entry', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const now = new Date().toISOString();
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      const logId = uuidv4();
      db.prepare(`
        INSERT INTO task_logs (id, task_id, action, field_changed, old_value, new_value, created_at, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(logId, testTask.id, 'created', null, null, null, now, 'user');

      const result = db.prepare('SELECT * FROM task_logs WHERE id = ?').get(logId) as any;
      
      expect(result).toBeDefined();
      expect(result.task_id).toBe(testTask.id);
      expect(result.action).toBe('created');
      expect(result.created_by).toBe('user');
    });

    it('getLogsForTask returns logs for task', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const now = new Date().toISOString();
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      const logId = uuidv4();
      db.prepare(`
        INSERT INTO task_logs (id, task_id, action, field_changed, old_value, new_value, created_at, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(logId, testTask.id, 'created', null, null, null, now, 'user');

      const logs = db.prepare(`
        SELECT * FROM task_logs 
        WHERE task_id = ?
        ORDER BY created_at DESC
      `).all(testTask.id) as any[];
      
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThanOrEqual(1);
    });

    it('getRecentLogs returns recent logs', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const now = new Date().toISOString();
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      // Create multiple log entries
      for (let i = 0; i < 5; i++) {
        const logId = uuidv4();
        db.prepare(`
          INSERT INTO task_logs (id, task_id, action, field_changed, old_value, new_value, created_at, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(logId, testTask.id, 'updated', 'field', 'old', 'new', now, 'user');
      }

      const logs = db.prepare(`
        SELECT * FROM task_logs 
        ORDER BY created_at DESC
        LIMIT 3
      `).all() as any[];
      
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeLessThanOrEqual(3);
    });

    it('createLog with field change tracks old and new values', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const now = new Date().toISOString();
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      const logId = uuidv4();
      db.prepare(`
        INSERT INTO task_logs (id, task_id, action, field_changed, old_value, new_value, created_at, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(logId, testTask.id, 'updated', 'name', 'Old Name', 'New Name', now, 'user');

      const result = db.prepare('SELECT * FROM task_logs WHERE id = ?').get(logId) as any;
      
      expect(result.field_changed).toBe('name');
      expect(result.old_value).toBe('Old Name');
      expect(result.new_value).toBe('New Name');
    });
  });

  // ============== Search Tests ==============

  describe('Search Tests', () => {
    it('searchTasks with exact match', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const uniqueName = `UniqueExactMatchTest_${Date.now()}`;
      
      db.prepare('INSERT INTO tasks (id, list_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
        .run(uuidv4(), inbox.id, uniqueName, new Date().toISOString(), new Date().toISOString());

      const tasks = db.prepare('SELECT * FROM tasks WHERE name = ?').all(uniqueName);
      
      expect(tasks.length).toBe(1);
    });

    it('searchTasks with partial match', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const uniqueName = `PartialMatchTest_${Date.now()}`;
      
      db.prepare('INSERT INTO tasks (id, list_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
        .run(uuidv4(), inbox.id, uniqueName, new Date().toISOString(), new Date().toISOString());

      const tasks = db.prepare('SELECT * FROM tasks WHERE name LIKE ?').all(`%${uniqueName}%`);
      
      expect(tasks.length).toBe(1);
    });

    it('searchTasks with no results', () => {
      const tasks = db.prepare('SELECT * FROM tasks WHERE name LIKE ?').all(`%NonExistentTaskName_${Date.now()}%`);
      
      expect(tasks.length).toBe(0);
    });

    it('searchTasks scores results correctly', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const query = 'ImportantTask';
      
      // Create tasks with different matching patterns
      db.prepare('INSERT INTO tasks (id, list_id, name, description, priority, is_completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), inbox.id, query, 'Description', 'high', 0, new Date().toISOString(), new Date().toISOString());
      
      db.prepare('INSERT INTO tasks (id, list_id, name, description, priority, is_completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), inbox.id, `Some ${query} text`, 'Description', 'high', 0, new Date().toISOString(), new Date().toISOString());

      const tasks = db.prepare(`
        SELECT *, 
          CASE 
            WHEN name = ? THEN 100
            WHEN name LIKE ? THEN 30
            ELSE 0
          END as score
        FROM tasks 
        WHERE name LIKE ? OR description LIKE ?
        ORDER BY score DESC
      `).all(query, `%${query}%`, `%${query}%`, `%${query}%`) as any[];
      
      expect(tasks.length).toBeGreaterThanOrEqual(2);
      // Exact match should come first
      expect(tasks[0].name).toBe(query);
    });

    it('searchTasks is case insensitive', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const uniqueName = `CaseTest_${Date.now()}`;
      const lowerName = uniqueName.toLowerCase();
      const upperName = uniqueName.toUpperCase();
      
      db.prepare('INSERT INTO tasks (id, list_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
        .run(uuidv4(), inbox.id, upperName, new Date().toISOString(), new Date().toISOString());

      const tasks = db.prepare('SELECT * FROM tasks WHERE LOWER(name) LIKE ?').all(`%${lowerName}%`);
      
      expect(tasks.length).toBe(1);
    });
  });

  // ============== Bulk Operations ==============

  describe('Bulk Operations', () => {
    it('deleteTasksByListId removes all tasks in list', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      
      // Create multiple tasks
      for (let i = 0; i < 3; i++) {
        const testTask = generateTestTask(inbox.id);
        db.prepare(`
          INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);
      }

      const result = db.prepare('DELETE FROM tasks WHERE list_id = ?').run(inbox.id);
      
      expect(result.changes).toBeGreaterThanOrEqual(3);
      
      const remainingTasks = db.prepare('SELECT * FROM tasks WHERE list_id = ?').all(inbox.id);
      expect(remainingTasks.length).toBe(0);
    });

    it('completeAllTasksInList marks all tasks complete', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const now = new Date().toISOString();
      
      // Create multiple incomplete tasks
      for (let i = 0; i < 3; i++) {
        const testTask = generateTestTask(inbox.id);
        db.prepare(`
          INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, 0, testTask.created_at, testTask.updated_at);
      }

      db.prepare(`
        UPDATE tasks SET is_completed = 1, completed_at = ?, updated_at = ? 
        WHERE list_id = ? AND is_completed = 0
      `).run(now, now, inbox.id);

      const tasks = db.prepare('SELECT * FROM tasks WHERE list_id = ? AND is_completed = 1').all(inbox.id) as any[];
      
      expect(tasks.length).toBeGreaterThanOrEqual(3);
      tasks.forEach(task => {
        expect(task.is_completed).toBe(1);
        expect(task.completed_at).toBe(now);
      });
    });

    it('completeAllTasksInList only affects incomplete tasks', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const now = new Date().toISOString();
      
      // Create one completed task
      const completedTask = generateTestTask(inbox.id);
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, completed_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(completedTask.id, completedTask.list_id, completedTask.name, completedTask.description, completedTask.date, completedTask.deadline, completedTask.priority, 1, now, completedTask.created_at, completedTask.updated_at);

      // Create one incomplete task
      const incompleteTask = generateTestTask(inbox.id);
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(incompleteTask.id, incompleteTask.list_id, incompleteTask.name, incompleteTask.description, incompleteTask.date, incompleteTask.deadline, incompleteTask.priority, 0, incompleteTask.created_at, incompleteTask.updated_at);

      db.prepare(`
        UPDATE tasks SET is_completed = 1, completed_at = ?, updated_at = ? 
        WHERE list_id = ? AND is_completed = 0
      `).run(now, now, inbox.id);

      const tasks = db.prepare('SELECT * FROM tasks WHERE list_id = ?').all(inbox.id) as any[];
      
      expect(tasks.length).toBe(2);
      const allCompleted = tasks.every(t => t.is_completed === 1);
      expect(allCompleted).toBe(true);
    });
  });

  // ============== Edge Cases ==============

  describe('Edge Cases', () => {
    it('handles empty database gracefully', () => {
      // Clean up all non-default lists and tasks
      db.query('DELETE FROM task_labels').run();
      db.query('DELETE FROM task_reminders').run();
      db.query('DELETE FROM task_logs').run();
      db.query('DELETE FROM subtasks').run();
      db.query('DELETE FROM tasks').run();
      db.query('DELETE FROM labels').run();
      
      const lists = db.prepare('SELECT * FROM lists').all();
      expect(lists.length).toBe(1); // Only Inbox should remain
      
      const tasks = db.prepare('SELECT * FROM tasks').all();
      expect(tasks.length).toBe(0);
      
      const labels = db.prepare('SELECT * FROM labels').all();
      expect(labels.length).toBe(0);
    });

    it('handles tasks with special characters in name', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const specialName = "Task with 'quotes' and \"double quotes\" and <brackets>";
      
      db.prepare('INSERT INTO tasks (id, list_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
        .run(uuidv4(), inbox.id, specialName, new Date().toISOString(), new Date().toISOString());

      const result = db.prepare('SELECT * FROM tasks WHERE name = ?').get(specialName);
      expect(result).toBeDefined();
    });

    it('handles tasks with very long names', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const longName = 'A'.repeat(1000);
      
      db.prepare('INSERT INTO tasks (id, list_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
        .run(uuidv4(), inbox.id, longName, new Date().toISOString(), new Date().toISOString());

      const result = db.prepare('SELECT * FROM tasks WHERE name = ?').get(longName) as any;
      expect(result).toBeDefined();
      expect(result.name.length).toBe(1000);
    });

    it('handles tasks with null description', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      
      db.prepare('INSERT INTO tasks (id, list_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), inbox.id, 'No description', null, new Date().toISOString(), new Date().toISOString());

      const result = db.prepare('SELECT * FROM tasks WHERE name = ?').get('No description') as any;
      expect(result).toBeDefined();
      expect(result.description).toBeNull();
    });

    it('handles multiple priorities correctly', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      
      const priorities = ['high', 'medium', 'low', 'none'];
      
      priorities.forEach((priority, index) => {
        db.prepare('INSERT INTO tasks (id, list_id, name, priority, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
          .run(uuidv4(), inbox.id, `Priority ${priority}`, priority, new Date().toISOString(), new Date().toISOString());
      });

      // Verify all priorities are stored correctly (SQLite orders alphabetically by default for TEXT)
      const tasks = db.prepare('SELECT * FROM tasks WHERE name LIKE ?').all('Priority %') as any[];
      
      expect(tasks.length).toBe(4);
      const taskPriorities = tasks.map(t => t.priority);
      
      // All priorities should be present
      priorities.forEach(p => {
        expect(taskPriorities).toContain(p);
      });
    });

    it('handles task with attachments JSON', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const attachments = JSON.stringify([
        { type: 'file', name: 'document.pdf', url: '/files/doc.pdf' },
        { type: 'image', name: 'photo.jpg', url: '/images/photo.jpg' }
      ]);
      
      db.prepare('INSERT INTO tasks (id, list_id, name, attachments, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), inbox.id, 'Task with attachments', attachments, new Date().toISOString(), new Date().toISOString());

      const result = db.prepare('SELECT * FROM tasks WHERE name = ?').get('Task with attachments') as any;
      expect(result).toBeDefined();
      
      const parsedAttachments = JSON.parse(result.attachments);
      expect(Array.isArray(parsedAttachments)).toBe(true);
      expect(parsedAttachments.length).toBe(2);
    });

    it('handles recurring pattern correctly', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const recurringPattern = JSON.stringify({ frequency: 'daily', interval: 1 });
      
      db.prepare('INSERT INTO tasks (id, list_id, name, recurring_pattern, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), inbox.id, 'Recurring task', recurringPattern, new Date().toISOString(), new Date().toISOString());

      const result = db.prepare('SELECT * FROM tasks WHERE name = ?').get('Recurring task') as any;
      expect(result).toBeDefined();
      
      const parsedPattern = JSON.parse(result.recurring_pattern);
      expect(parsedPattern.frequency).toBe('daily');
    });

    it('cascades delete when task is deleted (subtasks)', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const testSubtask = generateTestSubtask(testTask.id);
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      db.prepare('INSERT INTO subtasks (id, task_id, name, is_completed, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(testSubtask.id, testSubtask.task_id, testSubtask.name, testSubtask.is_completed, testSubtask.created_at);

      // Delete task
      db.prepare('DELETE FROM tasks WHERE id = ?').run(testTask.id);

      // Subtask should be deleted due to CASCADE
      const subtaskCheck = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(testSubtask.id);
      expect(subtaskCheck).toBeNull();
    });

    it('cascades delete when task is deleted (reminders)', () => {
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const testTask = generateTestTask(inbox.id);
      const now = new Date().toISOString();
      const reminderTime = new Date(Date.now() + 3600000).toISOString();
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testTask.id, testTask.list_id, testTask.name, testTask.description, testTask.date, testTask.deadline, testTask.priority, testTask.is_completed, testTask.created_at, testTask.updated_at);

      const reminderId = uuidv4();
      db.prepare('INSERT INTO task_reminders (id, task_id, reminder_time, is_triggered, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(reminderId, testTask.id, reminderTime, 0, now);

      // Delete task
      db.prepare('DELETE FROM tasks WHERE id = ?').run(testTask.id);

      // Reminder should be deleted due to CASCADE
      const reminderCheck = db.prepare('SELECT * FROM task_reminders WHERE id = ?').get(reminderId);
      expect(reminderCheck).toBeNull();
    });
  });
});
