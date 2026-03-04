import { getVideoRoomName } from './video';

describe('getVideoRoomName', () => {
  it('builds deterministic Jitsi room names', () => {
    expect(getVideoRoomName({ type: 'dm', id: '123' })).toBe(
      'whatwewill-dm-123'
    );
    expect(getVideoRoomName({ type: 'event', id: 'abc' })).toBe(
      'whatwewill-event-abc'
    );
  });
});

