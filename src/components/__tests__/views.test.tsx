import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { AllView } from '../views/AllView';
import { TodayView } from '../views/TodayView';
import { UpcomingView } from '../views/UpcomingView';
import { WeekView } from '../views/WeekView';
import type { TaskWithRelations } from '@/lib/types';

// Import mocks and setup
import '@/lib/__tests__/jsdom-setup';
import { resetMocks } from '@/lib/__tests__/next-mocks';
import { NextTestProvider } from '@/lib/__tests__/next-test-provider';

describe('Views', () => {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().split('T')[0];

  const mockTasks: TaskWithRelations[] = [
    {
      id: 'task-today-1',
      list_id: 'list-1',
      name: 'Today Task 1',
      description: null,
      date: today,
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
    {
      id: 'task-today-2',
      list_id: 'list-1',
      name: 'Today Task 2',
      description: null,
      date: today,
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
    {
      id: 'task-tomorrow-1',
      list_id: 'list-1',
      name: 'Tomorrow Task',
      description: null,
      date: tomorrow,
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
    {
      id: 'task-next-week-1',
      list_id: 'list-1',
      name: 'Next Week Task',
      description: null,
      date: nextWeek,
      deadline: null,
      priority: 'none',
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
    {
      id: 'task-next-month-1',
      list_id: 'list-1',
      name: 'Next Month Task',
      description: null,
      date: nextMonthStr,
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
    {
      id: 'task-yesterday-1',
      list_id: 'list-1',
      name: 'Yesterday Task (Overdue)',
      description: null,
      date: yesterday,
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
    {
      id: 'task-completed-today',
      list_id: 'list-1',
      name: 'Completed Today Task',
      description: null,
      date: today,
      deadline: null,
      priority: 'medium',
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
    {
      id: 'task-past-week-1',
      list_id: 'list-1',
      name: 'Past Week Task',
      description: null,
      date: lastWeek,
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

  // ============== AllView Tests ==============

  describe('AllView', () => {
    it('renders all tasks without filtering', () => {
      renderWithProviders(
        <AllView tasks={mockTasks} />
      );
      
      expect(screen.getByText('Today Task 1')).toBeInTheDocument();
      expect(screen.getByText('Today Task 2')).toBeInTheDocument();
      expect(screen.getByText('Tomorrow Task')).toBeInTheDocument();
      expect(screen.getByText('Next Week Task')).toBeInTheDocument();
      expect(screen.getByText('Next Month Task')).toBeInTheDocument();
      expect(screen.getByText('Yesterday Task (Overdue)')).toBeInTheDocument();
      expect(screen.getByText('Past Week Task')).toBeInTheDocument();
    });

    it('shows empty state when no tasks', () => {
      renderWithProviders(
        <AllView tasks={[]} />
      );
      
      expect(screen.getByText(/no tasks/i)).toBeInTheDocument();
    });

    it('groups tasks by date', () => {
      renderWithProviders(
        <AllView tasks={mockTasks} />
      );
      
      // Should have date headers for tasks with different dates
      expect(screen.getByText(/today/i)).toBeInTheDocument();
      expect(screen.getByText(/tomorrow/i)).toBeInTheDocument();
    });

    it('excludes completed tasks by default', () => {
      renderWithProviders(
        <AllView tasks={mockTasks} />
      );
      
      expect(screen.queryByText('Completed Today Task')).not.toBeInTheDocument();
    });

    it('shows loading skeleton when isLoading is true', () => {
      renderWithProviders(
        <AllView tasks={[]} isLoading={true} />
      );
      
      // Should show loading indicator
      expect(screen.getByTestId('loading-skeleton') || screen.getByRole('heading', { name: /loading/i })).toBeInTheDocument();
    });

    it('handles single task correctly', () => {
      renderWithProviders(
        <AllView tasks={[mockTasks[0]]} />
      );
      
      expect(screen.getByText('Today Task 1')).toBeInTheDocument();
      expect(screen.queryByText('Today Task 2')).not.toBeInTheDocument();
    });

    it('handles tasks from different lists', () => {
      const multiListTasks: TaskWithRelations[] = [
        { ...mockTasks[0], list_id: 'list-1' },
        { ...mockTasks[1], list_id: 'list-2' },
      ];
      
      renderWithProviders(
        <AllView tasks={multiListTasks} />
      );
      
      expect(screen.getByText('Today Task 1')).toBeInTheDocument();
      expect(screen.getByText('Today Task 2')).toBeInTheDocument();
    });
  });

  // ============== TodayView Tests ==============

  describe('TodayView', () => {
    it('shows only today\'s tasks', () => {
      renderWithProviders(
        <TodayView tasks={mockTasks} />
      );
      
      expect(screen.getByText('Today Task 1')).toBeInTheDocument();
      expect(screen.getByText('Today Task 2')).toBeInTheDocument();
      expect(screen.queryByText('Tomorrow Task')).not.toBeInTheDocument();
      expect(screen.queryByText('Next Week Task')).not.toBeInTheDocument();
    });

    it('shows empty state when no today tasks', () => {
      const pastTasks = mockTasks.filter(t => t.date !== today);
      renderWithProviders(
        <TodayView tasks={pastTasks} />
      );
      
      expect(screen.getByText(/no tasks for today/i)).toBeInTheDocument();
    });

    it('shows overdue tasks with today tasks', () => {
      renderWithProviders(
        <TodayView tasks={mockTasks} />
      );
      
      // Overdue task from yesterday should be shown as overdue
      expect(screen.getByText('Yesterday Task (Overdue)')).toBeInTheDocument();
    });

    it('excludes completed tasks by default', () => {
      renderWithProviders(
        <TodayView tasks={mockTasks} />
      );
      
      expect(screen.queryByText('Completed Today Task')).not.toBeInTheDocument();
    });

    it('shows correct task count for today', () => {
      renderWithProviders(
        <TodayView tasks={mockTasks} />
      );
      
      expect(screen.getByText(/2 tasks/i)).toBeInTheDocument();
    });

    it('handles timezone edge cases', () => {
      // Create tasks at midnight boundary
      const midnightTasks: TaskWithRelations[] = [
        {
          id: 'task-midnight-1',
          list_id: 'list-1',
          name: 'Midnight Task',
          description: null,
          date: today,
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
      
      renderWithProviders(
        <TodayView tasks={midnightTasks} />
      );
      
      expect(screen.getByText('Midnight Task')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      renderWithProviders(
        <TodayView tasks={[]} isLoading={true} />
      );
      
      expect(screen.getByTestId('loading-skeleton') || screen.getByRole('heading', { name: /loading/i })).toBeInTheDocument();
    });
  });

  // ============== UpcomingView Tests ==============

  describe('UpcomingView', () => {
    it('shows future tasks (starting from today)', () => {
      renderWithProviders(
        <UpcomingView tasks={mockTasks} />
      );
      
      expect(screen.getByText('Today Task 1')).toBeInTheDocument();
      expect(screen.getByText('Today Task 2')).toBeInTheDocument();
      expect(screen.getByText('Tomorrow Task')).toBeInTheDocument();
      expect(screen.getByText('Next Week Task')).toBeInTheDocument();
      expect(screen.getByText('Next Month Task')).toBeInTheDocument();
    });

    it('excludes past tasks', () => {
      renderWithProviders(
        <UpcomingView tasks={mockTasks} />
      );
      
      expect(screen.queryByText('Yesterday Task (Overdue)')).not.toBeInTheDocument();
      expect(screen.queryByText('Past Week Task')).not.toBeInTheDocument();
    });

    it('shows empty state when no upcoming tasks', () => {
      const pastOnlyTasks = mockTasks.filter(t => t.date < today);
      renderWithProviders(
        <UpcomingView tasks={pastOnlyTasks} />
      );
      
      expect(screen.getByText(/no upcoming tasks/i)).toBeInTheDocument();
    });

    it('groups tasks by date', () => {
      renderWithProviders(
        <UpcomingView tasks={mockTasks} />
      );
      
      expect(screen.getByText(/today/i)).toBeInTheDocument();
      expect(screen.getByText(/tomorrow/i)).toBeInTheDocument();
    });

    it('excludes completed tasks by default', () => {
      renderWithProviders(
        <UpcomingView tasks={mockTasks} />
      );
      
      expect(screen.queryByText('Completed Today Task')).not.toBeInTheDocument();
    });

    it('handles tasks across month boundaries', () => {
      renderWithProviders(
        <UpcomingView tasks={mockTasks} />
      );
      
      expect(screen.getByText('Next Month Task')).toBeInTheDocument();
    });

    it('shows correct task count', () => {
      renderWithProviders(
        <UpcomingView tasks={mockTasks} />
      );
      
      expect(screen.getByText(/5 tasks/i)).toBeInTheDocument();
    });

    it('handles leap year dates correctly', () => {
      // February 29 in a leap year
      const leapYearTasks: TaskWithRelations[] = [
        {
          id: 'task-leap-1',
          list_id: 'list-1',
          name: 'Leap Day Task',
          description: null,
          date: '2024-02-29',
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
      
      renderWithProviders(
        <UpcomingView tasks={leapYearTasks} />
      );
      
      expect(screen.getByText('Leap Day Task')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      renderWithProviders(
        <UpcomingView tasks={[]} isLoading={true} />
      );
      
      expect(screen.getByTestId('loading-skeleton') || screen.getByRole('heading', { name: /loading/i })).toBeInTheDocument();
    });
  });

  // ============== WeekView Tests ==============

  describe('WeekView', () => {
    it('shows tasks within 7 days', () => {
      renderWithProviders(
        <WeekView tasks={mockTasks} />
      );
      
      expect(screen.getByText('Today Task 1')).toBeInTheDocument();
      expect(screen.getByText('Today Task 2')).toBeInTheDocument();
      expect(screen.getByText('Tomorrow Task')).toBeInTheDocument();
      expect(screen.getByText('Next Week Task')).toBeInTheDocument();
    });

    it('excludes tasks beyond 7 days', () => {
      renderWithProviders(
        <WeekView tasks={mockTasks} />
      );
      
      expect(screen.queryByText('Next Month Task')).not.toBeInTheDocument();
    });

    it('excludes past tasks before today', () => {
      renderWithProviders(
        <WeekView tasks={mockTasks} />
      );
      
      expect(screen.queryByText('Yesterday Task (Overdue)')).not.toBeInTheDocument();
      expect(screen.queryByText('Past Week Task')).not.toBeInTheDocument();
    });

    it('shows empty state when no tasks in week', () => {
      const farFutureTask: TaskWithRelations[] = [
        {
          id: 'task-far-future',
          list_id: 'list-1',
          name: 'Far Future Task',
          description: null,
          date: '2099-12-31',
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
      
      renderWithProviders(
        <WeekView tasks={farFutureTask} />
      );
      
      expect(screen.getByText(/no tasks this week/i)).toBeInTheDocument();
    });

    it('groups tasks by day', () => {
      renderWithProviders(
        <WeekView tasks={mockTasks} />
      );
      
      expect(screen.getByText(/today/i)).toBeInTheDocument();
      expect(screen.getByText(/tomorrow/i)).toBeInTheDocument();
    });

    it('excludes completed tasks by default', () => {
      renderWithProviders(
        <WeekView tasks={mockTasks} />
      );
      
      expect(screen.queryByText('Completed Today Task')).not.toBeInTheDocument();
    });

    it('handles week boundary correctly', () => {
      // Task exactly 7 days from now should be included
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];
      
      const boundaryTasks: TaskWithRelations[] = [
        {
          id: 'task-week-boundary',
          list_id: 'list-1',
          name: 'Week Boundary Task',
          description: null,
          date: sevenDaysStr,
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
      
      renderWithProviders(
        <WeekView tasks={boundaryTasks} />
      );
      
      expect(screen.getByText('Week Boundary Task')).toBeInTheDocument();
    });

    it('handles 8 days from now (outside week)', () => {
      const eightDaysFromNow = new Date();
      eightDaysFromNow.setDate(eightDaysFromNow.getDate() + 8);
      const eightDaysStr = eightDaysFromNow.toISOString().split('T')[0];
      
      const outsideWeekTasks: TaskWithRelations[] = [
        {
          id: 'task-outside-week',
          list_id: 'list-1',
          name: 'Outside Week Task',
          description: null,
          date: eightDaysStr,
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
      
      renderWithProviders(
        <WeekView tasks={outsideWeekTasks} />
      );
      
      expect(screen.queryByText('Outside Week Task')).not.toBeInTheDocument();
    });

    it('shows correct task count', () => {
      renderWithProviders(
        <WeekView tasks={mockTasks} />
      );
      
      expect(screen.getByText(/4 tasks/i)).toBeInTheDocument();
    });

    it('shows loading state', () => {
      renderWithProviders(
        <WeekView tasks={[]} isLoading={true} />
      );
      
      expect(screen.getByTestId('loading-skeleton') || screen.getByRole('heading', { name: /loading/i })).toBeInTheDocument();
    });
  });

  // ============== Edge Cases ==============

  describe('View Edge Cases', () => {
    it('handles tasks with null date', () => {
      const nullDateTasks: TaskWithRelations[] = [
        {
          id: 'task-no-date',
          list_id: 'list-1',
          name: 'No Date Task',
          description: null,
          date: null as unknown as string,
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
      
      // AllView should handle null dates
      renderWithProviders(
        <AllView tasks={nullDateTasks} />
      );
      
      expect(screen.getByText('No Date Task')).toBeInTheDocument();
    });

    it('handles tasks with all priority levels', () => {
      const priorityTasks: TaskWithRelations[] = ['high', 'medium', 'low', 'none'].map((priority, i) => ({
        id: `task-priority-${i}`,
        list_id: 'list-1',
        name: `${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority Task`,
        description: null,
        date: today,
        deadline: null,
        priority: priority as 'high' | 'medium' | 'low' | 'none',
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
      }));
      
      renderWithProviders(
        <TodayView tasks={priorityTasks} />
      );
      
      expect(screen.getByText('High Priority Task')).toBeInTheDocument();
      expect(screen.getByText('Medium Priority Task')).toBeInTheDocument();
      expect(screen.getByText('Low Priority Task')).toBeInTheDocument();
      expect(screen.getByText('None Priority Task')).toBeInTheDocument();
    });

    it('handles large number of tasks', () => {
      const manyTasks: TaskWithRelations[] = Array.from({ length: 50 }, (_, i) => ({
        id: `task-many-${i}`,
        list_id: 'list-1',
        name: `Task ${i + 1}`,
        description: null,
        date: today,
        deadline: null,
        priority: 'none',
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
      }));
      
      renderWithProviders(
        <TodayView tasks={manyTasks} />
      );
      
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 50')).toBeInTheDocument();
    });

    it('handles tasks with special characters in names', () => {
      const specialCharTasks: TaskWithRelations[] = [
        {
          id: 'task-special-1',
          list_id: 'list-1',
          name: "Task with 'quotes' and \"double quotes\"",
          description: null,
          date: today,
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
        {
          id: 'task-special-2',
          list_id: 'list-1',
          name: 'Task with <brackets> and & ampersand',
          description: null,
          date: today,
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
      
      renderWithProviders(
        <TodayView tasks={specialCharTasks} />
      );
      
      expect(screen.getByText(/Task with 'quotes'/i)).toBeInTheDocument();
    });

    it('handles month boundary crossing correctly', () => {
      // January 31 to February 1
      const jan31 = new Date('2024-01-31');
      const feb1 = new Date('2024-02-01');
      const todayDate = new Date();
      
      const boundaryTasks: TaskWithRelations[] = [
        {
          id: 'task-jan31',
          list_id: 'list-1',
          name: 'January 31 Task',
          description: null,
          date: jan31.toISOString().split('T')[0],
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
        {
          id: 'task-feb1',
          list_id: 'list-1',
          name: 'February 1 Task',
          description: null,
          date: feb1.toISOString().split('T')[0],
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
      
      // If today is near end of month, both tasks should appear in appropriate views
      renderWithProviders(
        <AllView tasks={boundaryTasks} />
      );
      
      expect(screen.getByText('January 31 Task')).toBeInTheDocument();
      expect(screen.getByText('February 1 Task')).toBeInTheDocument();
    });

    it('handles year boundary crossing correctly', () => {
      // December 31 to January 1
      const dec31 = new Date('2024-12-31');
      const jan1 = new Date('2025-01-01');
      
      const yearBoundaryTasks: TaskWithRelations[] = [
        {
          id: 'task-dec31',
          list_id: 'list-1',
          name: 'December 31 Task',
          description: null,
          date: dec31.toISOString().split('T')[0],
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
        {
          id: 'task-jan1',
          list_id: 'list-1',
          name: 'January 1 Task',
          description: null,
          date: jan1.toISOString().split('T')[0],
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
      
      renderWithProviders(
        <AllView tasks={yearBoundaryTasks} />
      );
      
      expect(screen.getByText('December 31 Task')).toBeInTheDocument();
      expect(screen.getByText('January 1 Task')).toBeInTheDocument();
    });
  });
});
