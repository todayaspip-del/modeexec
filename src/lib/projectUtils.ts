import { Project } from '../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Calculates the number of whole idle days elapsed since `lastActivityAt`.
 * Returns the floor of days elapsed, never negative.
 * If timestamp is missing or invalid, returns 0.
 */
export function getIdleDays(
  project: Pick<Project, 'lastActivityAt'>,
  now = Date.now()
): number {
  if (!project || !project.lastActivityAt) {
    return 0;
  }
  const timestamp = new Date(project.lastActivityAt).getTime();
  if (Number.isNaN(timestamp)) {
    return 0;
  }
  const diffMs = now - timestamp;
  if (diffMs <= 0) {
    return 0;
  }
  return Math.floor(diffMs / MS_PER_DAY);
}
