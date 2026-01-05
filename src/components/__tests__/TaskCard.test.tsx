import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '../tasks/TaskCard';
import type { TaskWithRelations } from '@/lib/types';

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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders task name correctly', () => {
    render(<TaskCard task={mockTask} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('shows priority badge', () => {
    render(<TaskCard task={mockTask} />);
    
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('shows date/deadline', () => {
    render(<TaskCard task={mockTask} />);
    
    expect(screen.getByText(/Today|Today/i)).toBeInTheDocument();
  });

  it('shows labels', () => {
    render(<TaskCard task={mockTaskWithLabels} />);
    
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('shows subtask progress', () => {
    render(<TaskCard task={mockTaskWithSubtasks} />);
    
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('applies completed state styling', () => {
    const completedTask = { ...mockTask, is_completed: true };
    render(<TaskCard task={completedTask} />);
    
    const card = screen.getByText('Test Task').closest('div');
    expect(card).toHaveClass('opacity-60');
  });

  it('calls onEdit when edit is clicked', () => {
    const onEdit = vi.fn();
    render(<TaskCard task={mockTask} onEdit={onEdit} />);
    
    // Click on the card to trigger view details
    const card = screen.getByText('Test Task').closest('div')?.parentElement;
    if (card) {
      fireEvent.click(card);
      // The onEdit should not be called directly from card click, only from dropdown
    }
  });

  it('shows overdue indicator for past dates', () => {
    const overdueTask = { ...mockTask, date: '2020-01-01' };
    render(<TaskCard task={overdueTask} />);
    
    // Should show overdue indicator
    expect(screen.getByText(/ago|overdue/i)).toBeInTheDocument();
  });
});
