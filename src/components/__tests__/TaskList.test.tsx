import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { TaskList } from '../tasks/TaskList';
import type { TaskWithRelations } from '@/lib/types';

// Import mocks and setup
import '@/lib/__tests__/jsdom-setup';
import { resetMocks } from '@/lib/__tests__/next-mocks';
import { NextTestProvider } from '@/lib/__tests__/next-test-provider';

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

  it('groups tasks by date', () => {
    renderWithProviders(
      <TaskList tasks={mockTasks} />
    );
    
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });

  it('shows empty state when no tasks', () => {
    renderWithProviders(
      <TaskList tasks={[]} />
    );
    
    expect(screen.getByText(/no tasks/i)).toBeInTheDocument();
  });

  it('hides completed tasks when toggle is off', () => {
    renderWithProviders(
      <TaskList tasks={mockTasks} />
    );
    
    // Completed task should not be visible initially
    expect(screen.queryByText('Completed Task')).not.toBeInTheDocument();
  });

  it('shows completed tasks when toggle is on', async () => {
    renderWithProviders(
      <TaskList tasks={mockTasks} showCompletedTasks={true} />
    );
    
    // Click the "Completed" toggle button
    const completedButton = await screen.findByRole('button', { name: /completed/i });
    fireEvent.click(completedButton);
    
    // Now completed task should be visible
    expect(screen.getByText('Completed Task')).toBeInTheDocument();
  });

  it('shows loading skeleton when isLoading is true', () => {
    renderWithProviders(
      <TaskList tasks={[]} isLoading={true} />
    );
    
    // Should show loading skeleton
    const skeleton = screen.getByTestId('loading-skeleton') || 
                     screen.getByRole('heading', { name: /loading/i }) ||
                     screen.getByText(/tasks/i).closest('div')?.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('shows task count in toolbar', () => {
    renderWithProviders(
      <TaskList tasks={[mockTasks[0]]} />
    );
    
    expect(screen.getByText(/1 task/i)).toBeInTheDocument();
  });

  it('has sort button', () => {
    renderWithProviders(
      <TaskList tasks={mockTasks} />
    );
    
    // Sort button should exist
    const sortButton = screen.getByRole('button', { name: /sort/i });
    expect(sortButton).toBeInTheDocument();
  });
});
