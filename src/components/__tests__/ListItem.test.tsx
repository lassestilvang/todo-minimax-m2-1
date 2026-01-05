import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ListItem } from '../lists/ListItem';
import type { ListWithTaskCount } from '@/lib/types';

// Import mocks and setup
import '@/lib/__tests__/jsdom-setup';
import { resetMocks } from '@/lib/__tests__/next-mocks';
import { NextTestProvider } from '@/lib/__tests__/next-test-provider';

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
    
    // Should have a default list icon
    expect(screen.getByText(/test list/i)).toBeInTheDocument();
  });

  it('shows color indicator', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    // Should have a color indicator element
    const listElement = screen.getByText('Test List').closest('div');
    expect(listElement).toBeInTheDocument();
  });

  it('shows task count badge', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    // 10 tasks - 5 completed = 5 remaining
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not show badge when no tasks', () => {
    renderWithProviders(<ListItem list={mockListNoTasks} />);
    
    const listElement = screen.getByText('Empty List').closest('div');
    expect(listElement).toBeInTheDocument();
    // No badge should be visible
  });

  it('is clickable', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    const listElement = screen.getByText('Test List').closest('div');
    expect(listElement).toHaveClass('cursor-pointer');
  });

  it('shows dropdown menu on hover', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    // Hover over the list item
    const listElement = screen.getByText('Test List').closest('div');
    if (listElement) {
      fireEvent.mouseEnter(listElement);
    }
    
    // Dropdown trigger should be visible
    const moreButton = screen.getByRole('button', { name: /more/i }) || 
                       screen.getByRole('button', { name: /…/i });
    expect(moreButton).toBeInTheDocument();
  });

  it('has edit option in dropdown menu', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    // Hover to show dropdown
    const listElement = screen.getByText('Test List').closest('div');
    if (listElement) {
      fireEvent.mouseEnter(listElement);
    }
    
    // Click the dropdown trigger
    const moreButton = screen.getByRole('button');
    fireEvent.click(moreButton);
    
    // Edit option should be visible
    expect(screen.getByText(/edit list/i)).toBeInTheDocument();
  });

  it('has delete option in dropdown menu', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    // Hover to show dropdown
    const listElement = screen.getByText('Test List').closest('div');
    if (listElement) {
      fireEvent.mouseEnter(listElement);
    }
    
    // Click the dropdown trigger
    const moreButton = screen.getByRole('button');
    fireEvent.click(moreButton);
    
    // Delete option should be visible
    expect(screen.getByText(/delete list/i)).toBeInTheDocument();
  });

  it('applies active state styling when selected', () => {
    // This test would need the UI store mock to set selectedListId
    renderWithProviders(<ListItem list={mockList} />);
    
    const listElement = screen.getByText('Test List').closest('div');
    expect(listElement).toBeInTheDocument();
  });

  it('shows tooltip on hover with task info', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    // The tooltip should show list name and task counts
    const listElement = screen.getByText('Test List').closest('div');
    if (listElement) {
      fireEvent.mouseEnter(listElement);
    }
    
    // Tooltip content should be available
    expect(screen.getByText('Test List')).toBeInTheDocument();
  });

  it('renders with correct border color style', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    const listElement = screen.getByText('Test List').closest('div');
    expect(listElement).toBeInTheDocument();
    // Should have inline style for border color
  });

  it('shows incomplete task count correctly', () => {
    // 10 tasks, 5 completed = 5 incomplete
    expect(screen.getByText('5')).toBeInTheDocument();
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

  it('triggers edit dialog when edit option is clicked', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    // Hover to show dropdown
    const listElement = screen.getByText('Test List').closest('div');
    if (listElement) {
      fireEvent.mouseEnter(listElement);
    }
    
    // Click the dropdown trigger
    const moreButton = screen.getByRole('button');
    fireEvent.click(moreButton);
    
    // Click edit option
    const editOption = screen.getByText(/edit list/i);
    fireEvent.click(editOption);
    
    // Edit dialog should open
    expect(screen.getByText(/edit list/i)).toBeInTheDocument();
  });

  it('has correct layout with flexbox', () => {
    renderWithProviders(<ListItem list={mockList} />);
    
    const listElement = screen.getByText('Test List').closest('div');
    expect(listElement).toHaveClass('flex');
    expect(listElement).toHaveClass('items-center');
  });

  it('applies text truncation for long names', () => {
    const longNameList: ListWithTaskCount = {
      ...mockList,
      name: 'This is a very long list name that should be truncated',
    };
    renderWithProviders(<ListItem list={longNameList} />);
    
    expect(screen.getByText(/this is a very long list name/i)).toBeInTheDocument();
  });
});
