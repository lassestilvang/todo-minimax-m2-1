import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateListDialog } from '../lists/CreateListDialog';

describe('CreateListDialog', () => {
  const mockOnSuccess = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('validates required name', () => {
    render(
      <CreateListDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    );
    
    // Try to submit without name
    const createButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(createButton);
    
    // Should show validation error or not call onSuccess
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('accepts valid list name', () => {
    render(
      <CreateListDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    );
    
    // Fill in list name
    const nameInput = screen.getByLabelText(/list name/i);
    fireEvent.change(nameInput, { target: { value: 'My New List' } });
    
    // Click create button
    const createButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(createButton);
    
    // Should call onSuccess with the list data
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('color picker works', () => {
    render(
      <CreateListDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    );
    
    // Color picker should be present
    const colorPicker = screen.getByLabelText(/color/i) || screen.getByTestId('color-picker');
    expect(colorPicker).toBeInTheDocument();
  });

  it('emoji picker works', () => {
    render(
      <CreateListDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    );
    
    // Emoji picker should be present
    const emojiPicker = screen.getByLabelText(/emoji/i) || screen.getByTestId('emoji-picker');
    expect(emojiPicker).toBeInTheDocument();
  });

  it('closes on cancel', () => {
    render(
      <CreateListDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    );
    
    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows dialog title', () => {
    render(
      <CreateListDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    );
    
    expect(screen.getByText(/create new list/i)).toBeInTheDocument();
  });
});
