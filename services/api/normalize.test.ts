import { describe, expect, it } from 'vitest';

import { asRecord, normalizeHomeStats, normalizeResource, toNumber, toStringOrNull } from './normalize';

describe('normalize helpers', () => {
  it('asRecord rejects arrays and null', () => {
    expect(asRecord(null)).toEqual({});
    expect(asRecord([])).toEqual({});
    expect(asRecord({ a: 1 })).toEqual({ a: 1 });
  });

  it('toStringOrNull coerces numbers and blanks', () => {
    expect(toStringOrNull('x')).toBe('x');
    expect(toStringOrNull(12)).toBe('12');
    expect(toStringOrNull('  ')).toBeNull();
    expect(toStringOrNull(null)).toBeNull();
  });

  it('toNumber parses numeric strings', () => {
    expect(toNumber('42')).toBe(42);
    expect(toNumber(3.5)).toBe(3.5);
    expect(toNumber('nope', 7)).toBe(7);
  });
});

describe('normalizeResource', () => {
  it('maps list payload fields', () => {
    const resource = normalizeResource({
      id: 12,
      title: 'GoldHEN',
      platform: 'PS4',
      logo: '/uploads/x.png',
      nb_telechargements: '150',
    });
    expect(resource.id).toBe('12');
    expect(resource.title).toBe('GoldHEN');
    expect(resource.platform).toBe('PS4');
    expect(resource.downloads).toBe(150);
  });

  it('accepts alternate French field names', () => {
    const resource = normalizeResource({
      id: 'abc',
      nom: 'WebMAN',
      console: 'PS3',
    });
    expect(resource.title).toBe('WebMAN');
    expect(resource.platform).toBe('PS3');
  });
});

describe('normalizeHomeStats', () => {
  it('reads mixed string/number stats', () => {
    const stats = normalizeHomeStats({
      resources: '10',
      guides: 2,
      users: '3',
      storage: '1.2 GB',
    });
    expect(stats.resources).toBe(10);
    expect(stats.guides).toBe(2);
    expect(stats.users).toBe(3);
    expect(stats.storage).toBe('1.2 GB');
  });
});
