import { UserProfile, Stage, Task } from '../types';

export interface BoardRules {
  maxActiveProjects: number;
  wipDoing: number;
  maxOpenCardsCurrentStage: number;
  maxCardsFutureStage: number;
  maxStagesPerProject: number;
  requireDoneCriteria: boolean;
  showFutureStages: boolean;
  showRoadmap: boolean;
  compactMode: boolean;
  singleCardMode: boolean;
  maxCardMinutes: number | null;
}

export const DEFAULT_RULES: BoardRules = {
  maxActiveProjects: 3,
  wipDoing: 2,
  maxOpenCardsCurrentStage: 7,
  maxCardsFutureStage: 5,
  maxStagesPerProject: 7,
  requireDoneCriteria: true,
  showFutureStages: true,
  showRoadmap: true,
  compactMode: false,
  singleCardMode: false,
  maxCardMinutes: null
};

export function getBoardRules(
  profile?: Pick<UserProfile, 'currentMode' | 'executionPattern'>
): BoardRules {
  // TODO(2.5): mode and pattern overrides
  if (!profile) {
    return DEFAULT_RULES;
  }
  return DEFAULT_RULES;
}

export type RuleViolation = {
  code:
    | 'wip_doing'
    | 'max_open_current'
    | 'max_future'
    | 'max_stages'
    | 'missing_done_criteria'
    | 'missing_evidence';
  message: string;
  hint: string;
};

/**
 * Checks if a task can be transitioned to 'em_andamento'.
 * Enforces WIP limits on active work to stop multitasking overwhelm.
 */
export function canMoveToDoing(
  tasks: Task[],
  stage: Stage,
  rules: BoardRules,
  taskId?: string
): RuleViolation | null {
  if (stage.status === 'concluida') {
    return {
      code: 'max_open_current',
      message: 'Esta etapa já foi concluída.',
      hint: 'Reabra a etapa ou selecione uma etapa ativa para trabalhar neste cartão.'
    };
  }

  const doingCards = tasks.filter(
    (t) =>
      t.projectId === stage.projectId &&
      t.status === 'em_andamento' &&
      t.id !== taskId
  );

  if (doingCards.length >= rules.wipDoing) {
    return {
      code: 'wip_doing',
      message: `Você já tem ${rules.wipDoing} ${
        rules.wipDoing === 1 ? 'cartão' : 'cartões'
      } em andamento.`,
      hint: 'Conclua ou trave um deles antes de começar outro.'
    };
  }

  return null;
}

/**
 * Checks if a new card can be created in the target stage.
 * - Current stage counts OPEN cards (not concluida/arquivada).
 * - Future stage counts all non-archived cards.
 * - 'concluida' stage always blocks.
 */
export function canAddCard(
  tasks: Task[],
  stage: Stage,
  rules: BoardRules
): RuleViolation | null {
  if (stage.status === 'concluida') {
    return {
      code: 'max_open_current',
      message: 'Esta etapa já foi concluída.',
      hint: 'Adicione cartões na etapa atual ou crie uma nova etapa para continuar planejando.'
    };
  }

  if (stage.status === 'atual') {
    const openCards = tasks.filter(
      (t) =>
        t.stageId === stage.id &&
        t.status !== 'concluida' &&
        t.status !== 'arquivada'
    );
    if (openCards.length >= rules.maxOpenCardsCurrentStage) {
      return {
        code: 'max_open_current',
        message: `Esta etapa já tem ${rules.maxOpenCardsCurrentStage} cartões abertos.`,
        hint: 'Guarde a ideia no Estacionamento ou conclua um cartão antes de criar mais.'
      };
    }
  }

  if (stage.status === 'futura') {
    const nonArchivedCards = tasks.filter(
      (t) => t.stageId === stage.id && t.status !== 'arquivada'
    );
    if (nonArchivedCards.length >= rules.maxCardsFutureStage) {
      return {
        code: 'max_future',
        message: `Esta etapa futura já tem ${rules.maxCardsFutureStage} cartões planejados.`,
        hint: 'Planejar demais atrasa o começo. Deixe o detalhe para quando a etapa chegar.'
      };
    }
  }

  return null;
}

/**
 * Checks if a new stage can be added to the project.
 * Caps the maximum number of stages per project to maintain clear focus.
 */
export function canAddStage(
  stages: Stage[],
  rules: BoardRules
): RuleViolation | null {
  if (stages.length >= rules.maxStagesPerProject) {
    return {
      code: 'max_stages',
      message: `Este projeto já atingiu o limite de ${rules.maxStagesPerProject} etapas.`,
      hint: 'Poucas etapas deixam o caminho claro. Que tal juntar duas?'
    };
  }
  return null;
}

/**
 * Validates that a stage provides an observable done criteria if required.
 */
export function validateDoneCriteria(
  doneCriteria: string | undefined,
  rules: BoardRules
): RuleViolation | null {
  if (rules.requireDoneCriteria && (!doneCriteria || !doneCriteria.trim())) {
    return {
      code: 'missing_done_criteria',
      message: 'Toda etapa precisa de um critério de conclusão.',
      hint: 'Defina uma evidência observável para saber quando a etapa foi cumprida.'
    };
  }
  return null;
}
