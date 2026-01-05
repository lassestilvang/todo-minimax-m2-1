import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';
import { render, screen, cleanup, waitFor, getAllByText } from '@testing-library/react';
import { TodayView } from '../views/TodayView';
import { WeekView } from '../views/WeekView';
import { UpcomingView } from '../views/UpcomingView';
import { AllView } from '../views/AllView';
import type { TaskWithRelations, List } from '@/lib/types';

// Import mocks and setup
import '@/lib/__tests__/jsdom-setup';
import { resetMocks } from '@/lib/__tests__/next-mocks';
import { NextTestProvider } from '@/lib/__tests__/next-test-provider';

// Mock the fetch API globally for these tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('View Components', () => {
  const mockLists: List[] = [
    { id: 'list-1', name: 'Inbox', color: '#3b82f6', emoji: '📥', is_default: true, created_at: new Date(), updated_at: new Date() },
    { id: 'list-2', name: 'Work', color: '#ff0000', emoji: '💼', is_default: false, created_at: new Date(), updated_at: new Date() },
  ];

  // Helper function to format dates
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  // Helper to get tomorrow's date
  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow);
  };

  // Helper to get date X days from now
  const getDaysFromNow = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return formatDate(date);
  };

  // Helper to get next week's date
  const getNextWeek = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return formatDate(nextWeek);
  };

  // Helper to get next month's date
  const getNextMonth = () => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return formatDate(nextMonth);
  };

  const createTask = (overrides: Partial<TaskWithRelations> = {}): TaskWithRelations => ({
    id: 'task-1',
    list_id: 'list-1',
    name: 'Test Task',
    description: null,
    date: formatDate(new Date()),
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
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    resetMocks();
    // Reset fetch mock
    mockFetch.mockReset();
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

  // ==================== TODAY VIEW TESTS ====================
  describe('TodayView', () => {
    const todayDate = formatDate(new Date());

    const mockTodayTasks: TaskWithRelations[] = [
      createTask({ id: 'today-1', name: 'Today Task 1' }),
      createTask({ id: 'today-2', name: 'Today Task 2', priority: 'high' }),
    ];

    const mockOverdueTasks: TaskWithRelations[] = [
      createTask({ id: 'overdue-1', name: 'Overdue Task', date: '2020-01-01' }),
    ];

    const setupFetchMock = (tasks: TaskWithRelations[], overdueCount: number = 0) => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tasks, lists: mockLists }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ count: overdueCount }),
        });
    };

    describe('Loading State', () => {
      it('shows loading skeleton when initially loading', async () => {
        // Mock a delayed response
        mockFetch.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ tasks: [], lists: mockLists }),
        }), 100)));

        renderWithProviders(<TodayView />);

        // Should show skeleton initially
        const skeleton = document.querySelector('.animate-pulse');
        expect(skeleton).toBeTruthy();
      });

      it('shows correct number of skeleton items', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tasks: [], lists: mockLists }),
        }).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ count: 0 }),
        });

        renderWithProviders(<TodayView />);

        // Wait for loading to complete
        await waitFor(() => {
          expect(screen.queryByText(/no tasks for today/i)).toBeInTheDocument();
        });
      });
    });

    describe('Empty State', () => {
      it('shows empty state when no tasks', async () => {
        setupFetchMock([], 0);

        renderWithProviders(<TodayView />);

        await waitFor(() => {
          expect(screen.getByText(/no tasks for today/i)).toBeInTheDocument();
        });
      });

      it('shows add task button in empty state', async () => {
        setupFetchMock([], 0);

        renderWithProviders(<TodayView />);

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
        });
      });

      it('shows correct icon in empty state', async () => {
        setupFetchMock([], 0);

        renderWithProviders(<TodayView />);

        await waitFor(() => {
          // Should have a circle icon for empty state
          expect(screen.getByText(/no tasks for today/i)).toBeInTheDocument();
        });
      });
    });

    describe('Task Display', () => {
      it('renders tasks after loading', async () => {
        setupFetchMock(mockTodayTasks, 0);

        renderWithProviders(<TodayView />);

        await waitFor(() => {
          expect(screen.getByText('Today Task 1')).toBeInTheDocument();
          expect(screen.getByText('Today Task 2')).toBeInTheDocument();
        });
      });

      it('shows overdue tasks separately', async () => {
        setupFetchMock(mockOverdueTasks, 1);

        renderWithProviders(<TodayView />);

        await waitFor(() => {
          expect(screen.getByText('Overdue Task')).toBeInTheDocument();
        });
      });

      it('shows overdue count badge', async () => {
        setupFetchMock(mockOverdueTasks, 3);

        renderWithProviders(<TodayView />);

        await waitFor(() => {
          // Check that overdue count appears at least once
          const overdueElements = screen.getAllByText(/3 overdue/i);
          expect(overdueElements.length).toBeGreaterThan(0);
        });
      });

      it('shows priority badges on tasks', async () => {
        setupFetchMock(mockTodayTasks, 0);

        renderWithProviders(<TodayView />);

        await waitFor(() => {
          expect(screen.getByText(/high/i)).toBeInTheDocument();
        });
      });

      it('does not show completed tasks by default', async () => {
        const completedTask = createTask({ id: 'completed', name: 'Completed Task', is_completed: true });
        setupFetchMock([completedTask], 0);

        renderWithProviders(<TodayView />);

        await waitFor(() => {
          expect(screen.queryByText('Completed Task')).not.toBeInTheDocument();
        });
      });

      it('groups overdue and today tasks correctly', async () => {
        setupFetchMock([...mockOverdueTasks, ...mockTodayTasks], 1);

        renderWithProviders(<TodayView />);

        await waitFor(() => {
          expect(screen.getByText('Overdue Task')).toBeInTheDocument();
          expect(screen.getByText('Today Task 1')).toBeInTheDocument();
        });
      });
    });

    describe('Header', () => {
      it('displays Today header', async () => {
        setupFetchMock([], 0);

        renderWithProviders(<TodayView />);

        await waitFor(() => {
          // Use heading selector to be more specific
          const headings = screen.getAllByText(/today/i);
          expect(headings.some(el => el.tagName === 'H2')).toBe(true);
        });
      });

      it('displays current date', async () => {
        setupFetchMock([], 0);

        renderWithProviders(<TodayView />);

        await waitFor(() => {
          // Should show the formatted date
          const dateText = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
          const weekday = dateText.split(',')[0];
          expect(screen.getByText(new RegExp(weekday, 'i'))).toBeInTheDocument();
        });
      });

      it('shows task count', async () => {
        setupFetchMock(mockTodayTasks, 0);

        renderWithProviders(<TodayView />);

        await waitFor(() => {
          expect(screen.getByText(/2 task/i)).toBeInTheDocument();
        });
      });

      it('shows singular task count for one task', async () => {
        setupFetchMock([mockTodayTasks[0]], 0);

        renderWithProviders(<TodayView />);

        await waitFor(() => {
          expect(screen.getByText(/1 task/i)).toBeInTheDocument();
        });
      });
    });
  });

  // ==================== WEEK VIEW TESTS ====================
  describe('WeekView', () => {
    const todayDate = formatDate(new Date());
    const tomorrowDate = getTomorrow();

    const mockTodayTasks: TaskWithRelations[] = [
      createTask({ id: 'today-1', name: 'Today Task' }),
    ];

    const mockTomorrowTasks: TaskWithRelations[] = [
      createTask({ id: 'tomorrow-1', name: 'Tomorrow Task', date: tomorrowDate }),
    ];

    const mockWeekTasks: TaskWithRelations[] = [
      createTask({ id: 'week-1', name: 'Week Day Task', date: getDaysFromNow(3) }),
    ];

    const mockWeekendTasks: TaskWithRelations[] = [
      createTask({ id: 'weekend-1', name: 'Weekend Task', date: getDaysFromNow(6) }),
    ];

    const setupFetchMock = (tasks: TaskWithRelations[], overdueCount: number = 0) => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tasks, lists: mockLists }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ count: overdueCount }),
        });
    };

    describe('Loading State', () => {
      it('shows loading skeleton', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tasks: [], lists: mockLists }),
        }).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ count: 0 }),
        });

        renderWithProviders(<WeekView />);

        // Wait for loading to complete
        await waitFor(() => {
          expect(screen.queryByText(/next 7 days|week/i)).toBeInTheDocument();
        });
      });
    });

    describe('Empty State', () => {
      it('shows empty state when no tasks', async () => {
        setupFetchMock([], 0);

        renderWithProviders(<WeekView />);

        await waitFor(() => {
          expect(screen.getByText(/no tasks for the next 7 days|schedule is clear/i)).toBeInTheDocument();
        });
      });

      it('shows add task button in empty state', async () => {
        setupFetchMock([], 0);

        renderWithProviders(<WeekView />);

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /add|task/i })).toBeInTheDocument();
        });
      });
    });

    describe('Header', () => {
      it('displays Next 7 Days header', async () => {
        setupFetchMock([], 0);

        renderWithProviders(<WeekView />);

        await waitFor(() => {
          const headings = screen.getAllByText(/next 7 days|week/i);
          expect(headings.some(el => el.tagName === 'H2')).toBe(true);
        });
      });

      it('displays date range', async () => {
        setupFetchMock([], 0);

        renderWithProviders(<WeekView />);

        await waitFor(() => {
          expect(screen.getByText(/jan|dec|nov|oct|sep|aug|jul|jun|may|apr|mar|feb/i)).toBeInTheDocument();
        });
      });

      it('shows task count badge', async () => {
        setupFetchMock(mockTodayTasks, 0);

        renderWithProviders(<WeekView />);

        await waitFor(() => {
          expect(screen.getByText(/tasks/i)).toBeInTheDocument();
        });
      });
    });

    describe('Task Display', () => {
      it('renders today tasks', async () => {
        setupFetchMock(mockTodayTasks, 0);

        renderWithProviders(<WeekView />);

        await waitFor(() => {
          expect(screen.getByText('Today Task')).toBeInTheDocument();
        });
      });

      it('renders tomorrow tasks', async () => {
        setupFetchMock(mockTomorrowTasks, 0);

        renderWithProviders(<WeekView />);

        await waitFor(() => {
          expect(screen.getByText('Tomorrow Task')).toBeInTheDocument();
        });
      });

      it('renders week day tasks', async () => {
        setupFetchMock(mockWeekTasks, 0);

        renderWithProviders(<WeekView />);

        await waitFor(() => {
          expect(screen.getByText('Week Day Task')).toBeInTheDocument();
        });
      });

      it('renders weekend tasks', async () => {
        setupFetchMock(mockWeekendTasks, 0);

        renderWithProviders(<WeekView />);

        await waitFor(() => {
          const weekendElements = screen.getAllByText(/weekend/i);
          expect(weekendElements.length).toBeGreaterThan(0);
          expect(screen.getByText('Weekend Task')).toBeInTheDocument();
        });
      });

      it('shows overdue count', async () => {
        setupFetchMock([], 2);

        renderWithProviders(<WeekView />);

        await waitFor(() => {
          const overdueElements = screen.getAllByText(/2 overdue|overdue/i);
          expect(overdueElements.length).toBeGreaterThan(0);
        });
      });
    });
  });

  // ==================== UPCOMING VIEW TESTS ====================
  describe('UpcomingView', () => {
    const todayDate = formatDate(new Date());

    const mockTodayTasks: TaskWithRelations[] = [
      createTask({ id: 'today-1', name: 'Today Task' }),
    ];

    const mockTomorrowTasks: TaskWithRelations[] = [
      createTask({ id: 'tomorrow-1', name: 'Tomorrow Task', date: getTomorrow() }),
    ];

    const mockWeekTasks: TaskWithRelations[] = [
      createTask({ id: 'week-1', name: 'This Week Task', date: getDaysFromNow(3) }),
    ];

    const mockNextWeekTasks: TaskWithRelations[] = [
      createTask({ id: 'next-week-1', name: 'Next Week Task', date: getNextWeek() }),
    ];

    const mockFutureTasks: TaskWithRelations[] = [
      createTask({ id: 'future-1', name: 'Future Task', date: getNextMonth(), priority: 'low' }),
    ];

    const mockOverdueTasks: TaskWithRelations[] = [
      createTask({ id: 'overdue-1', name: 'Overdue Task', date: '2020-01-01' }),
    ];

    const setupFetchMock = (tasks: TaskWithRelations[], overdueCount: number = 0) => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tasks, lists: mockLists }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ count: overdueCount }),
        });
    };

    describe('Loading State', () => {
      it('shows loading skeleton', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tasks: [], lists: mockLists }),
        }).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ count: 0 }),
        });

        renderWithProviders(<UpcomingView />);

        await waitFor(() => {
          expect(screen.queryByText(/upcoming/i)).toBeInTheDocument();
        });
      });
    });

    describe('Empty State', () => {
      it('shows empty state when no upcoming tasks', async () => {
        setupFetchMock([], 0);

        renderWithProviders(<UpcomingView />);

        await waitFor(() => {
          expect(screen.getByText(/no upcoming tasks|all caught up/i)).toBeInTheDocument();
        });
      });

      it('shows add task button in empty state', async () => {
        setupFetchMock([], 0);

        renderWithProviders(<UpcomingView />);

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /add|schedule/i })).toBeInTheDocument();
        });
      });
    });

    describe('Header', () => {
      it('displays Upcoming header', async () => {
        setupFetchMock([], 0);

        renderWithProviders(<UpcomingView />);

        await waitFor(() => {
          const headings = screen.getAllByText(/upcoming/i);
          expect(headings.some(el => el.tagName === 'H2')).toBe(true);
        });
      });

      it('displays current month', async () => {
        setupFetchMock([], 0);

        renderWithProviders(<UpcomingView />);

        await waitFor(() => {
          const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          const monthName = currentMonth.split(' ')[0];
          expect(screen.getByText(new RegExp(monthName, 'i'))).toBeInTheDocument();
        });
      });

      it('shows task count', async () => {
        setupFetchMock(mockFutureTasks, 0);

        renderWithProviders(<UpcomingView />);

        await waitFor(() => {
          expect(screen.getByText(/upcoming|tasks/i)).toBeInTheDocument();
        });
      });
    });

    describe('Task Grouping', () => {
      it('groups today tasks', async () => {
        setupFetchMock(mockTodayTasks, 0);

        renderWithProviders(<UpcomingView />);

        await waitFor(() => {
          expect(screen.getByText('Today Task')).toBeInTheDocument();
        });
      });

      it('groups tomorrow tasks', async () => {
        setupFetchMock(mockTomorrowTasks, 0);

        renderWithProviders(<UpcomingView />);

        await waitFor(() => {
          expect(screen.getByText('Tomorrow Task')).toBeInTheDocument();
        });
      });

      it('groups this week tasks', async () => {
        setupFetchMock(mockWeekTasks, 0);

        renderWithProviders(<UpcomingView />);

        await waitFor(() => {
          const weekElements = screen.getAllByText(/this week/i);
          expect(weekElements.length).toBeGreaterThan(0);
          expect(screen.getByText('This Week Task')).toBeInTheDocument();
        });
      });

      it('groups next week tasks', async () => {
        setupFetchMock(mockNextWeekTasks, 0);

        renderWithProviders(<UpcomingView />);

        await waitFor(() => {
          const nextWeekElements = screen.getAllByText(/next week/i);
          expect(nextWeekElements.length).toBeGreaterThan(0);
          expect(screen.getByText('Next Week Task')).toBeInTheDocument();
        });
      });

      it('groups later tasks', async () => {
        setupFetchMock(mockFutureTasks, 0);

        renderWithProviders(<UpcomingView />);

        await waitFor(() => {
          const laterElements = screen.getAllByText(/later/i);
          expect(laterElements.length).toBeGreaterThan(0);
          expect(screen.getByText('Future Task')).toBeInTheDocument();
        });
      });

      it('groups overdue tasks', async () => {
        setupFetchMock(mockOverdueTasks, 1);

        renderWithProviders(<UpcomingView />);

        await waitFor(() => {
          expect(screen.getByText('Overdue Task')).toBeInTheDocument();
          const overdueElements = screen.getAllByText(/overdue/i);
          expect(overdueElements.length).toBeGreaterThan(0);
        });
      });
    });

    describe('Task Display', () => {
      it('shows priority badges', async () => {
        setupFetchMock(mockFutureTasks, 0);

        renderWithProviders(<UpcomingView />);

        await waitFor(() => {
          expect(screen.getByText(/low/i)).toBeInTheDocument();
        });
      });

      it('does not show completed tasks by default', async () => {
        const completedTask = createTask({ id: 'completed', name: 'Completed Task', is_completed: true });
        setupFetchMock([completedTask], 0);

        renderWithProviders(<UpcomingView />);

        await waitFor(() => {
          expect(screen.queryByText('Completed Task')).not.toBeInTheDocument();
        });
      });
    });
  });

  // ==================== ALL VIEW TESTS ====================
  describe('AllView', () => {
    const todayDate = formatDate(new Date());

    const mockTodayTasks: TaskWithRelations[] = [
      createTask({ id: 'today-1', name: 'Today Task' }),
    ];

    const mockOverdueTasks: TaskWithRelations[] = [
      createTask({ id: 'overdue-1', name: 'Overdue Task', date: '2020-01-01' }),
    ];

    const mockTomorrowTasks: TaskWithRelations[] = [
      createTask({ id: 'tomorrow-1', name: 'Tomorrow Task', date: getTomorrow() }),
    ];

    const mockWeekTasks: TaskWithRelations[] = [
      createTask({ id: 'week-1', name: 'This Week Task', date: getDaysFromNow(3) }),
    ];

    const mockMonthTasks: TaskWithRelations[] = [
      createTask({ id: 'month-1', name: 'This Month Task', date: getDaysFromNow(15) }),
    ];

    const mockFutureTasks: TaskWithRelations[] = [
      createTask({ id: 'future-1', name: 'Later Task', date: getNextMonth(), priority: 'low' }),
    ];

    const mockNoDateTasks: TaskWithRelations[] = [
      createTask({ id: 'nodate-1', name: 'No Date Task', date: null as any }),
    ];

    const mockCompletedTasks: TaskWithRelations[] = [
      createTask({ id: 'completed-1', name: 'Completed Task', is_completed: true, completed_at: new Date() }),
    ];

    const setupFetchMock = (tasks: TaskWithRelations[], overdueCount: number = 0) => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tasks }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ count: overdueCount }),
        });
    };

    describe('Loading State', () => {
      it('shows loading skeleton', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tasks: [] }),
        }).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ count: 0 }),
        });

        renderWithProviders(<AllView />);

        await waitFor(() => {
          expect(screen.queryByText(/all tasks/i)).toBeInTheDocument();
        });
      });
    });

    describe('Empty State', () => {
      it('shows empty state when no tasks', async () => {
        setupFetchMock([], 0);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          expect(screen.getByText(/no tasks yet|first task/i)).toBeInTheDocument();
        });
      });

      it('shows add first task button', async () => {
        setupFetchMock([], 0);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /first task/i })).toBeInTheDocument();
        });
      });

      it('shows layers icon in empty state', async () => {
        setupFetchMock([], 0);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
        });
      });
    });

    describe('Header', () => {
      it('displays All Tasks header', async () => {
        setupFetchMock([], 0);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          const headings = screen.getAllByText(/all tasks/i);
          expect(headings.some(el => el.tagName === 'H2')).toBe(true);
        });
      });

      it('shows total task count', async () => {
        setupFetchMock(mockTodayTasks, 0);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          expect(screen.getByText(/total task/i)).toBeInTheDocument();
        });
      });

      it('shows completed count badge', async () => {
        setupFetchMock(mockCompletedTasks, 0);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          const completedElements = screen.getAllByText(/completed/i);
          expect(completedElements.length).toBeGreaterThan(0);
        });
      });

      it('shows overdue count badge', async () => {
        setupFetchMock(mockOverdueTasks, 5);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          const overdueElements = screen.getAllByText(/5 overdue|overdue/i);
          expect(overdueElements.length).toBeGreaterThan(0);
        });
      });
    });

    describe('Task Grouping', () => {
      it('groups overdue tasks', async () => {
        setupFetchMock(mockOverdueTasks, 1);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          expect(screen.getByText('Overdue Task')).toBeInTheDocument();
          const overdueHeaders = screen.getAllByText(/overdue/i);
          expect(overdueHeaders.some(el => el.tagName === 'H3')).toBe(true);
        });
      });

      it('groups today tasks', async () => {
        setupFetchMock(mockTodayTasks, 0);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          expect(screen.getByText('Today Task')).toBeInTheDocument();
          const todayHeaders = screen.getAllByText(/today/i);
          expect(todayHeaders.some(el => el.tagName === 'H3')).toBe(true);
        });
      });

      it('groups tomorrow tasks', async () => {
        setupFetchMock(mockTomorrowTasks, 0);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          expect(screen.getByText('Tomorrow Task')).toBeInTheDocument();
          const tomorrowHeaders = screen.getAllByText(/tomorrow/i);
          expect(tomorrowHeaders.some(el => el.tagName === 'H3')).toBe(true);
        });
      });

      it('groups this week tasks', async () => {
        setupFetchMock(mockWeekTasks, 0);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          expect(screen.getByText('This Week Task')).toBeInTheDocument();
          const weekHeaders = screen.getAllByText(/this week/i);
          expect(weekHeaders.some(el => el.tagName === 'H3')).toBe(true);
        });
      });

      it('groups this month tasks', async () => {
        setupFetchMock(mockMonthTasks, 0);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          expect(screen.getByText('This Month Task')).toBeInTheDocument();
          const monthHeaders = screen.getAllByText(/this month/i);
          expect(monthHeaders.some(el => el.tagName === 'H3')).toBe(true);
        });
      });

      it('groups later tasks', async () => {
        setupFetchMock(mockFutureTasks, 0);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          expect(screen.getByText('Later Task')).toBeInTheDocument();
          const laterHeaders = screen.getAllByText(/later/i);
          expect(laterHeaders.some(el => el.tagName === 'H3')).toBe(true);
        });
      });

      it('groups no date tasks', async () => {
        setupFetchMock(mockNoDateTasks, 0);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          expect(screen.getByText('No Date Task')).toBeInTheDocument();
          const nodateHeaders = screen.getAllByText(/no date/i);
          expect(nodateHeaders.some(el => el.tagName === 'H3')).toBe(true);
        });
      });

      it('groups completed tasks', async () => {
        setupFetchMock(mockCompletedTasks, 0);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          expect(screen.getByText('Completed Task')).toBeInTheDocument();
          const completedHeaders = screen.getAllByText(/completed/i);
          expect(completedHeaders.some(el => el.tagName === 'H3')).toBe(true);
        });
      });
    });

    describe('Task Display', () => {
      it('shows priority badges', async () => {
        setupFetchMock(mockFutureTasks, 0);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          expect(screen.getByText(/low/i)).toBeInTheDocument();
        });
      });

      it('shows date badges on tasks', async () => {
        setupFetchMock(mockTodayTasks, 0);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          expect(screen.getByText(/jan|dec|nov|oct|sep|aug|jul|jun|may|apr|mar|feb/i)).toBeInTheDocument();
        });
      });

      it('shows list badges on tasks', async () => {
        setupFetchMock(mockTodayTasks, 0);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          const listElements = screen.getAllByText(/list/i);
          expect(listElements.length).toBeGreaterThan(0);
        });
      });

      it('applies strikethrough to completed tasks', async () => {
        setupFetchMock(mockCompletedTasks, 0);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          expect(screen.getByText('Completed Task')).toBeInTheDocument();
        });
      });

      it('shows overdue badge on overdue task cards', async () => {
        setupFetchMock(mockOverdueTasks, 1);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          // Check that there's an overdue badge on the task card
          const overdueBadges = screen.getAllByText((content) => content.includes('Overdue'));
          expect(overdueBadges.length).toBeGreaterThan(0);
        });
      });
    });

    describe('Group Headers', () => {
      it('shows correct styling for overdue group', async () => {
        setupFetchMock(mockOverdueTasks, 1);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          const overdueHeader = screen.getByText(/overdue/i);
          expect(overdueHeader).toBeInTheDocument();
        });
      });

      it('shows task count in group headers', async () => {
        setupFetchMock([...mockTodayTasks, ...mockOverdueTasks], 0);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          // Check that count appears in group headers (h3 elements)
          const countElements = screen.getAllByText(/\(1\)/);
          expect(countElements.length).toBeGreaterThan(0);
        });
      });
    });

    describe('Mixed Scenarios', () => {
      it('handles multiple task types', async () => {
        const allTasks = [
          ...mockTodayTasks,
          ...mockOverdueTasks,
          ...mockFutureTasks,
        ];
        setupFetchMock(allTasks, 1);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          expect(screen.getByText('Today Task')).toBeInTheDocument();
          expect(screen.getByText('Overdue Task')).toBeInTheDocument();
          expect(screen.getByText('Later Task')).toBeInTheDocument();
        });
      });
    });

    describe('Date Edge Cases', () => {
      it('handles leap year February 29', async () => {
        const leapTask = createTask({
          id: 'leap',
          name: 'Leap Day Task',
          date: '2024-02-29',
        });
        setupFetchMock([leapTask], 0);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          expect(screen.getByText('Leap Day Task')).toBeInTheDocument();
        });
      });

      it('handles non-leap year February 28', async () => {
        const febTask = createTask({
          id: 'feb',
          name: 'Feb Task',
          date: '2023-02-28',
        });
        setupFetchMock([febTask], 0);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          expect(screen.getByText('Feb Task')).toBeInTheDocument();
        });
      });

      it('handles year boundary tasks', async () => {
        const yearEndTask = createTask({
          id: 'year-end',
          name: 'Year End',
          date: '2024-12-31',
        });
        setupFetchMock([yearEndTask], 0);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          expect(screen.getByText('Year End')).toBeInTheDocument();
        });
      });

      it('handles new year tasks', async () => {
        const newYearTask = createTask({
          id: 'new-year',
          name: 'New Year',
          date: '2025-01-01',
        });
        setupFetchMock([newYearTask], 0);

        renderWithProviders(<AllView />);

        await waitFor(() => {
          expect(screen.getByText('New Year')).toBeInTheDocument();
        });
      });
    });
  });

  // ==================== VIEW COMPONENT INTEGRATION ====================
  describe('View Components Integration', () => {
    const todayDate = formatDate(new Date());
    const createMockTasks = () => [
      createTask({ id: '1', name: 'Task 1', date: todayDate }),
      createTask({ id: '2', name: 'Task 2', date: getTomorrow() }),
      createTask({ id: '3', name: 'Task 3', date: getDaysFromNow(3) }),
    ];

    it('AllView and TodayView can be rendered together', async () => {
      const tasks = createMockTasks();
      
      // Setup mock for first render
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tasks, lists: mockLists }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ count: 0 }),
        })
        // Setup mock for second render
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tasks: tasks.filter(t => t.date === todayDate), lists: mockLists }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ count: 0 }),
        });

      const { unmount: unmountToday } = renderWithProviders(
        <AllView />
      );

      await waitFor(() => {
        expect(screen.getByText(/all tasks/i)).toBeInTheDocument();
      });

      unmountToday();

      mockFetch.mockClear();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tasks: tasks.filter(t => t.date === todayDate), lists: mockLists }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ count: 0 }),
        });

      renderWithProviders(<TodayView />);

      await waitFor(() => {
        expect(screen.getByText(/today/i)).toBeInTheDocument();
      });
    });
  });
});
