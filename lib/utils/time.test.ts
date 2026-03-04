import { formatRelativeTime } from './time';

describe('formatRelativeTime', () => {
  const now = new Date('2024-01-01T12:00:00Z');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('returns "Just now" for timestamps within 1 minute', () => {
    const date = new Date(now.getTime() - 30 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe('Just now');
  });

  it('returns minutes for timestamps within an hour', () => {
    const date = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe('10m ago');
  });

  it('returns hours for timestamps within a day', () => {
    const date = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe('3h ago');
  });

  it('returns "Yesterday" for 1 day difference', () => {
    const date = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe('Yesterday');
  });

  it('returns days for less than a week', () => {
    const date = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(date)).toBe('3d ago');
  });
});

