import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createTestDb, closeTestDb, cleanupTestDb, generateTestList, generateTestTask, generateTestLabel, generateTestSubtask } from '../lib/__tests__/setup';
import { v4 as uuidv4 } from 'uuid';

describe('Integration Tests', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    cleanupTestDb(db);
    closeTestDb(db);
  });

  describe('Complete Task Creation Flow', () => {
    it('creates list → creates task → completes task workflow', () => {
      // Step 1: Create a new list
      const testList = generateTestList();
      db.prepare(`
        INSERT INTO lists (id, name, color, emoji, is_default, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(testList.id, testList.name, testList.color, testList.emoji, 0, testList.created_at, testList.updated_at);

      // Verify list was created
      const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(testList.id) as any;
      expect(list).toBeDefined();
      expect(list.name).toBe(testList.name);

      // Step 2: Create a task in that list
      const now = new Date().toISOString();
      const taskId = uuidv4();
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, description, date, priority, is_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(taskId, testList.id, 'Integration Test Task', 'Task description', new Date().toISOString().split('T')[0], 'high', 0, now, now);

      // Verify task was created
      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
      expect(task).toBeDefined();
      expect(task.name).toBe('Integration Test Task');
      expect(task.list_id).toBe(testList.id);

      // Step 3: Add labels to the task
      const testLabel = generateTestLabel();
      db.prepare('INSERT INTO labels (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(testLabel.id, testLabel.name, testLabel.color, testLabel.icon, testLabel.created_at);

      db.prepare('INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)')
        .run(taskId, testLabel.id);

      // Verify label was added
      const labelLink = db.prepare('SELECT * FROM task_labels WHERE task_id = ? AND label_id = ?').get(taskId, testLabel.id);
      expect(labelLink).toBeDefined();

      // Step 4: Add subtasks to the task
      const subtaskId = uuidv4();
      db.prepare('INSERT INTO subtasks (id, task_id, name, is_completed, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(subtaskId, taskId, 'Subtask 1', 0, now);

      // Verify subtask was added
      const subtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(subtaskId) as any;
      expect(subtask).toBeDefined();
      expect(subtask.name).toBe('Subtask 1');

      // Step 5: Complete the task
      db.prepare('UPDATE tasks SET is_completed = ?, completed_at = ?, updated_at = ? WHERE id = ?')
        .run(1, now, now, taskId);

      // Verify task is completed
      const completedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
      expect(completedTask.is_completed).toBe(1);
      expect(completedTask.completed_at).toBe(now);

      // Step 6: Verify the task log was created
      const log = db.prepare('SELECT * FROM task_logs WHERE task_id = ? ORDER BY created_at DESC').get(taskId) as any;
      expect(log).toBeDefined();
      expect(log.action).toBe('created');
    });
  });

  describe('List → Task → Complete Workflow', () => {
    it('tests the full workflow with multiple tasks', () => {
      // Create a list
      const testList = generateTestList();
      db.prepare(`
        INSERT INTO lists (id, name, color, emoji, is_default, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(testList.id, testList.name, testList.color, testList.emoji, 0, testList.created_at, testList.updated_at);

      // Create multiple tasks
      const taskIds = [];
      const now = new Date().toISOString();
      
      for (let i = 0; i < 3; i++) {
        const taskId = uuidv4();
        taskIds.push(taskId);
        db.prepare(`
          INSERT INTO tasks (id, list_id, name, description, date, priority, is_completed, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(taskId, testList.id, `Task ${i + 1}`, `Description ${i + 1}`, new Date().toISOString().split('T')[0], ['high', 'medium', 'low'][i] as string, 0, now, now);
      }

      // Verify all tasks were created
      const tasks = db.prepare('SELECT * FROM tasks WHERE list_id = ?').all(testList.id) as any[];
      expect(tasks.length).toBe(3);

      // Complete first task
      db.prepare('UPDATE tasks SET is_completed = ?, completed_at = ?, updated_at = ? WHERE id = ?')
        .run(1, now, now, taskIds[0]);

      // Verify task count with completed
      const allTasks = db.prepare('SELECT * FROM tasks WHERE list_id = ?').all(testList.id) as any[];
      const completedTasks = db.prepare('SELECT * FROM tasks WHERE list_id = ? AND is_completed = 1').all(testList.id) as any[];
      const pendingTasks = db.prepare('SELECT * FROM tasks WHERE list_id = ? AND is_completed = 0').all(testList.id) as any[];

      expect(allTasks.length).toBe(3);
      expect(completedTasks.length).toBe(1);
      expect(pendingTasks.length).toBe(2);

      // Delete completed task
      db.prepare('DELETE FROM tasks WHERE id = ?').run(taskIds[0]);

      // Verify deletion
      const remainingTasks = db.prepare('SELECT * FROM tasks WHERE list_id = ?').all(testList.id) as any[];
      expect(remainingTasks.length).toBe(2);
    });
  });

  describe('Search → Select → Edit Workflow', () => {
    it('tests search, select, and edit workflow', () => {
      // Create tasks with searchable content
      const inbox = db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as any;
      const now = new Date().toISOString();
      
      const tasks = [
        { name: 'Buy groceries', description: 'Milk, bread, eggs' },
        { name: 'Finish report', description: 'Q4 sales report' },
        { name: 'Call mom', description: 'Birthday plans' },
      ];

      for (const task of tasks) {
        db.prepare('INSERT INTO tasks (id, list_id, name, description, date, priority, is_completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .run(uuidv4(), inbox.id, task.name, task.description, new Date().toISOString().split('T')[0], 'medium', 0, now, now);
      }

      // Search for "groceries"
      const searchResults = db.prepare('SELECT * FROM tasks WHERE name LIKE ? OR description LIKE ?').all('%groceries%', '%groceries%') as any[];
      expect(searchResults.length).toBe(1);
      expect(searchResults[0].name).toBe('Buy groceries');

      // Select the task (by ID)
      const selectedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(searchResults[0].id) as any;
      expect(selectedTask).toBeDefined();
      expect(selectedTask.name).toBe('Buy groceries');

      // Edit the task
      const updatedDescription = 'Milk, bread, eggs, butter';
      db.prepare('UPDATE tasks SET description = ?, updated_at = ? WHERE id = ?')
        .run(updatedDescription, now, selectedTask.id);

      // Verify update
      const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(selectedTask.id) as any;
      expect(updatedTask.description).toBe(updatedDescription);
    });
  });
});
