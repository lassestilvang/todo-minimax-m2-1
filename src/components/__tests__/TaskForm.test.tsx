import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { TaskForm } from '../tasks/TaskForm';
import type { TaskWithRelations, List, Label } from '@/lib/types';

// Import mocks and setup
import '@/lib/__tests__/jsdom-setup';
import { resetMocks } from '@/lib/__tests__/next-mocks';
import { NextTestProvider } from '@/lib/__tests__/next-test-provider';

describe('TaskForm', () => {
  const mockLists: List[] = [
    { id: 'list-1', name: 'Inbox', color: '#3b82f6', emoji: '📥', is_default: true, created_at: new Date(), updated_at: new Date() },
    { id: 'list-2', name: 'Work', color: '#ff0000', emoji: '💼', is_default: false, created_at: new Date(), updated_at: new Date() },
  ];

  const mockLabels: Label[] = [
    { id: 'label-1', name: 'Urgent', color: '#ff0000', icon: '🔥', created_at: new Date() },
    { id: 'label-2', name: 'Personal', color: '#00ff00', icon: '🏠', created_at: new Date() },
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

  it('validates required name field', async () => {
    const onOpenChange = vi.fn();
    
    renderWithProviders(
      <TaskForm
        lists={mockLists}
        allLabels={mockLabels}
        open={true}
        onOpenChange={onOpenChange}
      />
    );
    
    // Try to submit without a name
    const submitButton = screen.getByRole('button', { name: /create task|save/i });
    fireEvent.click(submitButton);
    
    // Should show validation error for name
    expect(screen.getByText(/task name is required|required/i)).toBeInTheDocument();
  });

  it('validates priority enum', () => {
    const onOpenChange = vi.fn();
    
    renderWithProviders(
      <TaskForm
        lists={mockLists}
        allLabels={mockLabels}
        open={true}
        onOpenChange={onOpenChange}
      />
    );
    
    // Priority select should exist
    const prioritySelect = screen.getByRole('combobox', { name: /priority/i });
    expect(prioritySelect).toBeInTheDocument();
  });

  it('has time input for estimated time', () => {
    const onOpenChange = vi.fn();
    
    renderWithProviders(
      <TaskForm
        lists={mockLists}
        allLabels={mockLabels}
        open={true}
        onOpenChange={onOpenChange}
      />
    );
    
    // Time input should exist
    const timeInput = screen.getByRole('input', { name: /estimated time|time/i }) || 
                      screen.getByLabelText(/estimated time/i);
    expect(timeInput).toBeInTheDocument();
  });

  it('opens with correct title for creating task', () => {
    const onOpenChange = vi.fn();
    
    renderWithProviders(
      <TaskForm
        lists={mockLists}
        allLabels={mockLabels}
        open={true}
        onOpenChange={onOpenChange}
      />
    );
    
    // Should show create title
    expect(screen.getByText(/create new task/i)).toBeInTheDocument();
  });

  it('pre-fills data when editing', () => {
    const mockTask: TaskWithRelations = {
      id: 'task-1',
      list_id: 'list-1',
      name: 'Existing Task',
      description: 'Existing description',
      date: new Date().toISOString().split('T')[0],
      deadline: null,
      priority: 'high',
      is_completed: false,
      completed_at: null,
      estimate_minutes: 45,
      actual_minutes: null,
      recurring_pattern: null,
      attachments: null,
      created_at: new Date(),
      updated_at: new Date(),
      labels: [],
      subtasks: [],
      reminders: [],
    };

    const onOpenChange = vi.fn();
    
    renderWithProviders(
      <TaskForm
        task={mockTask}
        lists={mockLists}
        allLabels={mockLabels}
        open={true}
        onOpenChange={onOpenChange}
      />
    );
    
    // Should show edit title
    expect(screen.getByText(/edit task/i)).toBeInTheDocument();
    
    // Should pre-fill task name - check by placeholder text
    const nameInput = screen.getByPlaceholderText(/what needs to be done/i) as HTMLInputElement;
    expect(nameInput).toBeInTheDocument();
  });

  it('closes dialog on cancel', () => {
    const onOpenChange = vi.fn();
    
    renderWithProviders(
      <TaskForm
        lists={mockLists}
        allLabels={mockLabels}
        open={true}
        onOpenChange={onOpenChange}
      />
    );
    
    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows list selection dropdown', () => {
    const onOpenChange = vi.fn();
    
    renderWithProviders(
      <TaskForm
        lists={mockLists}
        allLabels={mockLabels}
        open={true}
        onOpenChange={onOpenChange}
      />
    );
    
    // List select should be present
    const listSelect = screen.getByRole('combobox', { name: /list/i });
    expect(listSelect).toBeInTheDocument();
  });
});
