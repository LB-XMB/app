import { describe, expect, it } from 'vitest';

import { countRunning, sanitizeRunningJobs } from './queueSanitize';

describe('sanitizeRunningJobs', () => {
  it('remaps running → pending and leaves others', () => {
    const input = [
      { id: '1', status: 'running' as const, progress: 0.5 },
      { id: '2', status: 'pending' as const, progress: null },
      { id: '3', status: 'done' as const, progress: 1 },
      { id: '4', status: 'error' as const, progress: null },
    ];
    const out = sanitizeRunningJobs(input, { progress: null });
    expect(out.map((j) => j.status)).toEqual(['pending', 'pending', 'done', 'error']);
    expect(out[0]?.progress).toBeNull();
    expect(countRunning(input)).toBe(1);
    expect(countRunning(out)).toBe(0);
  });

  it('is a no-op when nothing is running', () => {
    const input = [{ id: '1', status: 'done' as const }];
    const out = sanitizeRunningJobs(input);
    expect(out).toEqual(input);
  });
});
