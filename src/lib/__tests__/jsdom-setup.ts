// JSDOM setup for Bun tests
import { JSDOM } from 'jsdom';
import '@testing-library/jest-dom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  runScripts: 'dangerously',
});

// Set up global objects
global.document = dom.window.document;
global.window = dom.window as unknown as Window & typeof globalThis;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLDivElement = dom.window.HTMLDivElement;
global.HTMLButtonElement = dom.window.HTMLButtonElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.DocumentFragment = dom.window.DocumentFragment;
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Add getComputedStyle
(global as unknown as { getComputedStyle: typeof window.getComputedStyle }).getComputedStyle = (
  element: Element
) => dom.window.getComputedStyle(element);

// Mock localStorage
const localStorageMock = {
  data: {},
  getItem(key: string) {
    return this.data[key] || null;
  },
  setItem(key: string, value: string) {
    this.data[key] = String(value);
  },
  removeItem(key: string) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  },
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock window.matchMedia (needed by next-themes and some UI libraries)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock fetch for API calls in test environment
// This returns mock data for common API endpoints
vi.mock('node:fetch', () => ({
  default: vi.fn((url: string) => {
    // Return mock response for tasks API
    if (url.includes('/api/tasks')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          tasks: [],
          lists: [],
        }),
      });
    }
    
    // Return mock response for overdue count
    if (url.includes('/overdue-count')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ count: 0 }),
      });
    }
    
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    });
  }),
}));

// Also mock global.fetch
global.fetch = vi.fn((url: string) => {
  // Return mock response for tasks API
  if (url.includes('/api/tasks')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        tasks: [],
        lists: [],
      }),
    });
  }
  
  // Return mock response for overdue count
  if (url.includes('/overdue-count')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ count: 0 }),
    });
  }
  
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
});
