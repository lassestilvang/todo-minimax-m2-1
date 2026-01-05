import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { TaskForm } from '../tasks/TaskForm';
import type { TaskWithRelations, List, Label } from '@/lib/types';

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
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('validates required name field', async () => {
    const onOpenChange = vi.fn();
    
    render(
      <TaskForm
        lists={mockLists}
        allLabels={mockLabels}
        open={true}
        onOpenChange={onOpenChange}
      />
    );
    
    // Try to submit without a name
    const submitButton = screen.getByRole('button', { name: /create task/i });
    fireEvent.click(submitButton);
    
    // Should show validation error
    expect(screen.getByText(/task name is required/i)).toBeInTheDocument();
  });

  it('validates priority enum', () => {
    const onOpenChange = vi.fn();
    
    render(
      <TaskForm
        lists={mockLists}
        allLabels={mockLabels}
        open={true}
        onOpenChange={onOpenChange}
      />
    );
    
    // Select priority dropdown should exist
    const prioritySelect = screen.getByLabelText(/priority/i);
    expect(prioritySelect).toBeInTheDocument();
  });

  it('validates time format', () => {
    const onOpenChange = vi.fn();
    
    render(
      <TaskForm
        lists={mockLists}
        allLabels={mockLabels}
        open={true}
        onOpenChange={onOpenChange}
      />
    );
    
    // Time input should accept valid time format
    const timeInput = screen.getByLabelText(/estimated time/i);
    expect(timeInput).toBeInTheDocument();
  });

  it('submits with correct data', async () => {
    const onOpenChange = vi.fn();
    
    render(
      <TaskForm
        lists={mockLists}
        allLabels={mockLabels}
        open={true}
        onOpenChange={onOpenChange}
      />
    );
    
    // Fill in task name
    const nameInput = screen.getByLabelText(/task name/i);
    fireEvent.change(nameInput, { target: { value: 'New Test Task' } });
    
    // Select priority
    const prioritySelect = screen.getByLabelText(/priority/i);
    fireEvent.click(prioritySelect);
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /create task/i });
    fireEvent.click(submitButton);
    
    // Form should be submitted (onOpenChange should be called with false)
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
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
    
    render(
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
    
    // Should pre-fill task name
    const nameInput = screen.getByLabelText(/task name/i) as HTMLInputElement;
    expect(nameInput.value).toBe('Existing Task');
  });

  it('closes dialog on cancel', () => {
    const onOpenChange = vi.fn();
    
    render(
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
});
