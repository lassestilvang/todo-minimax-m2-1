"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createList = createList;
exports.updateList = updateList;
exports.deleteList = deleteList;
exports.getLists = getLists;
exports.getListById = getListById;
exports.getDefaultList = getDefaultList;
exports.getListsWithTaskCount = getListsWithTaskCount;
exports.createLabel = createLabel;
exports.updateLabel = updateLabel;
exports.deleteLabel = deleteLabel;
exports.getLabels = getLabels;
exports.getLabelById = getLabelById;
exports.createTask = createTask;
exports.updateTask = updateTask;
exports.deleteTask = deleteTask;
exports.getTaskById = getTaskById;
exports.getTaskByIdWithRelations = getTaskByIdWithRelations;
exports.getTasksByListId = getTasksByListId;
exports.getTasksByDateRange = getTasksByDateRange;
exports.getTodayTasks = getTodayTasks;
exports.getWeekTasks = getWeekTasks;
exports.getUpcomingTasks = getUpcomingTasks;
exports.getAllTasks = getAllTasks;
exports.toggleTaskCompletion = toggleTaskCompletion;
exports.getOverdueTaskCount = getOverdueTaskCount;
exports.createSubtask = createSubtask;
exports.updateSubtask = updateSubtask;
exports.deleteSubtask = deleteSubtask;
exports.getSubtasksByTaskId = getSubtasksByTaskId;
exports.getSubtaskById = getSubtaskById;
exports.addLabelToTask = addLabelToTask;
exports.removeLabelFromTask = removeLabelFromTask;
exports.getLabelsForTask = getLabelsForTask;
exports.getTasksForLabel = getTasksForLabel;
exports.createReminder = createReminder;
exports.getRemindersForTask = getRemindersForTask;
exports.getPendingReminders = getPendingReminders;
exports.markReminderTriggered = markReminderTriggered;
exports.deleteReminder = deleteReminder;
exports.createLog = createLog;
exports.getLogsForTask = getLogsForTask;
exports.getRecentLogs = getRecentLogs;
exports.searchTasks = searchTasks;
exports.searchTasksWithRelations = searchTasksWithRelations;
exports.deleteTasksByListId = deleteTasksByListId;
exports.completeAllTasksInList = completeAllTasksInList;
var uuid_1 = require("uuid");
var schema_1 = require("./schema");
// ============== Utility Functions ==============
function parseJSON(json, defaultValue) {
    if (!json)
        return defaultValue;
    try {
        return JSON.parse(json);
    }
    catch (_a) {
        return defaultValue;
    }
}
function formatDate(date) {
    if (!date)
        return null;
    if (typeof date === 'string')
        return date;
    return date.toISOString();
}
// ============== List Operations ==============
function createList(data) {
    var _a, _b, _c, _d, _e;
    var db = (0, schema_1.getDatabase)();
    var now = new Date().toISOString();
    var id = (0, uuid_1.v4)();
    var stmt = db.prepare("\n    INSERT INTO lists (id, name, color, emoji, is_default, created_at, updated_at)\n    VALUES (?, ?, ?, ?, ?, ?, ?)\n  ");
    stmt.run(id, data.name, (_a = data.color) !== null && _a !== void 0 ? _a : null, (_b = data.emoji) !== null && _b !== void 0 ? _b : null, data.is_default ? 1 : 0, now, now);
    (0, schema_1.closeDatabase)(db);
    return {
        id: id,
        name: data.name,
        color: (_c = data.color) !== null && _c !== void 0 ? _c : null,
        emoji: (_d = data.emoji) !== null && _d !== void 0 ? _d : null,
        is_default: (_e = data.is_default) !== null && _e !== void 0 ? _e : false,
        created_at: new Date(now),
        updated_at: new Date(now),
    };
}
function updateList(id, data) {
    var db = (0, schema_1.getDatabase)();
    var now = new Date().toISOString();
    var updates = [];
    var values = [];
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
    var stmt = db.prepare("UPDATE lists SET ".concat(updates.join(', '), " WHERE id = ?"));
    stmt.run.apply(stmt, values);
    (0, schema_1.closeDatabase)(db);
    return getListById(id);
}
function deleteList(id) {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare('DELETE FROM lists WHERE id = ?');
    var result = stmt.run(id);
    (0, schema_1.closeDatabase)(db);
    return result.changes > 0;
}
function getLists() {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare('SELECT * FROM lists ORDER BY is_default DESC, created_at ASC');
    var rows = stmt.all();
    (0, schema_1.closeDatabase)(db);
    return rows.map(function (row) { return (__assign(__assign({}, row), { is_default: row.is_default === 1, created_at: new Date(row.created_at), updated_at: new Date(row.updated_at) })); });
}
function getListById(id) {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare('SELECT * FROM lists WHERE id = ?');
    var row = stmt.get(id);
    (0, schema_1.closeDatabase)(db);
    if (!row)
        return null;
    return __assign(__assign({}, row), { is_default: row.is_default === 1, created_at: new Date(row.created_at), updated_at: new Date(row.updated_at) });
}
function getDefaultList() {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare('SELECT * FROM lists WHERE is_default = 1 LIMIT 1');
    var row = stmt.get();
    (0, schema_1.closeDatabase)(db);
    if (!row)
        return null;
    return __assign(__assign({}, row), { is_default: row.is_default === 1, created_at: new Date(row.created_at), updated_at: new Date(row.updated_at) });
}
function getListsWithTaskCount() {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare("\n    SELECT \n      l.*,\n      COUNT(t.id) as task_count,\n      SUM(CASE WHEN t.is_completed = 1 THEN 1 ELSE 0 END) as completed_count\n    FROM lists l\n    LEFT JOIN tasks t ON l.id = t.list_id\n    GROUP BY l.id\n    ORDER BY l.is_default DESC, l.created_at ASC\n  ");
    var rows = stmt.all();
    (0, schema_1.closeDatabase)(db);
    return rows.map(function (row) { return (__assign(__assign({}, row), { is_default: row.is_default === 1, task_count: row.task_count || 0, completed_count: row.completed_count || 0, created_at: new Date(row.created_at), updated_at: new Date(row.updated_at) })); });
}
// ============== Label Operations ==============
function createLabel(data) {
    var _a, _b, _c, _d;
    var db = (0, schema_1.getDatabase)();
    var now = new Date().toISOString();
    var id = (0, uuid_1.v4)();
    var stmt = db.prepare("\n    INSERT INTO labels (id, name, color, icon, created_at)\n    VALUES (?, ?, ?, ?, ?)\n  ");
    stmt.run(id, data.name, (_a = data.color) !== null && _a !== void 0 ? _a : null, (_b = data.icon) !== null && _b !== void 0 ? _b : null, now);
    (0, schema_1.closeDatabase)(db);
    return {
        id: id,
        name: data.name,
        color: (_c = data.color) !== null && _c !== void 0 ? _c : null,
        icon: (_d = data.icon) !== null && _d !== void 0 ? _d : null,
        created_at: new Date(now),
    };
}
function updateLabel(id, data) {
    var db = (0, schema_1.getDatabase)();
    var updates = [];
    var values = [];
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
    if (updates.length === 0)
        return getLabelById(id);
    values.push(id);
    var stmt = db.prepare("UPDATE labels SET ".concat(updates.join(', '), " WHERE id = ?"));
    stmt.run.apply(stmt, values);
    (0, schema_1.closeDatabase)(db);
    return getLabelById(id);
}
function deleteLabel(id) {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare('DELETE FROM labels WHERE id = ?');
    var result = stmt.run(id);
    (0, schema_1.closeDatabase)(db);
    return result.changes > 0;
}
function getLabels() {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare('SELECT * FROM labels ORDER BY name ASC');
    var rows = stmt.all();
    (0, schema_1.closeDatabase)(db);
    return rows.map(function (row) { return (__assign(__assign({}, row), { created_at: new Date(row.created_at) })); });
}
function getLabelById(id) {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare('SELECT * FROM labels WHERE id = ?');
    var row = stmt.get(id);
    (0, schema_1.closeDatabase)(db);
    if (!row)
        return null;
    return __assign(__assign({}, row), { created_at: new Date(row.created_at) });
}
// ============== Task Operations ==============
function createTask(data, logAction) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    if (logAction === void 0) { logAction = true; }
    var db = (0, schema_1.getDatabase)();
    var now = new Date().toISOString();
    var id = (0, uuid_1.v4)();
    var stmt = db.prepare("\n    INSERT INTO tasks (id, list_id, name, description, date, deadline, priority, \n      estimate_minutes, recurring_pattern, attachments, created_at, updated_at)\n    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\n  ");
    stmt.run(id, data.list_id, data.name, (_a = data.description) !== null && _a !== void 0 ? _a : null, formatDate(data.date), formatDate(data.deadline), (_b = data.priority) !== null && _b !== void 0 ? _b : 'none', (_c = data.estimate_minutes) !== null && _c !== void 0 ? _c : null, (_d = data.recurring_pattern) !== null && _d !== void 0 ? _d : null, data.attachments ? JSON.stringify(data.attachments) : null, now, now);
    if (logAction) {
        createLog({ task_id: id, action: 'created' });
    }
    (0, schema_1.closeDatabase)(db);
    return __assign(__assign({ id: id }, data), { description: (_e = data.description) !== null && _e !== void 0 ? _e : null, date: (_f = data.date) !== null && _f !== void 0 ? _f : null, deadline: (_g = data.deadline) !== null && _g !== void 0 ? _g : null, priority: (_h = data.priority) !== null && _h !== void 0 ? _h : 'none', is_completed: false, completed_at: null, estimate_minutes: (_j = data.estimate_minutes) !== null && _j !== void 0 ? _j : null, actual_minutes: null, recurring_pattern: (_k = data.recurring_pattern) !== null && _k !== void 0 ? _k : null, attachments: data.attachments ? JSON.stringify(data.attachments) : null, created_at: new Date(now), updated_at: new Date(now) });
}
function updateTask(id, data, logAction) {
    if (logAction === void 0) { logAction = true; }
    var db = (0, schema_1.getDatabase)();
    var now = new Date().toISOString();
    var updates = [];
    var values = [];
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
    var stmt = db.prepare("UPDATE tasks SET ".concat(updates.join(', '), " WHERE id = ?"));
    stmt.run.apply(stmt, values);
    if (logAction) {
        createLog({ task_id: id, action: 'updated' });
    }
    (0, schema_1.closeDatabase)(db);
    return getTaskById(id);
}
function deleteTask(id, logAction) {
    if (logAction === void 0) { logAction = true; }
    var db = (0, schema_1.getDatabase)();
    if (logAction) {
        createLog({ task_id: id, action: 'deleted' });
    }
    var stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    var result = stmt.run(id);
    (0, schema_1.closeDatabase)(db);
    return result.changes > 0;
}
function getTaskById(id) {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
    var row = stmt.get(id);
    (0, schema_1.closeDatabase)(db);
    if (!row)
        return null;
    return __assign(__assign({}, row), { is_completed: row.is_completed === 1, created_at: new Date(row.created_at), updated_at: new Date(row.updated_at), completed_at: row.completed_at ? new Date(row.completed_at) : null });
}
function getTaskByIdWithRelations(id) {
    var task = getTaskById(id);
    if (!task)
        return null;
    var labels = getLabelsForTask(id);
    var subtasks = getSubtasksByTaskId(id);
    var reminders = getRemindersForTask(id);
    return __assign(__assign({}, task), { labels: labels, subtasks: subtasks, reminders: reminders });
}
function getTasksByListId(listId) {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare('SELECT * FROM tasks WHERE list_id = ? ORDER BY created_at DESC');
    var rows = stmt.all(listId);
    (0, schema_1.closeDatabase)(db);
    return rows.map(function (row) { return (__assign(__assign({}, row), { is_completed: row.is_completed === 1, created_at: new Date(row.created_at), updated_at: new Date(row.updated_at), completed_at: row.completed_at ? new Date(row.completed_at) : null })); });
}
function getTasksByDateRange(startDate, endDate) {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare("\n    SELECT * FROM tasks \n    WHERE date >= ? AND date <= ?\n    ORDER BY date ASC, created_at DESC\n  ");
    var rows = stmt.all(startDate, endDate);
    (0, schema_1.closeDatabase)(db);
    return rows.map(function (row) { return (__assign(__assign({}, row), { is_completed: row.is_completed === 1, created_at: new Date(row.created_at), updated_at: new Date(row.updated_at), completed_at: row.completed_at ? new Date(row.completed_at) : null })); });
}
function getTodayTasks() {
    var db = (0, schema_1.getDatabase)();
    var today = new Date().toISOString().split('T')[0];
    var stmt = db.prepare("\n    SELECT * FROM tasks \n    WHERE date = ? AND is_completed = 0\n    ORDER BY priority DESC, created_at DESC\n  ");
    var rows = stmt.all(today);
    (0, schema_1.closeDatabase)(db);
    return rows.map(function (row) { return (__assign(__assign({}, row), { is_completed: row.is_completed === 1, created_at: new Date(row.created_at), updated_at: new Date(row.updated_at), completed_at: row.completed_at ? new Date(row.completed_at) : null })); });
}
function getWeekTasks() {
    var db = (0, schema_1.getDatabase)();
    var today = new Date().toISOString().split('T')[0];
    var nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    var nextWeekStr = nextWeek.toISOString().split('T')[0];
    var stmt = db.prepare("\n    SELECT * FROM tasks \n    WHERE date >= ? AND date <= ? AND is_completed = 0\n    ORDER BY date ASC, priority DESC\n  ");
    var rows = stmt.all(today, nextWeekStr);
    (0, schema_1.closeDatabase)(db);
    return rows.map(function (row) { return (__assign(__assign({}, row), { is_completed: row.is_completed === 1, created_at: new Date(row.created_at), updated_at: new Date(row.updated_at), completed_at: row.completed_at ? new Date(row.completed_at) : null })); });
}
function getUpcomingTasks() {
    var db = (0, schema_1.getDatabase)();
    var today = new Date().toISOString().split('T')[0];
    var stmt = db.prepare("\n    SELECT * FROM tasks \n    WHERE date >= ? AND is_completed = 0\n    ORDER BY date ASC, priority DESC\n  ");
    var rows = stmt.all(today);
    (0, schema_1.closeDatabase)(db);
    return rows.map(function (row) { return (__assign(__assign({}, row), { is_completed: row.is_completed === 1, created_at: new Date(row.created_at), updated_at: new Date(row.updated_at), completed_at: row.completed_at ? new Date(row.completed_at) : null })); });
}
function getAllTasks() {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC');
    var rows = stmt.all();
    (0, schema_1.closeDatabase)(db);
    return rows.map(function (row) { return (__assign(__assign({}, row), { is_completed: row.is_completed === 1, created_at: new Date(row.created_at), updated_at: new Date(row.updated_at), completed_at: row.completed_at ? new Date(row.completed_at) : null })); });
}
function toggleTaskCompletion(id) {
    var db = (0, schema_1.getDatabase)();
    var now = new Date().toISOString();
    var task = getTaskById(id);
    if (!task)
        return null;
    var newCompleted = !task.is_completed;
    var completedAt = newCompleted ? now : null;
    var action = newCompleted ? 'completed' : 'uncompleted';
    var stmt = db.prepare("\n    UPDATE tasks SET is_completed = ?, completed_at = ?, updated_at = ? WHERE id = ?\n  ");
    stmt.run(newCompleted ? 1 : 0, completedAt, now, id);
    createLog({ task_id: id, action: action });
    (0, schema_1.closeDatabase)(db);
    return getTaskById(id);
}
function getOverdueTaskCount() {
    var db = (0, schema_1.getDatabase)();
    var today = new Date().toISOString().split('T')[0];
    var stmt = db.prepare("\n    SELECT COUNT(*) as count FROM tasks \n    WHERE date < ? AND is_completed = 0\n  ");
    var result = stmt.get(today);
    (0, schema_1.closeDatabase)(db);
    return result.count;
}
// ============== Subtask Operations ==============
function createSubtask(data) {
    var db = (0, schema_1.getDatabase)();
    var now = new Date().toISOString();
    var id = (0, uuid_1.v4)();
    var stmt = db.prepare("\n    INSERT INTO subtasks (id, task_id, name, is_completed, created_at)\n    VALUES (?, ?, ?, ?, ?)\n  ");
    stmt.run(id, data.task_id, data.name, 0, now);
    (0, schema_1.closeDatabase)(db);
    return {
        id: id,
        task_id: data.task_id,
        name: data.name,
        is_completed: false,
        created_at: new Date(now),
    };
}
function updateSubtask(id, data) {
    var db = (0, schema_1.getDatabase)();
    var updates = [];
    var values = [];
    if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
    }
    if (data.is_completed !== undefined) {
        updates.push('is_completed = ?');
        values.push(data.is_completed ? 1 : 0);
    }
    if (updates.length === 0)
        return getSubtaskById(id);
    values.push(id);
    var stmt = db.prepare("UPDATE subtasks SET ".concat(updates.join(', '), " WHERE id = ?"));
    stmt.run.apply(stmt, values);
    (0, schema_1.closeDatabase)(db);
    return getSubtaskById(id);
}
function deleteSubtask(id) {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare('DELETE FROM subtasks WHERE id = ?');
    var result = stmt.run(id);
    (0, schema_1.closeDatabase)(db);
    return result.changes > 0;
}
function getSubtasksByTaskId(taskId) {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY created_at ASC');
    var rows = stmt.all(taskId);
    (0, schema_1.closeDatabase)(db);
    return rows.map(function (row) { return (__assign(__assign({}, row), { is_completed: row.is_completed === 1, created_at: new Date(row.created_at) })); });
}
function getSubtaskById(id) {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare('SELECT * FROM subtasks WHERE id = ?');
    var row = stmt.get(id);
    (0, schema_1.closeDatabase)(db);
    if (!row)
        return null;
    return __assign(__assign({}, row), { is_completed: row.is_completed === 1, created_at: new Date(row.created_at) });
}
// ============== Task Label Operations (Many-to-Many) ==============
function addLabelToTask(taskId, labelId) {
    var db = (0, schema_1.getDatabase)();
    // Check if already exists
    var existing = db.prepare('SELECT * FROM task_labels WHERE task_id = ? AND label_id = ?').get(taskId, labelId);
    if (existing) {
        (0, schema_1.closeDatabase)(db);
        return false;
    }
    var stmt = db.prepare('INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)');
    var result = stmt.run(taskId, labelId);
    (0, schema_1.closeDatabase)(db);
    return result.changes > 0;
}
function removeLabelFromTask(taskId, labelId) {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare('DELETE FROM task_labels WHERE task_id = ? AND label_id = ?');
    var result = stmt.run(taskId, labelId);
    (0, schema_1.closeDatabase)(db);
    return result.changes > 0;
}
function getLabelsForTask(taskId) {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare("\n    SELECT l.* FROM labels l\n    INNER JOIN task_labels tl ON l.id = tl.label_id\n    WHERE tl.task_id = ?\n    ORDER BY l.name ASC\n  ");
    var rows = stmt.all(taskId);
    (0, schema_1.closeDatabase)(db);
    return rows.map(function (row) { return (__assign(__assign({}, row), { created_at: new Date(row.created_at) })); });
}
function getTasksForLabel(labelId) {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare("\n    SELECT t.* FROM tasks t\n    INNER JOIN task_labels tl ON t.id = tl.task_id\n    WHERE tl.label_id = ?\n    ORDER BY t.created_at DESC\n  ");
    var rows = stmt.all(labelId);
    (0, schema_1.closeDatabase)(db);
    return rows.map(function (row) { return (__assign(__assign({}, row), { is_completed: row.is_completed === 1, created_at: new Date(row.created_at), updated_at: new Date(row.updated_at), completed_at: row.completed_at ? new Date(row.completed_at) : null })); });
}
// ============== Reminder Operations ==============
function createReminder(data) {
    var db = (0, schema_1.getDatabase)();
    var now = new Date().toISOString();
    var id = (0, uuid_1.v4)();
    var stmt = db.prepare("\n    INSERT INTO task_reminders (id, task_id, reminder_time, is_triggered, created_at)\n    VALUES (?, ?, ?, ?, ?)\n  ");
    stmt.run(id, data.task_id, data.reminder_time, 0, now);
    (0, schema_1.closeDatabase)(db);
    return {
        id: id,
        task_id: data.task_id,
        reminder_time: new Date(data.reminder_time),
        is_triggered: false,
        created_at: new Date(now),
    };
}
function getRemindersForTask(taskId) {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare("\n    SELECT * FROM task_reminders \n    WHERE task_id = ? \n    ORDER BY reminder_time ASC\n  ");
    var rows = stmt.all(taskId);
    (0, schema_1.closeDatabase)(db);
    return rows.map(function (row) { return (__assign(__assign({}, row), { is_triggered: row.is_triggered === 1, reminder_time: new Date(row.reminder_time), created_at: new Date(row.created_at) })); });
}
function getPendingReminders() {
    var db = (0, schema_1.getDatabase)();
    var now = new Date().toISOString();
    var stmt = db.prepare("\n    SELECT * FROM task_reminders \n    WHERE reminder_time <= ? AND is_triggered = 0\n    ORDER BY reminder_time ASC\n  ");
    var rows = stmt.all(now);
    (0, schema_1.closeDatabase)(db);
    return rows.map(function (row) { return (__assign(__assign({}, row), { is_triggered: row.is_triggered === 1, reminder_time: new Date(row.reminder_time), created_at: new Date(row.created_at) })); });
}
function markReminderTriggered(id) {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare('UPDATE task_reminders SET is_triggered = 1 WHERE id = ?');
    var result = stmt.run(id);
    (0, schema_1.closeDatabase)(db);
    return result.changes > 0;
}
function deleteReminder(id) {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare('DELETE FROM task_reminders WHERE id = ?');
    var result = stmt.run(id);
    (0, schema_1.closeDatabase)(db);
    return result.changes > 0;
}
// ============== Task Log Operations ==============
function createLog(data) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    var db = (0, schema_1.getDatabase)();
    var now = new Date().toISOString();
    var id = (0, uuid_1.v4)();
    var stmt = db.prepare("\n    INSERT INTO task_logs (id, task_id, action, field_changed, old_value, new_value, created_at, created_by)\n    VALUES (?, ?, ?, ?, ?, ?, ?, ?)\n  ");
    stmt.run(id, data.task_id, data.action, (_a = data.field_changed) !== null && _a !== void 0 ? _a : null, (_b = data.old_value) !== null && _b !== void 0 ? _b : null, (_c = data.new_value) !== null && _c !== void 0 ? _c : null, now, (_d = data.created_by) !== null && _d !== void 0 ? _d : 'user');
    (0, schema_1.closeDatabase)(db);
    return {
        id: id,
        task_id: data.task_id,
        action: data.action,
        field_changed: (_e = data.field_changed) !== null && _e !== void 0 ? _e : null,
        old_value: (_f = data.old_value) !== null && _f !== void 0 ? _f : null,
        new_value: (_g = data.new_value) !== null && _g !== void 0 ? _g : null,
        created_at: new Date(now),
        created_by: (_h = data.created_by) !== null && _h !== void 0 ? _h : 'user',
    };
}
function getLogsForTask(taskId) {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare("\n    SELECT * FROM task_logs \n    WHERE task_id = ?\n    ORDER BY created_at DESC\n  ");
    var rows = stmt.all(taskId);
    (0, schema_1.closeDatabase)(db);
    return rows.map(function (row) { return (__assign(__assign({}, row), { created_at: new Date(row.created_at) })); });
}
function getRecentLogs(limit) {
    if (limit === void 0) { limit = 50; }
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare("\n    SELECT * FROM task_logs \n    ORDER BY created_at DESC\n    LIMIT ?\n  ");
    var rows = stmt.all(limit);
    (0, schema_1.closeDatabase)(db);
    return rows.map(function (row) { return (__assign(__assign({}, row), { created_at: new Date(row.created_at) })); });
}
// ============== Search Operations ==============
function searchTasks(query) {
    if (!query.trim())
        return [];
    var db = (0, schema_1.getDatabase)();
    var searchTerm = "%".concat(query.toLowerCase(), "%");
    var stmt = db.prepare("\n    SELECT * FROM tasks \n    WHERE LOWER(name) LIKE ? OR LOWER(description) LIKE ?\n    ORDER BY \n      CASE \n        WHEN LOWER(name) LIKE ? THEN 1 \n        ELSE 2 \n      END,\n      created_at DESC\n    LIMIT 50\n  ");
    var rows = stmt.all(searchTerm, searchTerm, searchTerm);
    (0, schema_1.closeDatabase)(db);
    return rows.map(function (row) { return (__assign(__assign({}, row), { is_completed: row.is_completed === 1, created_at: new Date(row.created_at), updated_at: new Date(row.updated_at), completed_at: row.completed_at ? new Date(row.completed_at) : null })); });
}
function searchTasksWithRelations(query) {
    var tasks = searchTasks(query);
    return tasks.map(function (task) { return (__assign(__assign({}, task), { labels: getLabelsForTask(task.id), subtasks: getSubtasksByTaskId(task.id), reminders: getRemindersForTask(task.id), score: calculateSearchScore(task, query) })); });
}
function calculateSearchScore(task, query) {
    var queryLower = query.toLowerCase();
    var nameLower = task.name.toLowerCase();
    var descLower = (task.description || '').toLowerCase();
    var score = 0;
    // Exact match in name
    if (nameLower === queryLower)
        score += 100;
    // Starts with query
    else if (nameLower.startsWith(queryLower))
        score += 50;
    // Contains in name
    else if (nameLower.includes(queryLower))
        score += 30;
    // Contains in description
    if (descLower.includes(queryLower))
        score += 10;
    // Boost for incomplete tasks
    if (!task.is_completed)
        score += 5;
    // Boost for high priority
    if (task.priority === 'high')
        score += 3;
    return score;
}
// ============== Bulk Operations ==============
function deleteTasksByListId(listId) {
    var db = (0, schema_1.getDatabase)();
    var stmt = db.prepare('DELETE FROM tasks WHERE list_id = ?');
    var result = stmt.run(listId);
    (0, schema_1.closeDatabase)(db);
    return result.changes;
}
function completeAllTasksInList(listId) {
    var db = (0, schema_1.getDatabase)();
    var now = new Date().toISOString();
    var stmt = db.prepare("\n    UPDATE tasks SET is_completed = 1, completed_at = ?, updated_at = ? \n    WHERE list_id = ? AND is_completed = 0\n  ");
    var result = stmt.run(now, now, listId);
    (0, schema_1.closeDatabase)(db);
    return result.changes;
}
