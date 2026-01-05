export const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
] as const;

export const DEFAULT_ICONS = [
  'home',
  'work',
  'shopping',
  'health',
  'finance',
  'learning',
  'travel',
  'personal',
] as const;

export const PRIORITIES = ['low', 'medium', 'high'] as const;

export const DB_PATH = process.env.DATABASE_PATH || './data.db';
