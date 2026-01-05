"use client";

import * as React from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import type { Mock } from "bun:test";

// Define mock objects
export const mockUseRouter = {
  push: (() => {}) as Mock<(...args: unknown[]) => void>,
  replace: (() => {}) as Mock<(...args: unknown[]) => void>,
  prefetch: (() => {}) as Mock<(...args: unknown[]) => void>,
  back: (() => {}) as Mock<(...args: unknown[]) => void>,
  forward: (() => {}) as Mock<(...args: unknown[]) => void>,
  refresh: (() => {}) as Mock<(...args: unknown[]) => void>,
};

export const mockUsePathname = (() => "/") as unknown as Mock<() => string>;
export const mockUseSearchParams = (() => new URLSearchParams()) as unknown as Mock<() => URLSearchParams>;
export const mockUseParams = (() => ({})) as unknown as Mock<() => Record<string, string>>;

export const mockUseTheme = (() => ({
  theme: "light",
  setTheme: (() => {}) as Mock<(theme: string) => void>,
  resolvedTheme: "light",
  forcedTheme: undefined,
  mount: (() => {}) as Mock<() => void>,
  unmount: (() => {}) as Mock<() => void>,
})) as unknown as Mock<() => {
  theme: string;
  setTheme: Mock<(theme: string) => void>;
  resolvedTheme: string;
  forcedTheme?: string;
  mount: Mock<() => void>;
  unmount: Mock<() => void>;
}>;

// Reset all mocks
export function resetMocks() {
  Object.keys(mockUseRouter).forEach((key) => {
    const k = key as keyof typeof mockUseRouter;
    if (typeof mockUseRouter[k] === "function") {
      mockUseRouter[k].mockClear();
    }
  });
  mockUsePathname.mockClear();
  mockUseSearchParams.mockClear();
  mockUseParams.mockClear();
}

// Test provider component
export function NextTestProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </ThemeProvider>
  );
}

// Helper function to wrap component with provider
export function withProviders(component: React.ReactNode) {
  return <NextTestProvider>{component}</NextTestProvider>;
}

// Custom render function that includes the provider
import { render as testingLibraryRender, type RenderOptions } from "@testing-library/react";

export function render(ui: React.ReactElement, options?: RenderOptions) {
  return testingLibraryRender(
    <NextTestProvider>{ui}</NextTestProvider>,
    options
  );
}
