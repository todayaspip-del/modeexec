export type ExecutionMode = 'Normal' | 'Reduzido' | 'Recuperação';

export type TaskStatus = 'pronta' | 'em_andamento' | 'bloqueada' | 'concluida' | 'arquivada';
export type ProjectStatus = 'ativo' | 'pausado' | 'concluido' | 'cancelado';
export type Priority = 'Alta' | 'Média' | 'Baixa';

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  pronta: 'Pronta',
  em_andamento: 'Em andamento',
  bloqueada: 'Bloqueada',
  concluida: 'Concluída',
  arquivada: 'Arquivada'
};

export type BlockerReason = 
  | 'falta_tempo'
  | 'falta_clareza'
  | 'tarefa_grande'
  | 'medo_resistencia'
  | 'dependencia_terceiro'
  | 'baixa_energia'
  | 'falta_informacao';

export type ExecutionPatternKey = 
  | 'excesso_planejamento'
  | 'perfeccionismo'
  | 'falta_clareza'
  | 'excesso_tarefas'
  | 'dificuldade_decisao'
  | 'dificuldade_delegacao'
  | 'conversa_evitada'
  | 'baixa_energia'
  | 'medo_vender'
  | 'excesso_ideias';

export interface UserProfile {
  name: string;
  business: string;
  teamSize: string;
  currentMode: ExecutionMode;
  executionPattern?: ExecutionPatternKey;
  dailyMinutes: number;
  isDemo: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface Mission {
  id: number;
  day: number;
  title: string;
  subtitle: string;
  whyItMatters: string;
  estimatedMinutes: number;
  reflectionPrompt: string;
  practicalAction: string;
  minimalAction: string;
  expectedEvidence: string;
  completed: boolean;
  userReflection?: string;
  userEvidence?: string;
  completionDate?: string;
  blockedReason?: BlockerReason;
  blockedNotes?: string;
}

export type StageStatus = 'futura' | 'atual' | 'concluida';

export interface Stage {
  id: string;
  projectId: string;
  title: string;
  doneCriteria: string;
  order: number;
  status: StageStatus;
  createdAt: string;
  completedAt?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Idea {
  id: string;
  projectId: string;
  text: string;
  createdAt: string;
  promotedTaskId?: string;
  discardedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  desiredOutcome: string;
  deadline?: string;
  priority: Priority;
  status: ProjectStatus;
  lastActivityAt: string;
  nextAction: string;
  createdAt: string;
  templateId?: string;
}

export interface CreateProjectWithMesaInput {
  name: string;
  desiredOutcome: string;
  deadline?: string;
  priority: Priority;
  status?: ProjectStatus;
  templateId?: string;
  stages: {
    title: string;
    doneCriteria: string;
    cards?: {
      title: string;
      durationMinutes: number;
      expectedEvidence: string;
      isNextPhysicalAction?: boolean;
    }[];
  }[];
}

export interface CardLabel {
  id: string;
  name: string;
  color: string;
}

export interface CardAttachment {
  id: string;
  name: string;
  url: string;
  addedAt: string;
  type?: string;
  isCover?: boolean;
}

export interface CardComment {
  id: string;
  author: string;
  avatar?: string;
  text: string;
  createdAt: string;
}

export interface CardActivity {
  id: string;
  text: string;
  createdAt: string;
  type?: string;
}

export interface CardMember {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
}

export interface Task {
  id: string;
  title: string;
  durationMinutes: number;
  projectId?: string;
  projectName?: string;
  status: TaskStatus;
  blockedReason?: string;
  expectedEvidence: string;
  isNextPhysicalAction: boolean;
  completedAt?: string;
  archivedAt?: string;
  archiveReason?: string;
  createdAt: string;
  stageId?: string;
  order?: number;
  description?: string;
  checklist?: ChecklistItem[];
  evidenceNote?: string;
  minimumVersion?: string;
  startedAt?: string;
  decisionId?: string;
  conversationSlug?: string;
  missionId?: number;
  blockedReasonKey?: BlockerReason;
  // Trello clone fields
  labels?: CardLabel[];
  dueDate?: string;
  dueComplete?: boolean;
  coverColor?: string;
  coverImage?: string;
  attachments?: CardAttachment[];
  comments?: CardComment[];
  activities?: CardActivity[];
  members?: CardMember[];
  subscribed?: boolean;
  listId?: string;
}

export interface Decision {
  id: string;
  title: string;
  openDays: number;
  postponeCost: string;
  missingInformation: string;
  nextStep: string;
  reviewDate: string;
  status: 'pendente' | 'decidida';
  options?: {
    label: string;
    pros: string;
    cons: string;
    risk: 'Baixo' | 'Médio' | 'Alto';
  }[];
  chosenOption?: string;
  rationale?: string;
  decidedAt?: string;
  projectId?: string;
  stageId?: string;
  taskId?: string;
}

export interface DifficultConversationScenario {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  objective: string;
  observableFacts: string;
  impact: string;
  request: string;
  limit: string;
  alternative: string;
  shortScriptMessage: string;
  audioInsight?: string;
}

export interface ProcessDoc {
  id: string;
  title: string;
  trigger: string;
  steps: string[];
  responsible: string;
  minimumStandard: string;
  commonMistakes: string[];
  expectedResult: string;
  delegation?: {
    assignee: string;
    context: string;
    deadline: string;
    autonomyLevel: 'Total' | 'Avisar após' | 'Consultar antes';
    followUpDate: string;
  };
  createdAt: string;
}

export interface WeeklyReview {
  id: string;
  weekNumber: number;
  date: string;
  completedWork: string;
  highImpactWork: string;
  openItems: string;
  canceledItems: string;
  decisionsMade: string;
  delegatedItems: string;
  nextPriority: string;
  firstPhysicalAction: string;
  completed: boolean;
}

export interface EbookChapter {
  id: number;
  day: number;
  title: string;
  readingTimeMin: number;
  coreLesson: string;
  quote: string;
  audioDurationMin?: number;
  summaryBulletPoints: string[];
}

export interface WallpaperSettings {
  enabled: boolean;
  imageUrl: string;
  opacity: number; // 0.05 to 0.8
  blur: number; // in pixels (0 to 40)
  presetName: string;
}

