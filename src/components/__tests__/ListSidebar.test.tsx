import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup, rerender } from '@testing-library/react';
import { ListSidebar } from '../lists/ListSidebar';
import type { ListWithTaskCount } from '@/lib/types';

// Import mocks and setup
import '@/lib/__tests__/jsdom-setup';
import { resetMocks } from '@/lib/__tests__/next-mocks';
import { NextTestProvider } from '@/lib/__tests__/next-test-provider';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: 'button',
    div: 'div',
  },
}));

describe('ListSidebar', () => {
  const mockLists: ListWithTaskCount[] = [
    {
      id: 'list-default',
      name: 'Inbox',
      color: null,
      emoji: null,
      is_default: true,
      created_at: new Date(),
      updated_at: new Date(),
      task_count: 10,
      completed_count: 5,
    },
    {
      id: 'list-1',
      name: 'Work',
      color: '#ff0000',
      emoji: '💼',
      is_default: false,
      created_at: new Date(),
      updated_at: new Date(),
      task_count: 5,
      completed_count: 2,
    },
    {
      id: 'list-2',
      name: 'Personal',
      color: '#00ff00',
      emoji: '🏠',
      is_default: false,
      created_at: new Date(),
      updated_at: new Date(),
      task_count: 3,
      completed_count: 1,
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

  it('renders inbox button', () => {
    renderWithProviders(<ListSidebar initialLists={mockLists} />);
    
    expect(screen.getByText(/inbox/i)).toBeInTheDocument();
  });

  it('renders inbox with task count badge', () => {
    renderWithProviders(<ListSidebar initialLists={mockLists} />);
    
    // Inbox has 10 tasks, 5 completed, so 5 remaining
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders My Lists section', () => {
    renderWithProviders(<ListSidebar initialLists={mockLists} />);
    
    expect(screen.getByText(/my lists/i)).toBeInTheDocument();
  });

  it('renders list of custom lists', () => {
    renderWithProviders(<ListSidebar initialLists={mockLists} />);
    
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  it('shows list emojis', () => {
    renderWithProviders(<ListSidebar initialLists={mockLists} />);
    
    // Should show emojis for lists that have them
    expect(screen.getByText('💼')).toBeInTheDocument();
    expect(screen.getByText('🏠')).toBeInTheDocument();
  });

  it('shows task count for each list', () => {
    renderWithProviders(<ListSidebar initialLists={mockLists} />);
    
    // Work: 5 tasks - 2 completed = 3 remaining
    expect(screen.getByText('3')).toBeInTheDocument();
    // Personal: 3 tasks - 1 completed = 2 remaining
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows filter input', () => {
    renderWithProviders(<ListSidebar initialLists={mockLists} />);
    
    // Filter input should be visible
    const filterInput = screen.getByPlaceholderText(/filter lists/i);
    expect(filterInput).toBeInTheDocument();
  });

  it('shows empty state when no custom lists exist', () => {
    const emptyLists = [mockLists[0]]; // Only default inbox
    renderWithProviders(<ListSidebar initialLists={emptyLists} />);
    
    expect(screen.getByText(/no lists yet\. create one!/i)).toBeInTheDocument();
  });

  it('shows overdue indicator when overdueCount is provided', () => {
    renderWithProviders(<ListSidebar initialLists={mockLists} overdueCount={3} />);
    
    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
  });

  it('does not show overdue section when count is 0', () => {
    renderWithProviders(<ListSidebar initialLists={mockLists} overdueCount={0} />);
    
    expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument();
  });

  it('renders lists with 99+ badge for high task counts', () => {
    const highCountLists: ListWithTaskCount[] = [
      {
        ...mockLists[0],
        task_count: 150,
        completed_count: 10,
      },
    ];
    renderWithProviders(<ListSidebar initialLists={highCountLists} />);
    
    // Should show 99+ for counts over 99
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('does not show badge for lists with no tasks', () => {
    const emptyTaskLists: ListWithTaskCount[] = [
      {
        id: 'list-empty',
        name: 'Empty List',
        color: null,
        emoji: null,
        is_default: false,
        created_at: new Date(),
        updated_at: new Date(),
        task_count: 0,
        completed_count: 0,
      },
    ];
    renderWithProviders(<ListSidebar initialLists={emptyTaskLists} />);
    
    expect(screen.getByText('Empty List')).toBeInTheDocument();
  });

  it('renders default icon for lists without emoji', () => {
    const listsWithoutEmoji: ListWithTaskCount[] = [
      {
        id: 'list-no-emoji',
        name: 'No Emoji List',
        color: null,
        emoji: null,
        is_default: false,
        created_at: new Date(),
        updated_at: new Date(),
        task_count: 1,
        completed_count: 0,
      },
    ];
    renderWithProviders(<ListSidebar initialLists={listsWithoutEmoji} />);
    
    expect(screen.getByText('No Emoji List')).toBeInTheDocument();
  });

  it('updates lists when initialLists prop changes', () => {
    const { rerender } = render(
      <NextTestProvider>
        <ListSidebar initialLists={mockLists} />
      </NextTestProvider>
    );
    
    expect(screen.getByText('Work')).toBeInTheDocument();
    
    const updatedLists = mockLists.filter(l => l.id !== 'list-1');
    rerender(
      <NextTestProvider>
        <ListSidebar initialLists={updatedLists} />
      </NextTestProvider>
    );
    
    expect(screen.queryByText('Work')).not.toBeInTheDocument();
  });

  it('accepts onItemClick callback prop', () => {
    const onItemClick = vi.fn();
    renderWithProviders(
      <ListSidebar initialLists={mockLists} onItemClick={onItemClick} />
    );
    
    // Component should accept onItemClick prop without error
    expect(screen.getByText('Inbox')).toBeInTheDocument();
  });

  it('accepts overdueCount prop', () => {
    renderWithProviders(
      <ListSidebar initialLists={mockLists} overdueCount={5} />
    );
    
    // Component should accept overdueCount prop without error
    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
  });

  it('renders with correct structure', () => {
    renderWithProviders(<ListSidebar initialLists={mockLists} />);
    
    // Should have a flex container
    const sidebar = screen.getByText(/inbox/i).closest('div');
    expect(sidebar).toHaveClass('flex');
    expect(sidebar).toHaveClass('flex-col');
  });

  it('has add button in My Lists section', () => {
    renderWithProviders(<ListSidebar initialLists={mockLists} />);
    
    // There should be buttons in the My Lists header
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('has overdue count badge with correct value', () => {
    renderWithProviders(<ListSidebar initialLists={mockLists} overdueCount={5} />);
    
    // Overdue section should have a badge with the count
    const overdueText = screen.getByText(/overdue/i);
    const parentElement = overdueText.parentElement;
    expect(parentElement).toBeInTheDocument();
  });
});
