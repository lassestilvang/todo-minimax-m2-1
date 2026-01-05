// Mocks for Next.js modules - must be imported before components
import type { Mock } from 'bun:test';

// Mock router object
export const mockRouter = {
  push: (() => {}) as Mock<(href: string) => void>,
  replace: (() => {}) as Mock<(href: string) => void>,
  prefetch: (() => {}) as Mock<(href: string) => void>,
  back: (() => {}) as Mock<() => void>,
  forward: (() => {}) as Mock<() => void>,
  refresh: (() => {}) as Mock<() => void>,
};

export const mockUsePathname = (() => '/') as Mock<() => string>;
export const mockUseSearchParams = (() => new URLSearchParams()) as Mock<() => URLSearchParams>;
export const mockUseParams = (() => ({})) as Mock<() => Record<string, string>>;

export const mockUseTheme = (() => ({
  theme: 'light',
  setTheme: (() => {}) as Mock<(theme: string) => void>,
  resolvedTheme: 'light',
  forcedTheme: undefined,
})) as Mock<() => {
  theme: string;
  setTheme: Mock<(theme: string) => void>;
  resolvedTheme: string;
  forcedTheme?: string;
}>;

// Reset mocks helper
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
