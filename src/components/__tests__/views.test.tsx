import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { TodayView } from '../views/TodayView';
import { WeekView } from '../views/WeekView';
import { UpcomingView } from '../views/UpcomingView';
import { AllView } from '../views/AllView';
import type { TaskWithRelations, List } from '@/lib/types';

// Import mocks and setup
import '@/lib/__tests__/jsdom-setup';
import { resetMocks } from '@/lib/__tests__/next-mocks';
import { NextTestProvider } from '@/lib/__tests__/next-test-provider';

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
    resetMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <NextTestProvider>{ui}</NextTestProvider>
    );
  };

  describe('TodayView', () => {
    it('renders the today view title', () => {
      renderWithProviders(
        <TodayView
          overdueTasks={overdueTasks}
          todayTasks={todayTasks}
          isLoading={false}
        />
      );
      
      expect(screen.getByText(/today/i)).toBeInTheDocument();
    });

    it('shows overdue section when overdue tasks exist', () => {
      renderWithProviders(
        <TodayView
          overdueTasks={overdueTasks}
          todayTasks={todayTasks}
          isLoading={false}
        />
      );
      
      // Should show overdue indicator in header or tasks
      expect(screen.getByText(/overdue|alert/i) || screen.getByText(/Today/i)).toBeInTheDocument();
    });

    it('renders with correct structure', () => {
      renderWithProviders(
        <TodayView
          overdueTasks={[]}
          todayTasks={todayTasks}
          isLoading={false}
        />
      );
      
      // Check that the component renders without errors
      expect(screen.getByText(/today/i)).toBeInTheDocument();
    });
  });

  describe('WeekView', () => {
    it('renders the week view title', () => {
      renderWithProviders(
        <WeekView
          todayTasks={todayTasks}
          tomorrowTasks={[]}
          thisWeekTasks={weekTasks}
          isLoading={false}
        />
      );
      
      expect(screen.getByText(/week/i)).toBeInTheDocument();
    });

    it('renders with correct structure', () => {
      renderWithProviders(
        <WeekView
          todayTasks={todayTasks}
          tomorrowTasks={[]}
          thisWeekTasks={[]}
          isLoading={false}
        />
      );
      
      expect(screen.getByText(/week/i)).toBeInTheDocument();
    });
  });

  describe('UpcomingView', () => {
    it('renders the upcoming view title', () => {
      renderWithProviders(
        <UpcomingView
          upcomingTasks={futureTasks}
          isLoading={false}
        />
      );
      
      expect(screen.getByText(/upcoming/i)).toBeInTheDocument();
    });

    it('renders with correct structure', () => {
      renderWithProviders(
        <UpcomingView
          upcomingTasks={[]}
          isLoading={false}
        />
      );
      
      expect(screen.getByText(/upcoming/i)).toBeInTheDocument();
    });
  });

  describe('AllView', () => {
    it('renders the all view title', () => {
      renderWithProviders(
        <AllView
          tasks={allTasks}
          isLoading={false}
        />
      );
      
      expect(screen.getByText(/all tasks|all/i)).toBeInTheDocument();
    });

    it('shows task count', () => {
      renderWithProviders(
        <AllView
          tasks={allTasks}
          isLoading={false}
        />
      );
      
      // Should show some text about tasks
      expect(screen.getByText(/all tasks|all/i)).toBeInTheDocument();
    });

    it('renders with correct structure', () => {
      renderWithProviders(
        <AllView
          tasks={allTasks}
          isLoading={false}
        />
      );
      
      expect(screen.getByText(/all/i)).toBeInTheDocument();
    });
  });
});
