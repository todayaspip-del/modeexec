import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { UserProfile, Project, DifficultConversationScenario } from '../types';
import {
  INITIAL_USER_PROFILE,
  INITIAL_PROJECTS,
  INITIAL_STAGES,
  INITIAL_TASKS,
  INITIAL_IDEAS,
  INITIAL_DECISIONS,
  CONVERSATION_SCENARIOS,
  INITIAL_PROCESSES,
  MISSIONS_30_DAYS
} from '../data/seedData';
import { getIdleDays } from '../lib/projectUtils';
import {
  ToastItem,
  useToasts,
  useAppRouter,
  useProfileDomain,
  useMissionsDomain,
  useProjectsDomain,
  useStagesDomain,
  useTasksDomain,
  useIdeasDomain,
  useBoardDomain,
  useDecisionsDomain,
  useProcessesDomain,
  useReviewsDomain,
  useWallpaperDomain,
  INITIAL_WALLPAPER
} from './hooks';
import { AppContextType } from './types';

export type { ToastItem, AppContextType };
export { INITIAL_WALLPAPER };

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentRoute, navigateTo } = useAppRouter();
  const { toasts, showToast, dismissToast } = useToasts();

  const { userProfile, setUserProfile, updateUserProfile, setExecutionMode } = useProfileDomain(showToast);
  const { missions, setMissions, activeTodayMission, completeMission, blockMission } = useMissionsDomain(showToast);
  const { stages, setStages } = useStagesDomain(showToast);
  const { ideas, setIdeas } = useIdeasDomain(showToast);

  const {
    projects,
    setProjects,
    addProject,
    updateProject: baseUpdateProject,
    deleteProject: baseDeleteProject
  } = useProjectsDomain(showToast);

  const { tasks, setTasks, addTask, updateTask, toggleTaskComplete, deleteTask } =
    useTasksDomain(showToast, setProjects);

  const updateProject = useCallback(
    (id: string, updates: Partial<Project>) => {
      baseUpdateProject(id, updates);
      if (updates.name) {
        setTasks((prev) =>
          prev.map((t) => (t.projectId === id ? { ...t, projectName: updates.name } : t))
        );
      }
    },
    [baseUpdateProject, setTasks]
  );

  const deleteProject = useCallback(
    (id: string) => {
      baseDeleteProject(id);
      setTasks((prev) => prev.filter((t) => t.projectId !== id));
      setStages((prev) => prev.filter((s) => s.projectId !== id));
      setIdeas((prev) => prev.filter((i) => i.projectId !== id));
    },
    [baseDeleteProject, setTasks, setStages, setIdeas]
  );

  const { decisions, setDecisions, addDecision, resolveDecision } = useDecisionsDomain(showToast, setTasks);

  const {
    getProjectStages,
    getCurrentStage,
    addStage,
    updateStage,
    deleteStage,
    reorderStages,
    completeCurrentStage,
    setCurrentStage,
    addCard,
    moveCard,
    setNextPhysicalAction,
    splitCard,
    createProjectWithMesa,
    importProcessIntoStage,
    addIdea,
    discardIdea,
    restoreIdea,
    promoteIdea,
    deleteIdea
  } = useBoardDomain(
    stages,
    setStages,
    tasks,
    setTasks,
    ideas,
    setIdeas,
    projects,
    setProjects,
    showToast,
    userProfile,
    decisions
  );

  const { processes, setProcesses, addProcess } = useProcessesDomain(showToast);
  const { weeklyReviews, setWeeklyReviews, saveWeeklyReview } = useReviewsDomain(showToast);
  const { wallpaper, updateWallpaper } = useWallpaperDomain();

  const [conversations] = useState<DifficultConversationScenario[]>(CONVERSATION_SCENARIOS);

  // Cross-domain orchestration
  const activateRecoveryMode = useCallback(
    (options: {
      cleanBlockedTasks?: boolean;
      pauseStaleProjects?: boolean;
      chosenMinimalMissionId?: number;
      notes?: string;
    }) => {
      setUserProfile((prev) => ({ ...prev, currentMode: 'Recuperação' }));

      if (options.cleanBlockedTasks) {
        const now = new Date().toISOString();
        setTasks((prev) =>
          prev.map((t) =>
            t.status === 'bloqueada'
              ? { ...t, status: 'arquivada', archivedAt: now, archiveReason: 'Arquivada em Recuperação' }
              : t
          )
        );
      }

      if (options.pauseStaleProjects) {
        setProjects((prev) =>
          prev.map((p) => (p.status === 'ativo' && getIdleDays(p) > 5 ? { ...p, status: 'pausado' } : p))
        );
      }

      showToast(
        'Modo Recuperação Ativado',
        'Sem cobrança, sem compensação de atrasos. Um passo limpo por vez.',
        'info'
      );
    },
    [setUserProfile, setTasks, setProjects, showToast]
  );

  const resetToDemoData = useCallback(() => {
    setUserProfile(INITIAL_USER_PROFILE);
    setMissions(MISSIONS_30_DAYS);
    setProjects(INITIAL_PROJECTS);
    setStages(INITIAL_STAGES);
    setTasks(INITIAL_TASKS);
    setIdeas(INITIAL_IDEAS);
    setDecisions(INITIAL_DECISIONS);
    setProcesses(INITIAL_PROCESSES);
    showToast('Dados de Demonstração Restaurados', 'O painel agora exibe o cenário de exemplo de Rafael.');
  }, [setUserProfile, setMissions, setProjects, setStages, setTasks, setIdeas, setDecisions, setProcesses, showToast]);

  const resetToCleanUser = useCallback(() => {
    const cleanProfile: UserProfile = {
      name: 'Você',
      business: 'Meu Negócio',
      teamSize: '1 pessoa',
      currentMode: 'Normal',
      dailyMinutes: 20,
      isDemo: false,
      onboardingCompleted: false,
      createdAt: new Date().toISOString()
    };
    setUserProfile(cleanProfile);
    setMissions(
      MISSIONS_30_DAYS.map((m) => ({
        ...m,
        completed: false,
        userEvidence: undefined,
        userReflection: undefined,
        completionDate: undefined,
        blockedReason: undefined
      }))
    );
    setProjects([]);
    setStages([]);
    setTasks([]);
    setIdeas([]);
    setDecisions([]);
    setProcesses([]);
    setWeeklyReviews([]);
    showToast('Ambiente Zerado', 'Conta limpa para iniciar seu próprio ciclo.');
    navigateTo('/diagnostico');
  }, [
    setUserProfile, setMissions, setProjects, setStages, setTasks,
    setIdeas, setDecisions, setProcesses, setWeeklyReviews, showToast, navigateTo
  ]);

  const value = useMemo<AppContextType>(
    () => ({
      userProfile, missions, projects, stages, tasks, ideas, decisions, conversations, processes, weeklyReviews,
      currentRoute, toasts, navigateTo, updateUserProfile, setExecutionMode, completeMission, blockMission,
      addProject, updateProject, deleteProject,
      getProjectStages, getCurrentStage, addStage, updateStage, deleteStage, reorderStages,
      completeCurrentStage, setCurrentStage, addCard, moveCard, setNextPhysicalAction, splitCard, createProjectWithMesa, importProcessIntoStage,
      addIdea, discardIdea, restoreIdea, promoteIdea, deleteIdea,
      addTask, updateTask, toggleTaskComplete, deleteTask,
      addDecision, resolveDecision, addProcess, saveWeeklyReview, activateRecoveryMode,
      resetToDemoData, resetToCleanUser, showToast, dismissToast, activeTodayMission, wallpaper, updateWallpaper
    }),
    [
      userProfile, missions, projects, stages, tasks, ideas, decisions, conversations, processes, weeklyReviews,
      currentRoute, toasts, navigateTo, updateUserProfile, setExecutionMode, completeMission, blockMission,
      addProject, updateProject, deleteProject,
      getProjectStages, getCurrentStage, addStage, updateStage, deleteStage, reorderStages,
      completeCurrentStage, setCurrentStage, addCard, moveCard, setNextPhysicalAction, splitCard, createProjectWithMesa, importProcessIntoStage,
      addIdea, discardIdea, restoreIdea, promoteIdea, deleteIdea,
      addTask, updateTask, toggleTaskComplete, deleteTask,
      addDecision, resolveDecision, addProcess, saveWeeklyReview, activateRecoveryMode,
      resetToDemoData, resetToCleanUser, showToast, dismissToast, activeTodayMission, wallpaper, updateWallpaper
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
