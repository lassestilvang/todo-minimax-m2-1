import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { EditListDialog } from '../lists/EditListDialog';
import type { List } from '@/lib/types';

// Import mocks and setup
import '@/lib/__tests__/jsdom-setup';
import { resetMocks } from '@/lib/__tests__/next-mocks';
import { NextTestProvider } from '@/lib/__tests__/next-test-provider';

describe('EditListDialog', () => {
  const mockList: List = {
    id: 'list-1',
    name: 'Test List',
    color: '#3b82f6',
    emoji: '📝',
    is_default: false,
    created_at: new Date(),
    updated_at: new Date(),
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

  it('renders with trigger button', () => {
    renderWithProviders(<EditListDialog list={mockList} />);
    
    // Should have a trigger button (pencil icon)
    const triggerButton = screen.getByRole('button');
    expect(triggerButton).toBeInTheDocument();
  });

  it('opens dialog when trigger is clicked', () => {
    renderWithProviders(<EditListDialog list={mockList} />);
    
    // Click the trigger button
    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);
    
    // Dialog should now be open
    expect(screen.getByText(/edit list/i)).toBeInTheDocument();
    expect(screen.getByText(/make changes to your list here/i)).toBeInTheDocument();
  });

  it('pre-fills existing list data', () => {
    renderWithProviders(<EditListDialog list={mockList} />);
    
    // Click the trigger button to open the dialog
    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);
    
    // Name input should be pre-filled with existing list name
    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    expect(nameInput).toBeInTheDocument();
    expect(nameInput.value).toBe('Test List');
  });

  it('shows existing emoji', () => {
    renderWithProviders(<EditListDialog list={mockList} />);
    
    // Click the trigger button
    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);
    
    // Emoji picker should show the existing emoji
    const emojiPicker = screen.getByTestId('emoji-picker') || screen.getByRole('button', { name: /emoji/i });
    expect(emojiPicker).toBeInTheDocument();
  });

  it('shows existing color', () => {
    renderWithProviders(<EditListDialog list={mockList} />);
    
    // Click the trigger button
    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);
    
    // Color picker should be present
    const colorPicker = screen.getByTestId('color-picker') || screen.getByRole('button', { name: /color/i });
    expect(colorPicker).toBeInTheDocument();
  });

  it('validates empty name on submit', () => {
    renderWithProviders(<EditListDialog list={mockList} />);
    
    // Click the trigger button to open the dialog
    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);
    
    // Clear the name input
    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: '' } });
    
    // Click save button
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    
    // Should show validation error
    expect(screen.getByText(/list name is required/i)).toBeInTheDocument();
  });

  it('closes on cancel button click', () => {
    renderWithProviders(<EditListDialog list={mockList} />);
    
    // Click the trigger button to open the dialog
    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);
    
    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    // Dialog should be closed
    expect(screen.queryByText(/edit list/i)).not.toBeInTheDocument();
  });

  it('has delete button', () => {
    renderWithProviders(<EditListDialog list={mockList} />);
    
    // Click the trigger button to open the dialog
    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);
    
    // Delete button should be present
    const deleteButton = screen.getByRole('button', { name: /delete list/i });
    expect(deleteButton).toBeInTheDocument();
  });

  it('shows confirmation on first delete click', () => {
    renderWithProviders(<EditListDialog list={mockList} />);
    
    // Click the trigger button to open the dialog
    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);
    
    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete list/i });
    fireEvent.click(deleteButton);
    
    // Should show confirmation
    expect(screen.getByRole('button', { name: /confirm delete/i })).toBeInTheDocument();
  });

  it('allows updating list name', () => {
    renderWithProviders(<EditListDialog list={mockList} />);
    
    // Click the trigger button to open the dialog
    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);
    
    // Change the name
    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Updated List Name' } });
    
    expect(nameInput.value).toBe('Updated List Name');
  });

  it('allows updating list color', () => {
    renderWithProviders(<EditListDialog list={mockList} />);
    
    // Click the trigger button to open the dialog
    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);
    
    // Color picker should be present and interactive
    const colorPicker = screen.getByTestId('color-picker');
    expect(colorPicker).toBeInTheDocument();
  });

  it('allows updating list emoji', () => {
    renderWithProviders(<EditListDialog list={mockList} />);
    
    // Click the trigger button to open the dialog
    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);
    
    // Emoji picker should be present and interactive
    const emojiPicker = screen.getByTestId('emoji-picker');
    expect(emojiPicker).toBeInTheDocument();
  });

  it('shows save changes button', () => {
    renderWithProviders(<EditListDialog list={mockList} />);
    
    // Click the trigger button to open the dialog
    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);
    
    // Save button should be present
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeInTheDocument();
  });

  it('renders custom trigger children when provided', () => {
    renderWithProviders(
      <EditListDialog list={mockList}>
        <button>Custom Trigger</button>
      </EditListDialog>
    );
    
    // Custom trigger should be rendered
    expect(screen.getByRole('button', { name: /custom trigger/i })).toBeInTheDocument();
  });

  it('resets form when dialog is closed without saving', () => {
    renderWithProviders(<EditListDialog list={mockList} />);
    
    // Click the trigger button to open the dialog
    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);
    
    // Change the name
    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Temporary Change' } });
    
    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    // Re-open the dialog
    const newTriggerButton = screen.getByRole('button');
    fireEvent.click(newTriggerButton);
    
    // Name should be reset to original value
    const resetNameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    expect(resetNameInput.value).toBe('Test List');
  });
});
