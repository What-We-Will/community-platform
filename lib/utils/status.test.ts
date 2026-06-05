import { getOnlineStatus, type OnlineStatus } from './status';

describe('getOnlineStatus', () => {
  const now = new Date('2024-01-01T12:00:00Z');

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  const minutesAgo = (minutes: number) =>
    new Date(now.getTime() - minutes * 60 * 1000).toISOString();

  it('returns "online" for current user regardless of lastSeenAt', () => {
    const status: OnlineStatus = getOnlineStatus(null, { isCurrentUser: true });
    expect(status).toBe('online');
  });

  it('returns "offline" when lastSeenAt is null', () => {
    expect(getOnlineStatus(null)).toBe('offline');
  });

  it('returns "online" within 5 minutes', () => {
    expect(getOnlineStatus(minutesAgo(3))).toBe('online');
  });

  it('returns "away" between 5 and 30 minutes', () => {
    expect(getOnlineStatus(minutesAgo(10))).toBe('away');
  });

  it('returns "offline" after 30 minutes', () => {
    expect(getOnlineStatus(minutesAgo(45))).toBe('offline');
  });
});

