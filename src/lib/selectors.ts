import { Task, Project, Stage } from '../types';

export interface ProjectProgress {
  project: Project;
  currentStage: Stage | undefined;
  stageNumber: number;
  totalStages: number;
  doneCardsCount: number;
  totalCardsCount: number;
  progressPercent: number;
}

/**
 * Picks the primary focus task across all tasks:
 * - Among tasks with status 'pronta' or 'em_andamento'
 * - That belong to the CURRENT stage of an ACTIVE project (or have no stageId / no project)
 * - Never returns cards from future stages and never archived or completed cards
 * - Selection priority:
 *    1. isNextPhysicalAction === true
 *    2. status === 'em_andamento'
 *    3. lowest `order` (fallback to createdAt or original index)
 */
export function getFocusTask(
  tasks: Task[],
  projects: Project[],
  stages: Stage[]
): Task | undefined {
  const activeProjectIds = new Set(
    projects.filter((p) => p.status === 'ativo').map((p) => p.id)
  );

  const currentStageIds = new Set(
    stages
      .filter((s) => s.status === 'atual' && activeProjectIds.has(s.projectId))
      .map((s) => s.id)
  );

  const futureStageIds = new Set(
    stages.filter((s) => s.status === 'futura').map((s) => s.id)
  );

  const eligibleTasks = tasks.filter((t) => {
    // Must be 'pronta' or 'em_andamento'
    if (t.status !== 'pronta' && t.status !== 'em_andamento') {
      return false;
    }

    // Never return cards from future stages
    if (t.stageId && futureStageIds.has(t.stageId)) {
      return false;
    }

    // If belongs to a project, project must be active
    if (t.projectId && !activeProjectIds.has(t.projectId)) {
      return false;
    }

    // If has stageId, it must belong to a current stage
    if (t.stageId && !currentStageIds.has(t.stageId)) {
      return false;
    }

    return true;
  });

  if (eligibleTasks.length === 0) {
    return undefined;
  }

  // Sorting logic:
  // 1. isNextPhysicalAction first
  // 2. status === 'em_andamento'
  // 3. lowest order
  return [...eligibleTasks].sort((a, b) => {
    if (a.isNextPhysicalAction && !b.isNextPhysicalAction) return -1;
    if (!a.isNextPhysicalAction && b.isNextPhysicalAction) return 1;

    const aDoing = a.status === 'em_andamento';
    const bDoing = b.status === 'em_andamento';
    if (aDoing && !bDoing) return -1;
    if (!aDoing && bDoing) return 1;

    const orderA = a.order ?? 9999;
    const orderB = b.order ?? 9999;
    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return (a.createdAt || '').localeCompare(b.createdAt || '');
  })[0];
}

/**
 * Calculates progress and stage metrics for all active projects (or given projects)
 */
export function getActiveProjectsProgress(
  projects: Project[],
  stages: Stage[],
  tasks: Task[]
): Record<string, ProjectProgress> {
  const result: Record<string, ProjectProgress> = {};

  projects.forEach((project) => {
    const projectStages = stages
      .filter((s) => s.projectId === project.id)
      .sort((a, b) => a.order - b.order);

    const currentStageIndex = projectStages.findIndex((s) => s.status === 'atual');
    const currentStage = currentStageIndex >= 0 ? projectStages[currentStageIndex] : undefined;
    const stageNumber = currentStageIndex >= 0 ? currentStageIndex + 1 : 1;
    const totalStages = projectStages.length;

    const projectCards = tasks.filter(
      (t) => t.projectId === project.id && t.status !== 'arquivada'
    );
    const doneCardsCount = projectCards.filter((t) => t.status === 'concluida').length;
    const totalCardsCount = projectCards.length;
    const progressPercent =
      totalCardsCount > 0 ? Math.round((doneCardsCount / totalCardsCount) * 100) : 0;

    result[project.id] = {
      project,
      currentStage,
      stageNumber,
      totalStages,
      doneCardsCount,
      totalCardsCount,
      progressPercent
    };
  });

  return result;
}
