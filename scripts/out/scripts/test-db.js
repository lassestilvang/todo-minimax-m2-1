#!/usr/bin/env tsx
"use strict";
/**
 * Database Verification Test Script
 * Run with: npx tsx scripts/test-db.ts
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var schema_1 = require("../src/lib/db/schema");
var operations_1 = require("../src/lib/db/operations");
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var testsPassed = 0;
var testsFailed = 0;
function test(name, fn) {
    try {
        var result = fn();
        if (result === true || result === 'object') {
            console.log("\u2705 ".concat(name));
            testsPassed++;
        }
        else if (result === false) {
            console.log("\u274C ".concat(name, " - returned false"));
            testsFailed++;
        }
        else {
            console.log("\u2705 ".concat(name));
            testsPassed++;
        }
    }
    catch (error) {
        console.log("\u274C ".concat(name, " - Error: ").concat(error));
        testsFailed++;
    }
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            console.log('🧪 Starting Database Verification Tests\n');
            console.log('='.repeat(50));
            // Test 1: Database file creation
            test('Database file is created in data/ directory', function () {
                var dbPath = path_1.default.join(process.cwd(), 'data', 'todo.db');
                var exists = fs_1.default.existsSync(dbPath);
                if (!exists) {
                    // Initialize database to create the file
                    var db_1 = (0, schema_1.getDatabase)();
                    (0, schema_1.closeDatabase)(db_1);
                }
                return fs_1.default.existsSync(dbPath);
            });
            // Test 2: Default Inbox list exists
            test('Default Inbox list is created on initialization', function () {
                var db = (0, schema_1.getDatabase)();
                var stmt = db.prepare('SELECT COUNT(*) as count FROM lists WHERE is_default = 1').get();
                (0, schema_1.closeDatabase)(db);
                return stmt.count === 1;
            });
            // Test 3: All tables exist
            test('All required tables exist', function () {
                var _a;
                var db = (0, schema_1.getDatabase)();
                var tables = [
                    'lists', 'tasks', 'labels', 'task_labels',
                    'subtasks', 'task_reminders', 'task_logs'
                ];
                var result = (_a = db.prepare("\n      SELECT name FROM sqlite_master \n      WHERE type='table' AND name IN (".concat(tables.map(function () { return '?'; }).join(','), ")\n    "))).all.apply(_a, tables);
                (0, schema_1.closeDatabase)(db);
                return result.length === tables.length;
            });
            // Test 4: List CRUD operations
            console.log('\n📋 List Operations:');
            test('createList creates a new list', function () {
                var list = (0, operations_1.createList)({ name: 'Test List', color: '#ff0000', emoji: '🧪' });
                return list.id.length === 36 && list.name === 'Test List';
            });
            test('getLists returns all lists', function () {
                var lists = (0, operations_1.getLists)();
                return lists.length > 0;
            });
            test('getListById returns correct list', function () {
                var lists = (0, operations_1.getLists)();
                if (lists.length === 0)
                    return false;
                var list = (0, operations_1.getListById)(lists[0].id);
                return list !== null && list.id === lists[0].id;
            });
            test('updateList updates list data', function () {
                var lists = (0, operations_1.getLists)();
                if (lists.length === 0)
                    return false;
                var updated = (0, operations_1.updateList)(lists[0].id, { name: 'Updated List' });
                return (updated === null || updated === void 0 ? void 0 : updated.name) === 'Updated List';
            });
            test('getDefaultList returns the default inbox', function () {
                var defaultList = (0, operations_1.getDefaultList)();
                return defaultList !== null && defaultList.is_default === true;
            });
            test('getListsWithTaskCount returns counts', function () {
                var lists = (0, operations_1.getListsWithTaskCount)();
                return lists.length > 0 && 'task_count' in lists[0];
            });
            test('deleteList removes list', function () {
                var list = (0, operations_1.createList)({ name: 'To Delete' });
                var result = (0, operations_1.deleteList)(list.id);
                var deleted = (0, operations_1.getListById)(list.id);
                return result === true && deleted === null;
            });
            // Test 5: Task CRUD operations
            console.log('\n📝 Task Operations:');
            test('createTask creates a new task', function () {
                var defaultList = (0, operations_1.getDefaultList)();
                if (!defaultList)
                    return false;
                var task = (0, operations_1.createTask)({
                    list_id: defaultList.id,
                    name: 'Test Task',
                    description: 'Test description',
                    priority: 'high'
                });
                return task.id.length === 36 && task.name === 'Test Task';
            });
            test('getTasksByListId returns tasks for list', function () {
                var defaultList = (0, operations_1.getDefaultList)();
                if (!defaultList)
                    return false;
                var tasks = (0, operations_1.getTasksByListId)(defaultList.id);
                return Array.isArray(tasks);
            });
            test('getTaskById returns correct task', function () {
                var tasks = (0, operations_1.getAllTasks)();
                if (tasks.length === 0)
                    return false;
                var task = (0, operations_1.getTaskById)(tasks[0].id);
                return task !== null && task.id === tasks[0].id;
            });
            test('updateTask updates task data', function () {
                var tasks = (0, operations_1.getAllTasks)();
                if (tasks.length === 0)
                    return false;
                var updated = (0, operations_1.updateTask)(tasks[0].id, { name: 'Updated Task', priority: 'low' });
                return (updated === null || updated === void 0 ? void 0 : updated.name) === 'Updated Task' && (updated === null || updated === void 0 ? void 0 : updated.priority) === 'low';
            });
            test('toggleTaskCompletion toggles completion status', function () {
                var tasks = (0, operations_1.getAllTasks)();
                if (tasks.length === 0)
                    return false;
                var originalStatus = tasks[0].is_completed;
                var toggled = (0, operations_1.toggleTaskCompletion)(tasks[0].id);
                if (!toggled)
                    return false;
                return toggled.is_completed !== originalStatus;
            });
            test('getTodayTasks returns today\'s tasks', function () {
                var tasks = (0, operations_1.getTodayTasks)();
                return Array.isArray(tasks);
            });
            test('getWeekTasks returns this week\'s tasks', function () {
                var tasks = (0, operations_1.getWeekTasks)();
                return Array.isArray(tasks);
            });
            test('getUpcomingTasks returns upcoming tasks', function () {
                var tasks = (0, operations_1.getUpcomingTasks)();
                return Array.isArray(tasks);
            });
            test('getAllTasks returns all tasks', function () {
                var tasks = (0, operations_1.getAllTasks)();
                return Array.isArray(tasks);
            });
            test('getOverdueTaskCount returns count', function () {
                var count = (0, operations_1.getOverdueTaskCount)();
                return typeof count === 'number';
            });
            test('deleteTask removes task', function () {
                var defaultList = (0, operations_1.getDefaultList)();
                if (!defaultList)
                    return false;
                var task = (0, operations_1.createTask)({ list_id: defaultList.id, name: 'To Delete Task' });
                var result = (0, operations_1.deleteTask)(task.id);
                var deleted = (0, operations_1.getTaskById)(task.id);
                return result === true && deleted === null;
            });
            // Test 6: Search operations
            console.log('\n🔍 Search Operations:');
            test('searchTasks returns matching tasks', function () {
                var defaultList = (0, operations_1.getDefaultList)();
                if (!defaultList)
                    return false;
                // Create a task with unique name
                var uniqueName = "UniqueSearchTest_".concat(Date.now());
                (0, operations_1.createTask)({ list_id: defaultList.id, name: uniqueName });
                var results = (0, operations_1.searchTasks)(uniqueName);
                return results.length > 0 && results[0].name.includes(uniqueName);
            });
            // Test 7: Label operations
            console.log('\n🏷️ Label Operations:');
            test('createLabel creates a new label', function () {
                var label = (0, operations_1.createLabel)({ name: 'Test Label', color: '#00ff00' });
                return label.id.length === 36 && label.name === 'Test Label';
            });
            test('getLabels returns all labels', function () {
                var labels = (0, operations_1.getLabels)();
                return Array.isArray(labels);
            });
            // Test 8: Subtask operations
            console.log('\n📌 Subtask Operations:');
            test('createSubtask creates a new subtask', function () {
                var defaultList = (0, operations_1.getDefaultList)();
                if (!defaultList)
                    return false;
                var task = (0, operations_1.createTask)({ list_id: defaultList.id, name: 'Task with Subtasks' });
                var subtask = (0, operations_1.createSubtask)({ task_id: task.id, name: 'Subtask 1' });
                return subtask.id.length === 36 && subtask.name === 'Subtask 1';
            });
            test('getSubtasksByTaskId returns subtasks', function () {
                var tasks = (0, operations_1.getAllTasks)();
                if (tasks.length === 0)
                    return false;
                var subtasks = (0, operations_1.getSubtasksByTaskId)(tasks[0].id);
                return Array.isArray(subtasks);
            });
            // Test 9: Reminder operations
            console.log('\n⏰ Reminder Operations:');
            test('createReminder creates a new reminder', function () {
                var tasks = (0, operations_1.getAllTasks)();
                if (tasks.length === 0)
                    return false;
                var tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                var reminder = (0, operations_1.createReminder)({
                    task_id: tasks[0].id,
                    reminder_time: tomorrow.toISOString()
                });
                return reminder.id.length === 36;
            });
            test('getRemindersForTask returns reminders', function () {
                var tasks = (0, operations_1.getAllTasks)();
                if (tasks.length === 0)
                    return false;
                var reminders = (0, operations_1.getRemindersForTask)(tasks[0].id);
                return Array.isArray(reminders);
            });
            // Test 10: Task Log operations
            console.log('\n📊 Task Log Operations:');
            test('createLog creates a new log entry', function () {
                var tasks = (0, operations_1.getAllTasks)();
                if (tasks.length === 0)
                    return false;
                var log = (0, operations_1.createLog)({
                    task_id: tasks[0].id,
                    action: 'updated',
                    field_changed: 'priority',
                    old_value: 'low',
                    new_value: 'high'
                });
                return log.id.length === 36;
            });
            test('getLogsForTask returns logs', function () {
                var tasks = (0, operations_1.getAllTasks)();
                if (tasks.length === 0)
                    return false;
                var logs = (0, operations_1.getLogsForTask)(tasks[0].id);
                return Array.isArray(logs);
            });
            // Test 11: Task Label operations
            console.log('\n🔗 Task-Label Operations:');
            test('addLabelToTask associates label with task', function () {
                var labels = (0, operations_1.getLabels)();
                var tasks = (0, operations_1.getAllTasks)();
                if (labels.length === 0 || tasks.length === 0)
                    return true; // Skip if no data
                var result = (0, operations_1.addLabelToTask)(tasks[0].id, labels[0].id);
                return result === true;
            });
            test('getLabelsForTask returns labels for task', function () {
                var tasks = (0, operations_1.getAllTasks)();
                if (tasks.length === 0)
                    return true;
                var labels = (0, operations_1.getLabelsForTask)(tasks[0].id);
                return Array.isArray(labels);
            });
            // Summary
            console.log('\n' + '='.repeat(50));
            console.log("\n\uD83D\uDCCA Test Results: ".concat(testsPassed, " passed, ").concat(testsFailed, " failed"));
            if (testsFailed === 0) {
                console.log('\n🎉 All database tests passed!');
            }
            else {
                console.log('\n⚠️ Some tests failed. Please review the output above.');
            }
            // Cleanup test data
            console.log('\n🧹 Cleaning up test data...');
            db = (0, schema_1.getDatabase)();
            db.prepare('DELETE FROM task_labels').run();
            db.prepare('DELETE FROM task_reminders').run();
            db.prepare('DELETE FROM task_logs').run();
            db.prepare('DELETE FROM subtasks').run();
            db.prepare('DELETE FROM tasks WHERE name LIKE ?', "Test%").run();
            db.prepare('DELETE FROM labels WHERE name LIKE ?', "Test%").run();
            db.prepare('DELETE FROM lists WHERE name LIKE ? AND is_default = 0', "Test%").run();
            (0, schema_1.closeDatabase)(db);
            console.log('✅ Cleanup complete.');
            return [2 /*return*/];
        });
    });
}
main().catch(console.error);
