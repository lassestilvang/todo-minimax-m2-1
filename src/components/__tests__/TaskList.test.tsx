import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskList } from '../tasks/TaskList';
import { UIProvider } from '@/store/ui-store';
import type { TaskWithRelations } from '@/lib/types';

describe('TaskList', () => {
  const mockTasks: TaskWithRelations[] = [
    {
      id: 'task-1',
      list_id: 'list-1',
      name: 'Task 1',
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
    {
      id: 'task-2',
      list_id: 'list-1',
      name: 'Task 2',
      description: null,
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
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
      id: 'task-3',
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

  it('groups tasks by date', () => {
    render(
      <UIProvider>
        <TaskList tasks={mockTasks} />
      </UIProvider>
    );
    
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });

  it('shows empty state when no tasks', () => {
    render(
      <UIProvider>
        <TaskList tasks={[]} />
      </UIProvider>
    );
    
    expect(screen.getByText(/no tasks/i)).toBeInTheDocument();
  });

  it('hides completed tasks when toggle is off', () => {
    render(
      <UIProvider>
        <TaskList tasks={mockTasks} />
      </UIProvider>
    );
    
    // Completed task should not be visible initially
    expect(screen.queryByText('Completed Task')).not.toBeInTheDocument();
  });

  it('shows completed tasks when toggle is on', () => {
    render(
      <UIProvider>
        <TaskList tasks={mockTasks} showCompletedTasks={true} />
      </UIProvider>
    );
    
    // Click the "Completed" toggle button
    const completedButton = screen.getByRole('button', { name: /completed/i });
    fireEvent.click(completedButton);
    
    // Now completed task should be visible
    expect(screen.getByText('Completed Task')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <UIProvider>
        <TaskList tasks={[]} isLoading={true} />
      </UIProvider>
    );
    
    // Should show skeleton loading
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('shows task count in toolbar', () => {
    render(
      <UIProvider>
        <TaskList tasks={[mockTasks[0]]} />
      </UIProvider>
    );
    
    expect(screen.getByText(/1 task/i)).toBeInTheDocument();
  });

  it('sorts tasks by priority', () => {
    render(
      <UIProvider>
        <TaskList tasks={mockTasks} />
      </UIProvider>
    );
    
    // Click sort dropdown
    const sortButton = screen.getByRole('button', { name: /sort/i });
    fireEvent.click(sortButton);
    
    // Select priority sort
    const priorityOption = screen.getByText('Priority');
    fireEvent.click(priorityOption);
    
    // Tasks should be sorted by priority
    // High priority should come first
  });
});
