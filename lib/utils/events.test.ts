import { eventTypeConfig, eventTypeOptions } from './events';

describe('eventTypeConfig', () => {
  it('has entries for all known event types', () => {
    const keys = Object.keys(eventTypeConfig).sort();
    expect(keys).toEqual([
      'ama',
      'mock_interview',
      'other',
      'skillshare',
      'social',
      'workshop',
    ]);
  });

  it('provides label and color for each event type', () => {
    for (const [key, value] of Object.entries(eventTypeConfig)) {
      expect(value.label).toBeTruthy();
      expect(value.color).toBeTruthy();
      expect(typeof value.label).toBe('string');
      expect(typeof value.color).toBe('string');
    }
  });
});

describe('eventTypeOptions', () => {
  it('includes "all" plus all concrete event types', () => {
    const values = eventTypeOptions.map((o) => o.value);
    expect(values).toEqual([
      'all',
      'skillshare',
      'workshop',
      'ama',
      'mock_interview',
      'social',
      'other',
    ]);
  });
});

