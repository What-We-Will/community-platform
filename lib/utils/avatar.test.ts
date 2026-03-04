import { getAvatarColor, getInitials } from './avatar';

describe('getAvatarColor', () => {
  it('returns a deterministic color for the same name', () => {
    const first = getAvatarColor('Alice Doe');
    const second = getAvatarColor('Alice Doe');
    expect(first).toBe(second);
  });

  it('returns different colors for different names (likely)', () => {
    const alice = getAvatarColor('Alice Doe');
    const bob = getAvatarColor('Bob Smith');
    expect(alice).not.toBe(bob);
  });
});

describe('getInitials', () => {
  it('returns initials for first and last name', () => {
    expect(getInitials('Alice Doe')).toBe('AD');
  });

  it('handles single-word names', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('limits to two characters', () => {
    expect(getInitials('Alice Bob Carol')).toBe('AB');
  });
});

