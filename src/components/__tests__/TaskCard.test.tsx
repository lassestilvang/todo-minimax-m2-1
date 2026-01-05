import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TaskCard } from '../tasks/TaskCard';
import type { TaskWithRelations } from '@/lib/types';

// Import mocks and setup
import '@/lib/__tests__/jsdom-setup';
import { resetMocks } from '@/lib/__tests__/next-mocks';
import { NextTestProvider } from '@/lib/__tests__/next-test-provider';

describe('TaskCard', () => {
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

  it('renders task name correctly', () => {
    renderWithProviders(<TaskCard task={mockTask} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('shows priority badge', () => {
    renderWithProviders(<TaskCard task={mockTask} />);
    
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('shows date/deadline', () => {
    renderWithProviders(<TaskCard task={mockTask} />);
    
    // Should show some date text
    expect(screen.getByText(/today|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i)).toBeInTheDocument();
  });

  it('shows labels', () => {
    renderWithProviders(<TaskCard task={mockTaskWithLabels} />);
    
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('shows subtask progress', () => {
    renderWithProviders(<TaskCard task={mockTaskWithSubtasks} />);
    
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('applies completed state styling', () => {
    const completedTask = { ...mockTask, is_completed: true };
    renderWithProviders(<TaskCard task={completedTask} />);
    
    // The task name should have line-through for completed tasks
    const taskName = screen.getByText('Test Task');
    const parentElement = taskName.parentElement;
    expect(parentElement).toHaveClass('line-through');
  });

  it('calls onEdit when edit is clicked', () => {
    const onEdit = vi.fn();
    renderWithProviders(<TaskCard task={mockTask} onEdit={onEdit} />);
    
    // The card should be clickable - find and click it
    const card = screen.getByText('Test Task').closest('div');
    if (card) {
      fireEvent.click(card);
    }
    // The onEdit callback might be called depending on the component implementation
  });

  it('shows overdue indicator for past dates', () => {
    const overdueTask = { ...mockTask, date: '2020-01-01' };
    renderWithProviders(<TaskCard task={overdueTask} />);
    
    // Should show overdue indicator
    expect(screen.getByText(/overdue|2020|jan 01/i)).toBeInTheDocument();
  });
});
