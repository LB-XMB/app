/**
 * Pure helpers for queue crash recovery (unit-tested without RN).
 */

export type QueueStatus = 'pending' | 'running' | 'done' | 'error';

export function sanitizeRunningJobs<T extends { status: QueueStatus }>(
  items: T[],
  patchWhenRunning?: Partial<T>
): T[] {
  return items.map((item) =>
    item.status === 'running'
      ? { ...item, status: 'pending' as const, ...(patchWhenRunning ?? {}) }
      : item
  );
}

export function countRunning<T extends { status: QueueStatus }>(items: T[]): number {
  return items.filter((item) => item.status === 'running').length;
}
