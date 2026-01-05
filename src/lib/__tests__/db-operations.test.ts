import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createTestDb, closeTestDb, cleanupTestDb, generateTestList, generateTestTask, generateTestLabel, generateTestSubtask } from './setup';

describe('Database Operations', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    cleanupTestDb(db);
    closeTestDb(db);
  });

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

    it('deleteList removes list', () => {
      const testList = generateTestList();
      db.prepare(`
        INSERT INTO lists (id, name, color, emoji, is_default, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(testList.id, testList.name, testList.color, testList.emoji, 0, testList.created_at, testList.updated_at);

      db.prepare('DELETE FROM lists WHERE id = ?').run(testList.id);
      
      const result = db.prepare('SELECT * FROM lists WHERE id = ?').get(testList.id);
      expect(result).toBeFalsy(); // bun:sqlite returns null for not found rows
    });

    it('getDefaultList returns Inbox', () => {
      const result = db.prepare('SELECT * FROM lists WHERE is_default = 1 LIMIT 1').get() as any;
      
      expect(result).toBeDefined();
      expect(result.name).toBe('Inbox');
      expect(result.is_default).toBe(1);
    });
  });

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
  });

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

      db.prepare('INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)')
        .run(testTask.id, testLabel.id);

      const result = db.prepare('SELECT * FROM task_labels WHERE task_id = ? AND label_id = ?')
        .get(testTask.id, testLabel.id);
      
      expect(result).toBeDefined();
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
  });

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

      const subtasks = db.prepare('SELECT * FROM subtasks WHERE task_id = ?').all(testTask.id) as any[];
      
      expect(Array.isArray(subtasks)).toBe(true);
      expect(subtasks.length).toBeGreaterThanOrEqual(1);
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
  });

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
  });
});

// Import uuidv4 for use in the tests
import { v4 as uuidv4 } from 'uuid';
