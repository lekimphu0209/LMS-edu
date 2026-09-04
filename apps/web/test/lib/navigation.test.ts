import { describe, it, expect } from 'vitest';

// Simple test for role-based navigation filtering logic
const roleNavItems: Record<string, { label: string; path: string }[]> = {
  ADMIN: [
    { label: 'Tổng quan', path: '/dashboard' },
    { label: 'Người dùng', path: '/users' },
  ],
  TEACHER: [
    { label: 'Tổng quan', path: '/dashboard' },
    { label: 'Bài tập', path: '/assignments' },
  ],
  STUDENT: [
    { label: 'Tổng quan', path: '/dashboard' },
    { label: 'Bài nộp', path: '/submissions' },
  ],
};

const getNavItemsForRole = (role: string) => roleNavItems[role] ?? [];

describe('role navigation', () => {
  it('returns admin nav items', () => {
    const items = getNavItemsForRole('ADMIN');
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.path)).toContain('/users');
  });

  it('returns student nav items', () => {
    const items = getNavItemsForRole('STUDENT');
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.path)).toContain('/submissions');
  });

  it('returns empty for unknown role', () => {
    expect(getNavItemsForRole('UNKNOWN')).toEqual([]);
  });
});
