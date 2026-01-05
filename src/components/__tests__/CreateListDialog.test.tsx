import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CreateListDialog } from '../lists/CreateListDialog';

// Import mocks and setup
import '@/lib/__tests__/jsdom-setup';
import { resetMocks, mockRouter } from '@/lib/__tests__/next-mocks';
import { NextTestProvider } from '@/lib/__tests__/next-test-provider';

describe('CreateListDialog', () => {
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

  it('opens dialog when trigger is clicked', () => {
    renderWithProviders(<CreateListDialog />);
    
    // Click the trigger button to open the dialog
    const triggerButton = screen.getByRole('button', { name: /add/i }) || screen.getByRole('button');
    fireEvent.click(triggerButton);
    
    // Dialog should now be open and show the title
    expect(screen.getByText(/create new list/i)).toBeInTheDocument();
  });

  it('shows validation error when name is empty', () => {
    renderWithProviders(<CreateListDialog />);
    
    // Click the trigger button to open the dialog
    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);
    
    // Try to submit without name
    const createButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(createButton);
    
    // Should show validation error
    expect(screen.getByText(/name is required|list name is required/i)).toBeInTheDocument();
  });

  it('accepts valid list name', () => {
    renderWithProviders(<CreateListDialog />);
    
    // Click the trigger button to open the dialog
    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);
    
    // Fill in list name
    const nameInput = screen.getByLabelText(/name/i) || screen.getByPlaceholderText(/e\.g\./i);
    fireEvent.change(nameInput, { target: { value: 'My New List' } });
    
    // Click create button
    const createButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(createButton);
    
    // Should have called router.refresh()
    expect(mockRouter.refresh).toHaveBeenCalled();
  });

  it('has color picker', () => {
    renderWithProviders(<CreateListDialog />);
    
    // Click the trigger button to open the dialog
    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);
    
    // Color picker should be present
    const colorPicker = screen.getByTestId('color-picker') || screen.getByRole('button', { name: /color/i });
    expect(colorPicker).toBeInTheDocument();
  });

  it('has emoji picker', () => {
    renderWithProviders(<CreateListDialog />);
    
    // Click the trigger button to open the dialog
    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);
    
    // Emoji picker should be present
    const emojiPicker = screen.getByTestId('emoji-picker') || screen.getByRole('button', { name: /emoji/i });
    expect(emojiPicker).toBeInTheDocument();
  });

  it('closes on cancel', () => {
    renderWithProviders(<CreateListDialog />);
    
    // Click the trigger button to open the dialog
    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);
    
    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    // Dialog title should no longer be visible
    expect(screen.queryByText(/create new list/i)).not.toBeInTheDocument();
  });

  it('shows dialog title when open', () => {
    renderWithProviders(<CreateListDialog />);
    
    // Click the trigger button to open the dialog
    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);
    
    expect(screen.getByText(/create new list/i)).toBeInTheDocument();
  });
});
