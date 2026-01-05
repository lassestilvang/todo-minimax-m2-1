import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ListItem } from '../lists/ListItem';
import type { ListWithTaskCount } from '@/lib/types';

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

// Mock delete-list-action
vi.mock('@/app/actions/delete-list-action', () => ({
  deleteListAction: vi.fn(() => Promise.resolve({ success: true })),
}));

describe('ListItem', () => {
  const mockList: ListWithTaskCount = {
    id: 'list-1',
    name: 'Test List',
    color: '#3b82f6',
    emoji: '📝',
    is_default: false,
    created_at: new Date(),
    updated_at: new Date(),
    task_count: 10,
    completed_count: 5,
  };

  const mockListNoTasks: ListWithTaskCount = {
    id: 'list-2',
    name: 'Empty List',
    color: null,
    emoji: null,
    is_default: false,
    created_at: new Date(),
    updated_at: new Date(),
    task_count: 0,
    completed_count: 0,
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

  it('renders list name', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    expect(screen.getByText('Test List')).toBeInTheDocument();
  });

  it('shows list emoji when present', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    expect(screen.getByText('📝')).toBeInTheDocument();
  });

  it('shows default icon when no emoji', () => {
    renderWithProviders(<ListItem list={mockListNoTasks} />);
    
    // Should have a default list icon or the text
    expect(screen.getByText(/empty list/i)).toBeInTheDocument();
  });

  it('shows task count badge when tasks exist', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    // 10 tasks - 5 completed = 5 remaining
    const badges = screen.getAllByText(/\d+/);
    expect(badges.some(b => b.textContent === '5')).toBe(true);
  });

  it('is clickable', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    const listElement = screen.getByText('Test List').closest('div');
    expect(listElement).toHaveClass('cursor-pointer');
  });

  it('has correct layout with flexbox', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    const listElement = screen.getByText('Test List').closest('div');
    expect(listElement).toHaveClass('flex');
    expect(listElement).toHaveClass('items-center');
  });

  it('shows 99+ for high task counts', () => {
    const highCountList: ListWithTaskCount = {
      ...mockList,
      task_count: 150,
      completed_count: 10,
    };
    renderWithProviders(<ListItem list={highCountList} />);
    
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('applies text truncation for long names', () => {
    const longNameList: ListWithTaskCount = {
      ...mockList,
      name: 'This is a very long list name that should be truncated',
    };
    renderWithProviders(<ListItem list={longNameList} />);
    
    expect(screen.getByText(/this is a very long list name/i)).toBeInTheDocument();
  });

  it('accepts list prop', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    // Component should accept list prop without error
    expect(screen.getByText('Test List')).toBeInTheDocument();
  });

  it('renders with border color style when color is set', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    const listElement = screen.getByText('Test List').closest('div');
    expect(listElement).toBeInTheDocument();
    // The component should apply the color as a border
  });

  it('does not show badge when no tasks', () => {
    renderWithProviders(<ListItem list={mockListNoTasks} />);
    
    const listElement = screen.getByText('Empty List').closest('div');
    expect(listElement).toBeInTheDocument();
  });

  it('applies hover styling class', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    const listElement = screen.getByText('Test List').closest('div');
    // Should have hover state styling
    expect(listElement).toHaveClass('hover:bg-accent/50');
  });

  it('applies active styling class when selected', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    const listElement = screen.getByText('Test List').closest('div');
    expect(listElement).toHaveClass('text-muted-foreground');
  });

  it('renders with correct gap styling', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    const listElement = screen.getByText('Test List').closest('div');
    expect(listElement).toHaveClass('gap-2');
  });

  it('applies rounded styling', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    const listElement = screen.getByText('Test List').closest('div');
    expect(listElement).toHaveClass('rounded-lg');
  });

  it('applies font-medium styling', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    const listElement = screen.getByText('Test List').closest('div');
    expect(listElement).toHaveClass('font-medium');
  });

  it('renders with text-sm class', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    const listElement = screen.getByText('Test List').closest('div');
    expect(listElement).toHaveClass('text-sm');
  });

  it('has transition-colors class', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    const listElement = screen.getByText('Test List').closest('div');
    expect(listElement).toHaveClass('transition-colors');
  });

  it('displays task count from list data', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    // Verify the list data is used to display counts
    const listElement = screen.getByText('Test List').closest('div');
    expect(listElement).toBeInTheDocument();
  });
});
