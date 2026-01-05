import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { EditListDialog } from '../lists/EditListDialog';
import type { List } from '@/lib/types';

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

// Mock the update-list-action
vi.mock('@/app/actions/update-list-action', () => ({
  updateListAction: vi.fn(() => Promise.resolve({ success: true })),
}));

// Mock the delete-list-action
vi.mock('@/app/actions/delete-list-action', () => ({
  deleteListAction: vi.fn(() => Promise.resolve({ success: true })),
}));

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

  it('has correct trigger button icon', () => {
    renderWithProviders(<EditListDialog list={mockList} />);
    
    const triggerButton = screen.getByRole('button');
    expect(triggerButton).toBeInTheDocument();
    // Button should have an icon
    expect(triggerButton.innerHTML).toContain('svg');
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

  it('accepts triggerClassName prop', () => {
    renderWithProviders(
      <EditListDialog list={mockList} triggerClassName="custom-class" />
    );
    
    const triggerButton = screen.getByRole('button');
    expect(triggerButton).toHaveClass('custom-class');
  });

  it('applies default styling to trigger button', () => {
    renderWithProviders(<EditListDialog list={mockList} />);
    
    const triggerButton = screen.getByRole('button');
    expect(triggerButton).toHaveClass('h-8');
    expect(triggerButton).toHaveClass('w-8');
  });
});
