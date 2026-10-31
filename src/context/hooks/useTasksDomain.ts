import { useCallback } from 'react';
import { Task, Project } from '../../types';
import { usePersistentState } from '../../hooks/usePersistentState';
import { sortByOrder, nextOrder } from '../../lib/boardUtils';
import { ShowToastFn } from './useToasts';

export function useTasksDomain(
  showToast: ShowToastFn,
  setProjects?: React.Dispatch<React.SetStateAction<Project[]>>
) {
  const [tasks, setTasks] = usePersistentState<Task[]>('tasks', []);

  const touchProject = useCallback(
    (projectId: string | undefined, updates?: Partial<Project>) => {
      if (!projectId || !setProjects) return;
      const now = new Date().toISOString();
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, ...updates, lastActivityAt: now }
            : p
        )
      );
    },
    [setProjects]
  );

  const addTask = useCallback(
    (taskData: Omit<Task, 'id' | 'createdAt'>) => {
      const sameColumn = taskData.stageId
        ? tasks.filter((t) => t.stageId === taskData.stageId && t.status === taskData.status)
        : [];
      const calculatedOrder = taskData.order ?? (sameColumn.length > 0 ? nextOrder(sameColumn) : 1);

      const newTask: Task = {
        ...taskData,
        order: calculatedOrder,
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString().split('T')[0]
      };

      setTasks((prev) => [newTask, ...prev]);
      touchProject(newTask.projectId);
      showToast('Tarefa Registrada', 'Próxima ação adicionada ao fluxo de execução.');
    },
    [tasks, setTasks, touchProject, showToast]
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<Task>) => {
      const now = new Date().toISOString();
      let affectedProjectId: string | undefined;
      let nextActionTitleToSync: string | undefined;

      setTasks((prev) => {
        const target = prev.find((t) => t.id === id);
        if (!target) return prev;
        affectedProjectId = target.projectId;

        const nextStatus = updates.status ?? target.status;
        let startedAt = updates.startedAt ?? target.startedAt;
        let completedAt = updates.completedAt ?? target.completedAt;

        if (nextStatus === 'em_andamento' && !startedAt) {
          startedAt = now;
        }
        if (nextStatus === 'concluida' && !completedAt) {
          completedAt = now;
        } else if (target.status === 'concluida' && nextStatus !== 'concluida') {
          completedAt = undefined;
        }

        const isBecomingCompleted = target.status !== 'concluida' && nextStatus === 'concluida';
        const isNextPhysical = target.isNextPhysicalAction;

        let nextActionPromotedId: string | undefined;

        if (isBecomingCompleted && isNextPhysical && affectedProjectId) {
          let candidates = prev.filter(
            (t) =>
              t.projectId === affectedProjectId &&
              t.stageId === target.stageId &&
              t.status === 'pronta' &&
              t.id !== id
          );
          if (candidates.length === 0) {
            candidates = prev.filter(
              (t) =>
                t.projectId === affectedProjectId &&
                t.status === 'pronta' &&
                t.id !== id
            );
          }
          const sorted = sortByOrder(candidates);
          const nextCandidate = sorted[0];
          if (nextCandidate) {
            nextActionPromotedId = nextCandidate.id;
            nextActionTitleToSync = nextCandidate.title;
          } else {
            nextActionTitleToSync = '';
          }
        }

        if (updates.isNextPhysicalAction === true) {
          nextActionTitleToSync = updates.title ?? target.title;
        } else if (target.isNextPhysicalAction && updates.title) {
          nextActionTitleToSync = updates.title;
        }

        return prev.map((t) => {
          if (t.id === id) {
            return {
              ...t,
              ...updates,
              startedAt,
              completedAt,
              isNextPhysicalAction: isBecomingCompleted && isNextPhysical ? false : (updates.isNextPhysicalAction ?? t.isNextPhysicalAction)
            };
          }
          if (nextActionPromotedId && t.id === nextActionPromotedId) {
            return { ...t, isNextPhysicalAction: true };
          }
          // If updates explicitly sets isNextPhysicalAction true for this task, clear other tasks of same project
          if (updates.isNextPhysicalAction === true && t.projectId === affectedProjectId && t.id !== id) {
            return { ...t, isNextPhysicalAction: false };
          }
          return t;
        });
      });

      if (affectedProjectId) {
        const projectUpdates: Partial<Project> = {};
        if (nextActionTitleToSync !== undefined) {
          projectUpdates.nextAction = nextActionTitleToSync;
        }
        touchProject(affectedProjectId, projectUpdates);
      }
    },
    [setTasks, touchProject]
  );

  const toggleTaskComplete = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      let affectedProjectId: string | undefined;
      let nextActionTitleToSync: string | undefined;

      setTasks((prev) => {
        const target = prev.find((t) => t.id === id);
        if (!target) return prev;
        affectedProjectId = target.projectId;

        const nextStatus = target.status === 'concluida' ? 'pronta' : 'concluida';
        if (nextStatus === 'concluida') {
          showToast('Entrega Realizada', `"${target.title}" foi marcada como concluída!`, 'success');
        }

        let nextActionPromotedId: string | undefined;

        if (nextStatus === 'concluida' && target.isNextPhysicalAction && affectedProjectId) {
          let candidates = prev.filter(
            (t) =>
              t.projectId === affectedProjectId &&
              t.stageId === target.stageId &&
              t.status === 'pronta' &&
              t.id !== id
          );
          if (candidates.length === 0) {
            candidates = prev.filter(
              (t) =>
                t.projectId === affectedProjectId &&
                t.status === 'pronta' &&
                t.id !== id
            );
          }
          const sorted = sortByOrder(candidates);
          const nextCandidate = sorted[0];
          if (nextCandidate) {
            nextActionPromotedId = nextCandidate.id;
            nextActionTitleToSync = nextCandidate.title;
          } else {
            nextActionTitleToSync = '';
          }
        }

        return prev.map((t) => {
          if (t.id === id) {
            return {
              ...t,
              status: nextStatus,
              completedAt: nextStatus === 'concluida' ? now : undefined,
              isNextPhysicalAction: nextStatus === 'concluida' && target.isNextPhysicalAction ? false : t.isNextPhysicalAction
            };
          }
          if (nextActionPromotedId && t.id === nextActionPromotedId) {
            return { ...t, isNextPhysicalAction: true };
          }
          return t;
        });
      });

      if (affectedProjectId) {
        const projectUpdates: Partial<Project> = {};
        if (nextActionTitleToSync !== undefined) {
          projectUpdates.nextAction = nextActionTitleToSync;
        }
        touchProject(affectedProjectId, projectUpdates);
      }
    },
    [setTasks, touchProject, showToast]
  );

  const deleteTask = useCallback(
    (id: string) => {
      let affectedProjectId: string | undefined;
      setTasks((prev) => {
        const target = prev.find((t) => t.id === id);
        if (target) {
          affectedProjectId = target.projectId;
        }
        return prev.filter((t) => t.id !== id);
      });
      if (affectedProjectId) {
        touchProject(affectedProjectId);
      }
      showToast('Tarefa Removida', 'Item retirado da lista.', 'info');
    },
    [setTasks, touchProject, showToast]
  );

  return {
    tasks,
    setTasks,
    addTask,
    updateTask,
    toggleTaskComplete,
    deleteTask
  };
}
