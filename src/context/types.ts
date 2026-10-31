import {
  UserProfile,
  Mission,
  Project,
  Task,
  Decision,
  DifficultConversationScenario,
  ProcessDoc,
  WeeklyReview,
  ExecutionMode,
  BlockerReason,
  WallpaperSettings,
  Stage,
  Idea,
  TaskStatus,
  CreateProjectWithMesaInput
} from '../types';
import { ToastItem, ShowToastFn, ToastOptions } from './hooks/useToasts';
import { CompleteCurrentStageResult } from './hooks/useBoardDomain';

export type { ToastItem, ShowToastFn, ToastOptions, CompleteCurrentStageResult, CreateProjectWithMesaInput };

export interface AppContextType {
  userProfile: UserProfile;
  missions: Mission[];
  projects: Project[];
  stages: Stage[];
  tasks: Task[];
  ideas: Idea[];
  decisions: Decision[];
  conversations: DifficultConversationScenario[];
  processes: ProcessDoc[];
  weeklyReviews: WeeklyReview[];
  currentRoute: string;
  toasts: ToastItem[];
  navigateTo: (route: string, opts?: { replace?: boolean }) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  setExecutionMode: (mode: ExecutionMode) => void;
  completeMission: (id: number, evidence: string, reflection?: string) => void;
  blockMission: (id: number, reason: BlockerReason, notes?: string) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'lastActivityAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Board actions
  getProjectStages: (projectId: string) => Stage[];
  getCurrentStage: (projectId: string) => Stage | undefined;
  addStage: (
    projectId: string,
    data: { title: string; doneCriteria: string },
    opts?: { atIndex?: number }
  ) => Stage | null;
  updateStage: (
    id: string,
    updates: Partial<Pick<Stage, 'title' | 'doneCriteria'>>
  ) => void;
  deleteStage: (id: string, opts?: { moveTasksToStageId?: string }) => boolean;
  reorderStages: (projectId: string, orderedIds: string[]) => void;
  completeCurrentStage: (
    projectId: string,
    opts?: { leftovers?: 'move_next' | 'park' | 'archive'; ignoreDecisions?: boolean }
  ) => CompleteCurrentStageResult;
  setCurrentStage: (projectId: string, stageId: string) => void;
  addCard: (stageId: string, partial: Partial<Task>) => Task | null;
  moveCard: (
    taskId: string,
    destination: { status?: TaskStatus; stageId?: string; index?: number }
  ) => boolean;
  setNextPhysicalAction: (taskId: string) => void;
  createProjectWithMesa: (input: CreateProjectWithMesaInput) => string;
  splitCard: (
    taskId: string,
    parts: { title: string; durationMinutes?: number; expectedEvidence?: string }[],
    archiveReason?: string
  ) => boolean;
  importProcessIntoStage: (
    processDoc: ProcessDoc,
    stageId: string
  ) => { createdCount: number; parkedCount: number };
  addIdea: (projectId: string, text: string) => Idea;
  discardIdea: (id: string) => void;
  restoreIdea: (id: string) => void;
  promoteIdea: (id: string, stageId: string) => Task | null;
  deleteIdea: (id: string) => void;

  // Tasks, Decisions, Processes, Reviews, System
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTaskComplete: (id: string) => void;
  deleteTask: (id: string) => void;
  addDecision: (decision: Omit<Decision, 'id'>) => string;
  resolveDecision: (id: string, chosenOption: string, rationale: string) => void;
  addProcess: (
    process: Omit<ProcessDoc, 'id' | 'createdAt'>,
    options?: {
      action?: { label: string; onClick: () => void };
      toastTitle?: string;
      toastMessage?: string;
    }
  ) => ProcessDoc | void;
  saveWeeklyReview: (review: Omit<WeeklyReview, 'id'>) => void;
  activateRecoveryMode: (options: {
    cleanBlockedTasks?: boolean;
    pauseStaleProjects?: boolean;
    chosenMinimalMissionId?: number;
    notes?: string;
  }) => void;
  resetToDemoData: () => void;
  resetToCleanUser: () => void;
  showToast: ShowToastFn;
  dismissToast: (id: string) => void;
  activeTodayMission: Mission;
  wallpaper: WallpaperSettings;
  updateWallpaper: (updates: Partial<WallpaperSettings>) => void;
}
