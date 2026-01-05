// Mocks for Next.js modules - must be imported before components
// These mocks are set up using vi.mock() which is available in bun:test

// Create mock router with vi.fn()
export const mockRouter = {
  push: vi.fn<(href: string) => void>(),
  replace: vi.fn<(href: string) => void>(),
  prefetch: vi.fn<(href: string) => void>(),
  back: vi.fn<() => void>(),
  forward: vi.fn<() => void>(),
  refresh: vi.fn<() => void>(),
};

export const mockUsePathname = vi.fn<() => string>(() => '/');
export const mockUseSearchParams = vi.fn<() => URLSearchParams>(() => new URLSearchParams());
export const mockUseParams = vi.fn<() => Record<string, string>>(() => ({}));

export const mockUseTheme = vi.fn<() => {
  theme: string;
  setTheme: (theme: string) => void;
  resolvedTheme: string;
  forcedTheme?: string;
}>(() => ({
  theme: 'light',
  setTheme: vi.fn<(theme: string) => void>(),
  resolvedTheme: 'light',
  forcedTheme: undefined,
}));

// Reset mocks helper - bun:test uses vi.fn().mockClear()
export function resetMocks() {
  Object.values(mockRouter).forEach((fn) => {
    if (typeof fn === 'function') {
      fn.mockClear();
    }
  });
  mockUsePathname.mockClear();
  mockUseSearchParams.mockClear();
  mockUseParams.mockClear();
}

// Set up module mocks for next/navigation
const mockNextNavigation = {
  useRouter: () => mockRouter,
  usePathname: () => mockUsePathname,
  useSearchParams: () => mockUseSearchParams,
  useParams: () => mockUseParams,
};

// Set up module mock for next-themes
const mockNextThemes = {
  useTheme: () => mockUseTheme,
};

// Register mocks
vi.mock('next/navigation', () => mockNextNavigation);
vi.mock('next-themes', () => mockNextThemes);

// Re-export for convenience
export { mockNextNavigation, mockNextThemes };
