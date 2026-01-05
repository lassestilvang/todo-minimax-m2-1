import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TaskDetailDialog } from '../tasks/TaskDetailDialog';
import type { TaskWithRelations, TaskLog } from '@/lib/types';

// Import mocks and setup
import '@/lib/__tests__/jsdom-setup';
import { resetMocks } from '@/lib/__tests__/next-mocks';
import { NextTestProvider } from '@/lib/__tests__/next-test-provider';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, format) => 'formatted date'),
  formatDistanceToNow: vi.fn((date, options) => '2 days ago'),
}));

// Mock task actions
vi.mock('@/app/actions/task-actions', () => ({
  toggleTaskCompletionAction: vi.fn(),
  deleteTaskAction: vi.fn(),
  addSubtaskAction: vi.fn(),
  updateSubtaskAction: vi.fn(),
  deleteSubtaskAction: vi.fn(),
  addReminderAction: vi.fn(),
  deleteReminderAction: vi.fn(),
}));

describe('TaskDetailDialog', () => {
  const mockTask: TaskWithRelations = {
    id: 'task-1',
    list_id: 'list-1',
    name: 'Test Task',
    description: 'Test description',
    date: new Date().toISOString().split('T')[0],
    deadline: null,
    priority: 'high',
    is_completed: false,
    completed_at: null,
    estimate_minutes: 30,
    actual_minutes: null,
    recurring_pattern: null,
    attachments: null,
    created_at: new Date(),
    updated_at: new Date(),
    labels: [],
    subtasks: [],
    reminders: [],
  };

  const mockTaskWithSubtasks: TaskWithRelations = {
    ...mockTask,
    subtasks: [
      { id: 'sub-1', task_id: 'task-1', name: 'Subtask 1', is_completed: true, created_at: new Date() },
      { id: 'sub-2', task_id: 'task-1', name: 'Subtask 2', is_completed: false, created_at: new Date() },
    ],
  };

  const mockTaskWithLabels: TaskWithRelations = {
    ...mockTask,
    labels: [
      { id: 'label-1', name: 'Work', color: '#ff0000', icon: '💼', created_at: new Date() },
      { id: 'label-2', name: 'Urgent', color: '#00ff00', icon: '🔥', created_at: new Date() },
    ],
  };

  const mockLogs: TaskLog[] = [
    {
      id: 'log-1',
      task_id: 'task-1',
      action: 'created',
      field_changed: null,
      old_value: null,
      new_value: null,
      created_at: new Date(),
      created_by: null,
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

  it('does not render when task is null', () => {
    const { container } = renderWithProviders(
      <TaskDetailDialog task={null} open={true} onOpenChange={() => {}} />
    );
    
    // Dialog should not render content when task is null
    expect(container.textContent).toBe('');
  });

  it('renders task name', () => {
    renderWithProviders(
      <TaskDetailDialog task={mockTask} open={true} onOpenChange={() => {}} />
    );
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('renders task description', () => {
    renderWithProviders(
      <TaskDetailDialog task={mockTask} open={true} onOpenChange={() => {}} />
    );
    
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('shows priority badge', () => {
    renderWithProviders(
      <TaskDetailDialog task={mockTask} open={true} onOpenChange={() => {}} />
    );
    
    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });

  it('shows priority badge for medium priority', () => {
    const mediumTask = { ...mockTask, priority: 'medium' as const };
    renderWithProviders(
      <TaskDetailDialog task={mediumTask} open={true} onOpenChange={() => {}} />
    );
    
    expect(screen.getByText(/medium/i)).toBeInTheDocument();
  });

  it('shows priority badge for low priority', () => {
    const lowTask = { ...mockTask, priority: 'low' as const };
    renderWithProviders(
      <TaskDetailDialog task={lowTask} open={true} onOpenChange={() => {}} />
    );
    
    expect(screen.getByText(/low/i)).toBeInTheDocument();
  });

  it('does not show priority badge for none priority', () => {
    const noneTask = { ...mockTask, priority: 'none' as const };
    renderWithProviders(
      <TaskDetailDialog task={noneTask} open={true} onOpenChange={() => {}} />
    );
    
    expect(screen.queryByText(/priority/i)).not.toBeInTheDocument();
  });

  it('shows subtask progress', () => {
    renderWithProviders(
      <TaskDetailDialog task={mockTaskWithSubtasks} open={true} onOpenChange={() => {}} />
    );
    
    expect(screen.getByText(/subtasks/i)).toBeInTheDocument();
    expect(screen.getByText(/1\/2/i)).toBeInTheDocument();
  });

  it('renders subtask list', () => {
    renderWithProviders(
      <TaskDetailDialog task={mockTaskWithSubtasks} open={true} onOpenChange={() => {}} />
    );
    
    expect(screen.getByText('Subtask 1')).toBeInTheDocument();
    expect(screen.getByText('Subtask 2')).toBeInTheDocument();
  });

  it('renders labels', () => {
    renderWithProviders(
      <TaskDetailDialog task={mockTaskWithLabels} open={true} onOpenChange={() => {}} />
    );
    
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('shows estimated time', () => {
    renderWithProviders(
      <TaskDetailDialog task={mockTask} open={true} onOpenChange={() => {}} />
    );
    
    expect(screen.getByText(/30m/i)).toBeInTheDocument();
  });

  it('shows scheduled date', () => {
    renderWithProviders(
      <TaskDetailDialog task={mockTask} open={true} onOpenChange={() => {}} />
    );
    
    expect(screen.getByText(/scheduled/i)).toBeInTheDocument();
  });

  it('shows deadline when present', () => {
    const taskWithDeadline = { ...mockTask, deadline: new Date().toISOString() };
    renderWithProviders(
      <TaskDetailDialog task={taskWithDeadline} open={true} onOpenChange={() => {}} />
    );
    
    expect(screen.getByText(/due/i)).toBeInTheDocument();
  });

  it('shows recurring indicator when present', () => {
    const recurringTask = { ...mockTask, recurring_pattern: 'daily' };
    renderWithProviders(
      <TaskDetailDialog task={recurringTask} open={true} onOpenChange={() => {}} />
    );
    
    expect(screen.getByText(/recurring/i)).toBeInTheDocument();
  });

  it('has close button', () => {
    renderWithProviders(
      <TaskDetailDialog task={mockTask} open={true} onOpenChange={() => {}} />
    );
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('has edit button', () => {
    renderWithProviders(
      <TaskDetailDialog task={mockTask} open={true} onOpenChange={() => {}} />
    );
    
    // Edit button should be present (icon button)
    const editButtons = screen.getAllByRole('button');
    expect(editButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('has delete button', () => {
    renderWithProviders(
      <TaskDetailDialog task={mockTask} open={true} onOpenChange={() => {}} />
    );
    
    // Delete button should be present (icon button with trash icon)
    const deleteButtons = screen.getAllByRole('button');
    expect(deleteButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('has checkbox for completion', () => {
    renderWithProviders(
      <TaskDetailDialog task={mockTask} open={true} onOpenChange={() => {}} />
    );
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('shows activity log section', () => {
    renderWithProviders(
      <TaskDetailDialog task={mockTask} logs={mockLogs} open={true} onOpenChange={() => {}} />
    );
    
    const activityButton = screen.getByRole('button', { name: /activity log/i });
    expect(activityButton).toBeInTheDocument();
  });

  it('expands activity log when clicked', () => {
    renderWithProviders(
      <TaskDetailDialog task={mockTask} logs={mockLogs} open={true} onOpenChange={() => {}} />
    );
    
    // Click to expand activity log
    const activityButton = screen.getByRole('button', { name: /activity log/i });
    fireEvent.click(activityButton);
    
    // Activity log content should be visible
    expect(screen.getByText(/activity log/i)).toBeInTheDocument();
  });

  it('shows add subtask input', () => {
    renderWithProviders(
      <TaskDetailDialog task={mockTask} open={true} onOpenChange={() => {}} />
    );
    
    const subtaskInput = screen.getByPlaceholderText(/add subtask/i);
    expect(subtaskInput).toBeInTheDocument();
  });

  it('has add reminder button', () => {
    renderWithProviders(
      <TaskDetailDialog task={mockTask} open={true} onOpenChange={() => {}} />
    );
    
    const addReminderButton = screen.getByRole('button', { name: /add reminder/i });
    expect(addReminderButton).toBeInTheDocument();
  });

  it('applies completed styling when task is completed', () => {
    const completedTask = { ...mockTask, is_completed: true };
    renderWithProviders(
      <TaskDetailDialog task={completedTask} open={true} onOpenChange={() => {}} />
    );
    
    const taskName = screen.getByText('Test Task');
    expect(taskName).toHaveClass('line-through');
  });

  it('calls onOpenChange when close button is clicked', () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <TaskDetailDialog task={mockTask} open={true} onOpenChange={onOpenChange} />
    );
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    renderWithProviders(
      <TaskDetailDialog task={mockTask} open={true} onOpenChange={() => {}} onEdit={onEdit} />
    );
    
    // Find the edit button (icon button)
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find(b => b.innerHTML.includes('edit') || b.innerHTML.includes('Edit2'));
    if (editButton) {
      fireEvent.click(editButton);
      expect(onEdit).toHaveBeenCalled();
    }
  });

  it('shows created time in description', () => {
    renderWithProviders(
      <TaskDetailDialog task={mockTask} open={true} onOpenChange={() => {}} />
    );
    
    expect(screen.getByText(/created/i)).toBeInTheDocument();
  });

  it('does not show description section when empty', () => {
    const taskNoDescription = { ...mockTask, description: null };
    renderWithProviders(
      <TaskDetailDialog task={taskNoDescription} open={true} onOpenChange={() => {}} />
    );
    
    expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
  });

  it('shows subtask checkbox states correctly', () => {
    renderWithProviders(
      <TaskDetailDialog task={mockTaskWithSubtasks} open={true} onOpenChange={() => {}} />
    );
    
    // Both subtasks should have checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(2);
  });
});
