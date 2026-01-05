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

// Set up Next.js navigation and themes mocks BEFORE any component imports
// This must be done before components that use these hooks are imported
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

const mockPathname = '/';
const mockSearchParams = new URLSearchParams();
const mockParams = {};

vi.stubGlobal('useRouter', () => mockRouter);
vi.stubGlobal('usePathname', () => mockPathname);
vi.stubGlobal('useSearchParams', () => mockSearchParams);
vi.stubGlobal('useParams', () => mockParams);

vi.stubGlobal('useTheme', () => ({
  theme: 'light',
  setTheme: vi.fn(),
  resolvedTheme: 'light',
  forcedTheme: undefined,
}));
