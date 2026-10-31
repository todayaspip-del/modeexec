import { Project, Stage, Task, Idea, Decision } from '../types';
import { getIdleDays } from './projectUtils';
import { getFocusTask } from './selectors';

export interface WeeklySummaryState {
  projects: Project[];
  stages: Stage[];
  tasks: Task[];
  ideas: Idea[];
  decisions: Decision[];
}

export interface WeeklySummaryReviewFields {
  completedWork: string;
  highImpactWork: string;
  openItems: string;
  canceledItems: string;
  decisionsMade: string;
  delegatedItems: string;
  nextPriority: string;
  firstPhysicalAction: string;
}

export interface StaleProjectItem {
  project: Project;
  idleDays: number;
  currentStageTitle?: string;
}

export interface WeeklySummaryMetrics {
  completedCardsCount: number;
  completedStagesCount: number;
  decisionsMadeCount: number;
}

export interface WeeklySummaryResult extends WeeklySummaryReviewFields {
  fields: WeeklySummaryReviewFields;
  metrics: WeeklySummaryMetrics;
  staleProjects: StaleProjectItem[];
  window: {
    start: Date;
    end: Date;
    startFormatted: string;
    endFormatted: string;
  };
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const PRIORITY_WEIGHT: Record<string, number> = {
  Alta: 3,
  Média: 2,
  Baixa: 1
};

/**
 * Pure generator for weekly review pre-fill and activity summary.
 * Analyzes activity across a rolling 7-day window.
 */
export function buildWeeklySummary(
  state: WeeklySummaryState,
  now: number = Date.now()
): WeeklySummaryResult {
  const windowStartTime = now - 7 * MS_PER_DAY;
  const windowStartDate = new Date(windowStartTime);
  const windowEndDate = new Date(now);

  const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  });

  const fullDateFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  function isTimestampInWindow(dateStr?: string): boolean {
    if (!dateStr) return false;
    const time = new Date(dateStr).getTime();
    return !isNaN(time) && time >= windowStartTime && time <= now;
  }

  // 1. Completed work in the last 7 days
  const completedTasksInWindow = state.tasks.filter(
    (t) => t.completedAt && isTimestampInWindow(t.completedAt)
  );

  const completedByProject = new Map<string, Task[]>();
  for (const task of completedTasksInWindow) {
    const projId = task.projectId || 'none';
    const list = completedByProject.get(projId) || [];
    list.push(task);
    completedByProject.set(projId, list);
  }

  function formatProjectLine(projId: string, pTasks: Task[]): string {
    const proj = state.projects.find((p) => p.id === projId);
    const projectName = proj?.name || pTasks[0]?.projectName || 'Geral';
    const count = pTasks.length;
    const titles = pTasks.map((t) => t.title.trim());
    const first3 = titles.slice(0, 3);
    const remaining = count - 3;
    const titlesJoined = first3.join('; ');
    const extraSuffix = remaining > 0 ? ` e mais ${remaining}` : '';
    const cardNoun = count === 1 ? '1 cartão' : `${count} cartões`;

    return `${projectName}: ${cardNoun} — ${titlesJoined}${extraSuffix}`;
  }

  const completedWorkLines: string[] = [];
  for (const [projId, pTasks] of completedByProject.entries()) {
    completedWorkLines.push(formatProjectLine(projId, pTasks));
  }
  const completedWork = completedWorkLines.join('\n');

  // 2. High impact work (restricted to projects with priority 'Alta')
  const highImpactProjectIds = new Set(
    state.projects.filter((p) => p.priority === 'Alta').map((p) => p.id)
  );

  const highImpactLines: string[] = [];
  for (const [projId, pTasks] of completedByProject.entries()) {
    if (highImpactProjectIds.has(projId)) {
      highImpactLines.push(formatProjectLine(projId, pTasks));
    }
  }
  const highImpactWork = highImpactLines.join('\n');

  // 3. Open items ('em_andamento' and 'bloqueada' with reason)
  const openTaskList = state.tasks.filter(
    (t) => t.status === 'em_andamento' || t.status === 'bloqueada'
  );

  const openItemsLines = openTaskList.map((t) => {
    if (t.status === 'bloqueada') {
      const reason = t.blockedReason ? ` (Impedimento: ${t.blockedReason})` : ' (Travada)';
      return `${t.title}${reason}`;
    }
    return `${t.title} (Em andamento)`;
  });
  const openItems = openItemsLines.join('\n');

  // 4. Canceled items (archived tasks in window + discarded ideas in window)
  const archivedTasksInWindow = state.tasks.filter(
    (t) => t.archivedAt && isTimestampInWindow(t.archivedAt)
  );
  const discardedIdeasInWindow = state.ideas.filter(
    (i) => i.discardedAt && isTimestampInWindow(i.discardedAt)
  );

  const canceledLines: string[] = [];
  for (const t of archivedTasksInWindow) {
    const reason = t.archiveReason ? ` (Motivo: ${t.archiveReason})` : '';
    const dateStr = t.archivedAt ? ` em ${fullDateFormatter.format(new Date(t.archivedAt))}` : '';
    canceledLines.push(`Cartão arquivado: "${t.title}"${reason}${dateStr}`);
  }
  for (const i of discardedIdeasInWindow) {
    const dateStr = i.discardedAt ? ` em ${fullDateFormatter.format(new Date(i.discardedAt))}` : '';
    canceledLines.push(`Ideia descartada: "${i.text}"${dateStr}`);
  }
  const canceledItems = canceledLines.join('\n');

  // 5. Decisions made in window
  const decisionsInWindow = state.decisions.filter(
    (d) => d.decidedAt && isTimestampInWindow(d.decidedAt)
  );

  const decisionLines = decisionsInWindow.map((d) => {
    const choice = d.chosenOption ? ` — Decisão: ${d.chosenOption}` : '';
    return `${d.title}${choice}`;
  });
  const decisionsMade = decisionLines.join('\n');

  // 6. Delegated items (empty string)
  const delegatedItems = '';

  // 7. Next priority: active project with highest priority, tie-broken by idle days
  const activeProjects = state.projects.filter((p) => p.status === 'ativo');

  const sortedActiveProjects = [...activeProjects].sort((a, b) => {
    const weightA = PRIORITY_WEIGHT[a.priority] ?? 0;
    const weightB = PRIORITY_WEIGHT[b.priority] ?? 0;
    if (weightA !== weightB) {
      return weightB - weightA;
    }
    const idleA = getIdleDays(a, now);
    const idleB = getIdleDays(b, now);
    return idleB - idleA;
  });

  const dominantProject = sortedActiveProjects[0];
  let nextPriority = '';
  if (dominantProject) {
    const currentStage = state.stages.find(
      (s) => s.projectId === dominantProject.id && s.status === 'atual'
    );
    if (currentStage) {
      nextPriority = `${dominantProject.name} — etapa ${currentStage.title}`;
    } else {
      nextPriority = dominantProject.name;
    }
  }

  // 8. First physical action: title of getFocusTask for that project
  let firstPhysicalAction = '';
  if (dominantProject) {
    const projTasks = state.tasks.filter((t) => t.projectId === dominantProject.id);
    const projStages = state.stages.filter((s) => s.projectId === dominantProject.id);
    const focusTask = getFocusTask(projTasks, [dominantProject], projStages);
    firstPhysicalAction = focusTask?.title || dominantProject.nextAction || '';
  }

  // Structured metrics & stale projects
  const completedStagesInWindow = state.stages.filter(
    (s) => s.completedAt && isTimestampInWindow(s.completedAt)
  );

  const metrics: WeeklySummaryMetrics = {
    completedCardsCount: completedTasksInWindow.length,
    completedStagesCount: completedStagesInWindow.length,
    decisionsMadeCount: decisionsInWindow.length
  };

  const staleProjects: StaleProjectItem[] = state.projects
    .filter((p) => (p.status === 'ativo' || p.status === 'pausado') && getIdleDays(p, now) >= 7)
    .map((p) => {
      const currentStage = state.stages.find(
        (s) => s.projectId === p.id && s.status === 'atual'
      );
      return {
        project: p,
        idleDays: getIdleDays(p, now),
        currentStageTitle: currentStage?.title
      };
    })
    .sort((a, b) => b.idleDays - a.idleDays);

  const fields: WeeklySummaryReviewFields = {
    completedWork,
    highImpactWork,
    openItems,
    canceledItems,
    decisionsMade,
    delegatedItems,
    nextPriority,
    firstPhysicalAction
  };

  return {
    ...fields,
    fields,
    metrics,
    staleProjects,
    window: {
      start: windowStartDate,
      end: windowEndDate,
      startFormatted: shortDateFormatter.format(windowStartDate),
      endFormatted: shortDateFormatter.format(windowEndDate)
    }
  };
}
