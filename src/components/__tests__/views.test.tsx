import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { TodayView } from '../views/TodayView';
import { WeekView } from '../views/WeekView';
import { UpcomingView } from '../views/UpcomingView';
import { AllView } from '../views/AllView';
import type { TaskWithRelations, List } from '@/lib/types';

describe('View Components', () => {
  const mockLists: List[] = [
    { id: 'list-1', name: 'Inbox', color: '#3b82f6', emoji: '📥', is_default: true, created_at: new Date(), updated_at: new Date() },
    { id: 'list-2', name: 'Work', color: '#ff0000', emoji: '💼', is_default: false, created_at: new Date(), updated_at: new Date() },
  ];

  const todayTasks: TaskWithRelations[] = [
    {
      id: 'task-1',
      list_id: 'list-1',
      name: 'Today Task 1',
      description: null,
      date: new Date().toISOString().split('T')[0],
      deadline: null,
      priority: 'high',
      is_completed: false,
      completed_at: null,
      estimate_minutes: null,
      actual_minutes: null,
      recurring_pattern: null,
      attachments: null,
      created_at: new Date(),
      updated_at: new Date(),
      labels: [],
      subtasks: [],
      reminders: [],
    },
  ];

  const overdueTasks: TaskWithRelations[] = [
    {
      id: 'task-overdue',
      list_id: 'list-1',
      name: 'Overdue Task',
      description: null,
      date: '2020-01-01',
      deadline: null,
      priority: 'high',
      is_completed: false,
      completed_at: null,
      estimate_minutes: null,
      actual_minutes: null,
      recurring_pattern: null,
      attachments: null,
      created_at: new Date(),
      updated_at: new Date(),
      labels: [],
      subtasks: [],
      reminders: [],
    },
  ];

  const weekTasks: TaskWithRelations[] = [
    {
      id: 'task-week',
      list_id: 'list-1',
      name: 'This Week Task',
      description: null,
      date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], // 3 days from now
      deadline: null,
      priority: 'medium',
      is_completed: false,
      completed_at: null,
      estimate_minutes: null,
      actual_minutes: null,
      recurring_pattern: null,
      attachments: null,
      created_at: new Date(),
      updated_at: new Date(),
      labels: [],
      subtasks: [],
      reminders: [],
    },
  ];

  const futureTasks: TaskWithRelations[] = [
    {
      id: 'task-future',
      list_id: 'list-1',
      name: 'Future Task',
      description: null,
      date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], // 30 days from now
      deadline: null,
      priority: 'low',
      is_completed: false,
      completed_at: null,
      estimate_minutes: null,
      actual_minutes: null,
      recurring_pattern: null,
      attachments: null,
      created_at: new Date(),
      updated_at: new Date(),
      labels: [],
      subtasks: [],
      reminders: [],
    },
  ];

  const allTasks: TaskWithRelations[] = [
    ...todayTasks,
    ...overdueTasks,
    ...weekTasks,
    ...futureTasks,
    {
      id: 'task-completed',
      list_id: 'list-1',
      name: 'Completed Task',
      description: null,
      date: new Date().toISOString().split('T')[0],
      deadline: null,
      priority: 'none',
      is_completed: true,
      completed_at: new Date(),
      estimate_minutes: null,
      actual_minutes: null,
      recurring_pattern: null,
      attachments: null,
      created_at: new Date(),
      updated_at: new Date(),
      labels: [],
      subtasks: [],
      reminders: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TodayView', () => {
    it('shows overdue tasks', () => {
      render(
        <TodayView
          overdueTasks={overdueTasks}
          todayTasks={todayTasks}
          isLoading={false}
        />
      );
      
      expect(screen.getByText('Overdue Task')).toBeInTheDocument();
    });

    it("shows today's tasks", () => {
      render(
        <TodayView
          overdueTasks={[]}
          todayTasks={todayTasks}
          isLoading={false}
        />
      );
      
      expect(screen.getByText('Today Task 1')).toBeInTheDocument();
    });

    it('shows empty state when no tasks', () => {
      render(
        <TodayView
          overdueTasks={[]}
          todayTasks={[]}
          isLoading={false}
        />
      );
      
      expect(screen.getByText(/no tasks for today/i)).toBeInTheDocument();
    });
  });

  describe('WeekView', () => {
    it('shows next 7 days grouped', () => {
      render(
        <WeekView
          todayTasks={todayTasks}
          tomorrowTasks={[]}
          thisWeekTasks={weekTasks}
          isLoading={false}
        />
      );
      
      expect(screen.getByText('This Week Task')).toBeInTheDocument();
    });

    it('groups tasks by date', () => {
      render(
        <WeekView
          todayTasks={todayTasks}
          tomorrowTasks={[]}
          thisWeekTasks={[]}
          isLoading={false}
        />
      );
      
      expect(screen.getByText('Today Task 1')).toBeInTheDocument();
    });
  });

  describe('UpcomingView', () => {
    it('shows future tasks', () => {
      render(
        <UpcomingView
          upcomingTasks={futureTasks}
          isLoading={false}
        />
      );
      
      expect(screen.getByText('Future Task')).toBeInTheDocument();
    });

    it('shows empty state when no upcoming tasks', () => {
      render(
        <UpcomingView
          upcomingTasks={[]}
          isLoading={false}
        />
      );
      
      expect(screen.getByText(/no upcoming tasks/i)).toBeInTheDocument();
    });
  });

  describe('AllView', () => {
    it('shows all tasks', () => {
      render(
        <AllView
          tasks={allTasks}
          isLoading={false}
        />
      );
      
      expect(screen.getByText('Today Task 1')).toBeInTheDocument();
      expect(screen.getByText('Future Task')).toBeInTheDocument();
    });

    it('shows completed toggle', () => {
      render(
        <AllView
          tasks={allTasks}
          isLoading={false}
        />
      );
      
      expect(screen.getByRole('button', { name: /completed/i })).toBeInTheDocument();
    });

    it('filters completed tasks by default', () => {
      render(
        <AllView
          tasks={allTasks}
          isLoading={false}
        />
      );
      
      // Completed task should not be visible initially
      expect(screen.queryByText('Completed Task')).not.toBeInTheDocument();
    });
  });
});
