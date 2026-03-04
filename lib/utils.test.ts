import { cn } from './utils';

describe('cn', () => {
  it('merges class names and filters falsy values', () => {
    expect(cn('a', undefined, null, false && 'b', 'c')).toBe('a c');
  });

  it('merges Tailwind classes with conflict resolution', () => {
    // Tailwind-merge should keep the last conflicting class
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});

