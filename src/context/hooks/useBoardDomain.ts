import { useCallback } from 'react';
import { Stage, Task, Idea, Project, TaskStatus, StageStatus, UserProfile, CreateProjectWithMesaInput, Decision, ProcessDoc } from '../../types';
import { shortenToOneSentence } from '../../lib/processImport';
import {
  sortByOrder,
  nextOrder,
  reindexColumn,
  insertAt,
  moveBetweenColumns
} from '../../lib/boardUtils';
import {
  getBoardRules,
  canMoveToDoing,
  canAddCard,
  canAddStage,
  validateDoneCriteria
} from '../../lib/boardRules';
import { ShowToastFn } from './useToasts';

export interface CompleteCurrentStageResult {
  ok: boolean;
  reason?: 'has_open_tasks' | 'pending_decisions' | 'no_next_stage';
  pendingTaskIds?: string[];
  pendingDecisionIds?: string[];
}

export function useBoardDomain(
  stages: Stage[],
  setStages: React.Dispatch<React.SetStateAction<Stage[]>>,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  ideas: Idea[],
  setIdeas: React.Dispatch<React.SetStateAction<Idea[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  showToast: ShowToastFn,
  userProfile?: UserProfile,
  decisions?: Decision[]
) {
  const touchProject = useCallback(
    (projectId: string | undefined) => {
      if (!projectId) return;
      const now = new Date().toISOString();
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, lastActivityAt: now } : p))
      );
    },
    [setProjects]
  );

  const getProjectStages = useCallback(
    (projectId: string): Stage[] => {
      const projectStages = stages.filter((s) => s.projectId === projectId);
      return sortByOrder(projectStages);
    },
    [stages]
  );

  const getCurrentStage = useCallback(
    (projectId: string): Stage | undefined => {
      return stages.find((s) => s.projectId === projectId && s.status === 'atual');
    },
    [stages]
  );

  const addStage = useCallback(
    (
      projectId: string,
      data: { title: string; doneCriteria: string },
      opts?: { atIndex?: number }
    ): Stage | null => {
      const projectStages = stages.filter((s) => s.projectId === projectId);
      const rules = getBoardRules(userProfile);

      const stageViolation = canAddStage(projectStages, rules);
      if (stageViolation) {
        showToast(`${stageViolation.message} ${stageViolation.hint}`, 'warning');
        return null;
      }

      const criteriaViolation = validateDoneCriteria(data.doneCriteria, rules);
      if (criteriaViolation) {
        showToast(`${criteriaViolation.message} ${criteriaViolation.hint}`, 'warning');
        return null;
      }

      const isFirst = projectStages.length === 0;
      const status: StageStatus = isFirst ? 'atual' : 'futura';

      const newStage: Stage = {
        id: `stage-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        projectId,
        title: data.title,
        doneCriteria: data.doneCriteria,
        order: 0,
        status,
        createdAt: new Date().toISOString()
      };

      const sortedExisting = sortByOrder(projectStages);
      const reindexedProjectStages = insertAt(sortedExisting, newStage, opts?.atIndex);
      const createdStageWithOrder =
        reindexedProjectStages.find((s) => s.id === newStage.id) ?? newStage;

      setStages((prev) => [
        ...prev.filter((s) => s.projectId !== projectId),
        ...reindexedProjectStages
      ]);

      touchProject(projectId);
      showToast('Etapa Criada', `A etapa "${newStage.title}" foi adicionada à mesa.`);
      return createdStageWithOrder;
    },
    [stages, setStages, touchProject, showToast, userProfile]
  );

  const updateStage = useCallback(
    (id: string, updates: Partial<Pick<Stage, 'title' | 'doneCriteria'>>) => {
      let targetProjectId: string | undefined;
      setStages((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            targetProjectId = s.projectId;
            return {
              ...s,
              ...(updates.title !== undefined ? { title: updates.title } : {}),
              ...(updates.doneCriteria !== undefined ? { doneCriteria: updates.doneCriteria } : {})
            };
          }
          return s;
        })
      );
      if (targetProjectId) {
        touchProject(targetProjectId);
      }
      showToast('Etapa Atualizada', 'As alterações da etapa foram salvas.');
    },
    [setStages, touchProject, showToast]
  );

  const deleteStage = useCallback(
    (id: string, opts?: { moveTasksToStageId?: string }): boolean => {
      const stageToDelete = stages.find((s) => s.id === id);
      if (!stageToDelete) {
        return false;
      }

      const activeTasks = tasks.filter(
        (t) => t.stageId === id && t.status !== 'arquivada'
      );

      if (activeTasks.length > 0 && !opts?.moveTasksToStageId) {
        showToast(
          'Não é Possível Excluir',
          'Esta etapa contém tarefas ativas. Mova as tarefas antes de excluí-la.',
          'warning'
        );
        return false;
      }

      // If moveTasksToStageId is provided, move all stage tasks
      if (opts?.moveTasksToStageId) {
        const targetStageId = opts.moveTasksToStageId;
        setTasks((prev) =>
          prev.map((t) => (t.stageId === id ? { ...t, stageId: targetStageId } : t))
        );
      }

      const projectStages = sortByOrder(stages.filter((s) => s.projectId === stageToDelete.projectId));
      const remainingStages = projectStages.filter((s) => s.id !== id);

      let updatedStages = remainingStages;
      if (stageToDelete.status === 'atual' && remainingStages.length > 0) {
        const deletedIdx = projectStages.findIndex((s) => s.id === id);
        // Next stage by order, or previous if none
        let promoted = remainingStages[deletedIdx] ?? remainingStages[remainingStages.length - 1];
        updatedStages = remainingStages.map((s) =>
          s.id === promoted.id ? { ...s, status: 'atual' as StageStatus } : s
        );
      }

      const reindexedRemaining = reindexColumn(updatedStages);

      setStages((prev) => [
        ...prev.filter((s) => s.projectId !== stageToDelete.projectId),
        ...reindexedRemaining
      ]);

      touchProject(stageToDelete.projectId);
      showToast('Etapa Removida', 'A etapa foi excluída da mesa.', 'info');
      return true;
    },
    [stages, setStages, tasks, setTasks, touchProject, showToast]
  );

  const reorderStages = useCallback(
    (projectId: string, orderedIds: string[]) => {
      const projectStages = stages.filter((s) => s.projectId === projectId);
      const stageMap = new Map(projectStages.map((s) => [s.id, s]));

      const reordered: Stage[] = [];
      for (const stageId of orderedIds) {
        const found = stageMap.get(stageId);
        if (found) {
          reordered.push(found);
          stageMap.delete(stageId);
        }
      }
      // Any remaining stages appended
      for (const remaining of stageMap.values()) {
        reordered.push(remaining);
      }

      const reindexed = reindexColumn(reordered);

      setStages((prev) => [
        ...prev.filter((s) => s.projectId !== projectId),
        ...reindexed
      ]);

      touchProject(projectId);
      showToast('Ordem Salva', 'A sequência de etapas foi atualizada.');
    },
    [stages, setStages, touchProject, showToast]
  );

  const completeCurrentStage = useCallback(
    (
      projectId: string,
      opts?: { leftovers?: 'move_next' | 'park' | 'archive'; ignoreDecisions?: boolean }
    ): CompleteCurrentStageResult => {
      const currentStage = stages.find(
        (s) => s.projectId === projectId && s.status === 'atual'
      );
      if (!currentStage) {
        return { ok: false };
      }

      const openTasks = tasks.filter(
        (t) =>
          t.stageId === currentStage.id &&
          t.status !== 'concluida' &&
          t.status !== 'arquivada'
      );

      if (openTasks.length > 0 && !opts?.leftovers) {
        return {
          ok: false,
          reason: 'has_open_tasks',
          pendingTaskIds: openTasks.map((t) => t.id)
        };
      }

      // Check for pending decisions linked to this stage
      if (!opts?.ignoreDecisions && decisions) {
        const pendingDecisions = decisions.filter(
          (d) => d.stageId === currentStage.id && d.status === 'pendente'
        );
        if (pendingDecisions.length > 0) {
          return {
            ok: false,
            reason: 'pending_decisions',
            pendingDecisionIds: pendingDecisions.map((d) => d.id)
          };
        }
      }

      const projectStages = sortByOrder(stages.filter((s) => s.projectId === projectId));
      const currentIdx = projectStages.findIndex((s) => s.id === currentStage.id);
      const nextStage =
        currentIdx >= 0 && currentIdx + 1 < projectStages.length
          ? projectStages[currentIdx + 1]
          : undefined;

      const now = new Date().toISOString();

      // Handle leftovers if open tasks exist
      if (openTasks.length > 0 && opts?.leftovers) {
        if (opts.leftovers === 'move_next') {
          if (nextStage) {
            const nextStageTasks = tasks.filter((t) => t.stageId === nextStage.id);
            let nextOrderVal = nextOrder(nextStageTasks);
            setTasks((prev) =>
              prev.map((t) => {
                if (openTasks.some((ot) => ot.id === t.id)) {
                  return {
                    ...t,
                    stageId: nextStage.id,
                    order: nextOrderVal++
                  };
                }
                return t;
              })
            );
          } else {
            // No next stage, archive them
            setTasks((prev) =>
              prev.map((t) =>
                openTasks.some((ot) => ot.id === t.id)
                  ? {
                      ...t,
                      status: 'arquivada',
                      archivedAt: now,
                      archiveReason: 'Arquivado ao concluir a etapa'
                    }
                  : t
              )
            );
          }
        } else if (opts.leftovers === 'park') {
          const newIdeas: Idea[] = openTasks.map((t) => ({
            id: `idea-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            projectId,
            text: t.title,
            createdAt: now
          }));
          setIdeas((prev) => [...prev, ...newIdeas]);
          setTasks((prev) =>
            prev.map((t) =>
              openTasks.some((ot) => ot.id === t.id)
                ? {
                    ...t,
                    status: 'arquivada',
                    archivedAt: now,
                    archiveReason: 'Enviado ao Estacionamento'
                  }
                : t
            )
          );
        } else if (opts.leftovers === 'archive') {
          setTasks((prev) =>
            prev.map((t) =>
              openTasks.some((ot) => ot.id === t.id)
                ? {
                    ...t,
                    status: 'arquivada',
                    archivedAt: now,
                    archiveReason: 'Arquivado ao concluir a etapa'
                  }
                : t
            )
          );
        }
      }

      // Mark current stage completed and promote next stage if available
      setStages((prev) =>
        prev.map((s) => {
          if (s.id === currentStage.id) {
            return { ...s, status: 'concluida', completedAt: now };
          }
          if (nextStage && s.id === nextStage.id) {
            return { ...s, status: 'atual' };
          }
          return s;
        })
      );

      touchProject(projectId);
      showToast('Etapa Concluída!', `"${currentStage.title}" foi finalizada com sucesso!`, 'success');

      if (!nextStage) {
        return { ok: true, reason: 'no_next_stage' };
      }
      return { ok: true };
    },
    [stages, setStages, tasks, setTasks, setIdeas, touchProject, showToast, decisions]
  );

  const setCurrentStage = useCallback(
    (projectId: string, stageId: string) => {
      const projectStages = sortByOrder(stages.filter((s) => s.projectId === projectId));
      const currentIdx = projectStages.findIndex((s) => s.status === 'atual');
      const targetIdx = projectStages.findIndex((s) => s.id === stageId);

      if (targetIdx === -1 || currentIdx === -1 || targetIdx === currentIdx) {
        return;
      }

      const goingBack = targetIdx < currentIdx;
      const goingForwardOne = targetIdx === currentIdx + 1;

      if (!goingBack && !goingForwardOne) {
        showToast(
          'Transição Não Permitida',
          'Você só pode avançar uma etapa por vez ou retornar a uma etapa anterior.',
          'warning'
        );
        return;
      }

      const currentStageObj = projectStages[currentIdx];
      const currentStageTasks = tasks.filter((t) => t.stageId === currentStageObj.id);
      const allCurrentDone =
        currentStageTasks.length === 0 ||
        currentStageTasks.every((t) => t.status === 'concluida' || t.status === 'arquivada');

      const now = new Date().toISOString();

      setStages((prev) =>
        prev.map((s) => {
          if (s.id === stageId) {
            return { ...s, status: 'atual' };
          }
          if (s.id === currentStageObj.id) {
            if (goingBack) {
              return { ...s, status: 'futura' };
            }
            // goingForwardOne
            return allCurrentDone
              ? { ...s, status: 'concluida', completedAt: now }
              : { ...s, status: 'futura' };
          }
          return s;
        })
      );

      touchProject(projectId);
      showToast(
        'Etapa Atual Alterada',
        `Etapa ativa agora é "${projectStages[targetIdx].title}".`
      );
    },
    [stages, setStages, tasks, touchProject, showToast]
  );

  const addCard = useCallback(
    (stageId: string, partial: Partial<Task>): Task | null => {
      const stage = stages.find((s) => s.id === stageId);
      if (!stage) {
        return null;
      }

      const rules = getBoardRules(userProfile);
      const violation = canAddCard(tasks, stage, rules);
      if (violation) {
        showToast(`${violation.message} ${violation.hint}`, 'warning');
        return null;
      }

      const project = projects.find((p) => p.id === stage.projectId);
      const stageProntaTasks = tasks.filter(
        (t) => t.stageId === stageId && t.status === 'pronta'
      );
      const defaultOrder = nextOrder(stageProntaTasks);

      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: partial.title || 'Nova Tarefa',
        durationMinutes: partial.durationMinutes ?? 25,
        projectId: stage.projectId,
        projectName: project ? project.name : undefined,
        stageId,
        status: partial.status || 'pronta',
        expectedEvidence: partial.expectedEvidence ?? '',
        isNextPhysicalAction: partial.isNextPhysicalAction ?? false,
        order: partial.order ?? defaultOrder,
        createdAt: new Date().toISOString().split('T')[0],
        ...partial
      };

      setTasks((prev) => [...prev, newTask]);
      touchProject(stage.projectId);
      showToast('Cartão Criado', `"${newTask.title}" adicionado à etapa.`);
      return newTask;
    },
    [stages, projects, tasks, setTasks, touchProject, showToast, userProfile]
  );

  const setNextPhysicalAction = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      if (!task.projectId) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, isNextPhysicalAction: true } : t))
        );
        showToast('Próxima Ação Definida', `"${task.title}" marcada como próximo passo físico.`);
        return;
      }

      const projectId = task.projectId;
      setTasks((prev) =>
        prev.map((t) =>
          t.projectId === projectId
            ? { ...t, isNextPhysicalAction: t.id === taskId }
            : t
        )
      );

      const now = new Date().toISOString();
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, nextAction: task.title, lastActivityAt: now } : p
        )
      );

      showToast(
        'Próxima Ação Definida',
        `"${task.title}" é agora o próximo passo físico deste projeto.`
      );
    },
    [tasks, setTasks, setProjects, showToast]
  );

  const moveCard = useCallback(
    (
      taskId: string,
      destination: { status?: TaskStatus; stageId?: string; index?: number }
    ): boolean => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return false;

      const oldStatus = task.status;
      const newStatus = destination.status ?? oldStatus;
      const oldStageId = task.stageId;
      const newStageId = destination.stageId !== undefined ? destination.stageId : oldStageId;

      // Anti-over-planning check: moving into 'em_andamento'
      if (newStatus === 'em_andamento' && oldStatus !== 'em_andamento') {
        const targetStage =
          stages.find((s) => s.id === newStageId) ??
          stages.find((s) => s.id === oldStageId);
        if (targetStage) {
          const rules = getBoardRules(userProfile);
          const violation = canMoveToDoing(tasks, targetStage, rules, taskId);
          if (violation) {
            showToast(`${violation.message} ${violation.hint}`, 'warning');
            return false;
          }
        }
      }

      const now = new Date().toISOString();
      let startedAt = task.startedAt;
      let completedAt = task.completedAt;

      if (newStatus === 'em_andamento' && !startedAt) {
        startedAt = now;
      }
      if (newStatus === 'concluida') {
        completedAt = now;
      } else if (oldStatus === 'concluida') {
        completedAt = undefined;
      }

      const updatedTaskBase: Task = {
        ...task,
        stageId: newStageId,
        status: newStatus,
        startedAt,
        completedAt
      };

      const sourceColumn = sortByOrder(
        tasks.filter((t) => t.stageId === oldStageId && t.status === oldStatus)
      );
      const targetColumn = sortByOrder(
        tasks.filter(
          (t) =>
            t.stageId === newStageId &&
            t.status === newStatus &&
            t.id !== taskId
        )
      );

      let finalTasks: Task[];

      if (oldStageId === newStageId && oldStatus === newStatus) {
        const withoutTask = sourceColumn.filter((t) => t.id !== taskId);
        const reindexed = insertAt(withoutTask, updatedTaskBase, destination.index);
        finalTasks = tasks.map((t) => {
          const found = reindexed.find((ri) => ri.id === t.id);
          return found ?? t;
        });
      } else {
        const { source: reindexedSource, target: reindexedTarget } = moveBetweenColumns(
          sourceColumn,
          targetColumn,
          taskId,
          destination.index
        );
        const resolvedTarget = reindexedTarget.map((t) =>
          t.id === taskId ? { ...t, ...updatedTaskBase } : t
        );

        finalTasks = tasks.map((t) => {
          const inSource = reindexedSource.find((s) => s.id === t.id);
          if (inSource) return inSource;
          const inTarget = resolvedTarget.find((tgt) => tgt.id === t.id);
          if (inTarget) return inTarget;
          return t;
        });
      }

      // If moving into 'concluida' and was next physical action, promote next 'pronta' card
      if (oldStatus !== 'concluida' && newStatus === 'concluida') {
        showToast('Entrega Realizada', `"${task.title}" foi marcada como concluída!`, 'success');

        if (task.isNextPhysicalAction && task.projectId) {
          const projectId = task.projectId;
          // Find next pronta card in same stage, or in project
          let candidatePronta = finalTasks.filter(
            (t) =>
              t.projectId === projectId &&
              t.stageId === oldStageId &&
              t.status === 'pronta' &&
              t.id !== taskId
          );
          if (candidatePronta.length === 0) {
            candidatePronta = finalTasks.filter(
              (t) =>
                t.projectId === projectId &&
                t.status === 'pronta' &&
                t.id !== taskId
            );
          }
          const sortedCandidates = sortByOrder(candidatePronta);
          const nextActionTask = sortedCandidates[0];

          finalTasks = finalTasks.map((t) => {
            if (t.id === taskId) {
              return { ...t, isNextPhysicalAction: false };
            }
            if (nextActionTask && t.id === nextActionTask.id) {
              return { ...t, isNextPhysicalAction: true };
            }
            return t;
          });

          setProjects((prev) =>
            prev.map((p) =>
              p.id === projectId
                ? {
                    ...p,
                    nextAction: nextActionTask ? nextActionTask.title : '',
                    lastActivityAt: now
                  }
                : p
            )
          );
        }
      }

      setTasks(finalTasks);
      touchProject(task.projectId);
      return true;
    },
    [stages, tasks, setTasks, setProjects, touchProject, showToast, userProfile]
  );

  const addIdea = useCallback(
    (projectId: string, text: string): Idea => {
      const newIdea: Idea = {
        id: `idea-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        projectId,
        text,
        createdAt: new Date().toISOString()
      };
      setIdeas((prev) => [...prev, newIdea]);
      touchProject(projectId);
      showToast('Ideia Anotada', 'Ideia guardada no estacionamento para manter seu foco limpo.');
      return newIdea;
    },
    [setIdeas, touchProject, showToast]
  );

  const discardIdea = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      setIdeas((prev) =>
        prev.map((i) => (i.id === id ? { ...i, discardedAt: now } : i))
      );
      showToast('Ideia Descartada', 'Item arquivado do estacionamento.');
    },
    [setIdeas, showToast]
  );

  const restoreIdea = useCallback(
    (id: string) => {
      setIdeas((prev) =>
        prev.map((i) => (i.id === id ? { ...i, discardedAt: undefined } : i))
      );
      showToast('Ideia Restaurada', 'Ideia devolvida ao estacionamento ativo.');
    },
    [setIdeas, showToast]
  );

  const promoteIdea = useCallback(
    (id: string, stageId: string): Task | null => {
      const idea = ideas.find((i) => i.id === id);
      if (!idea) return null;

      const createdCard = addCard(stageId, { title: idea.text });
      if (createdCard) {
        setIdeas((prev) =>
          prev.map((i) => (i.id === id ? { ...i, promotedTaskId: createdCard.id } : i))
        );
        showToast('Ideia Promovida', 'A ideia se transformou em um cartão na mesa!');
      }
      return createdCard;
    },
    [ideas, setIdeas, addCard, showToast]
  );

  const deleteIdea = useCallback(
    (id: string) => {
      setIdeas((prev) => prev.filter((i) => i.id !== id));
      showToast('Ideia Excluída', 'Ideia removida do projeto.', 'info');
    },
    [setIdeas, showToast]
  );

  const splitCard = useCallback(
    (
      taskId: string,
      parts: { title: string; durationMinutes?: number; expectedEvidence?: string }[],
      archiveReason?: string
    ): boolean => {
      const validParts = parts.filter((p) => p.title && p.title.trim().length > 0);
      if (validParts.length < 2 || validParts.length > 4) {
        showToast('Dividir Cartão', 'Informe entre 2 e 4 partes com títulos válidos.', 'warning');
        return false;
      }

      const task = tasks.find((t) => t.id === taskId);
      if (!task || !task.stageId) {
        showToast('Erro', 'Cartão não encontrado.', 'warning');
        return false;
      }

      const stage = stages.find((s) => s.id === task.stageId);
      if (!stage) {
        showToast('Erro', 'Etapa não encontrada.', 'warning');
        return false;
      }

      const rules = getBoardRules(userProfile);

      // Validate resulting number of open cards against rules
      // (the original leaves the open count, so splitting one card into up to 4 must be allowed
      // as long as the final count does not exceed the limit).
      if (stage.status === 'atual') {
        const currentOpenCards = tasks.filter(
          (t) =>
            t.stageId === stage.id &&
            t.status !== 'concluida' &&
            t.status !== 'arquivada' &&
            t.id !== taskId
        );
        const finalOpenCount = currentOpenCards.length + validParts.length;
        if (finalOpenCount > rules.maxOpenCardsCurrentStage) {
          showToast(
            'Limite de cartões na etapa',
            `Dividir em ${validParts.length} partes ultrapassaria o limite de ${rules.maxOpenCardsCurrentStage} cartões abertos na etapa atual.`,
            'warning'
          );
          return false;
        }
      } else if (stage.status === 'futura') {
        const currentFutureCards = tasks.filter(
          (t) =>
            t.stageId === stage.id &&
            t.status !== 'arquivada' &&
            t.id !== taskId
        );
        const finalFutureCount = currentFutureCards.length + validParts.length;
        if (finalFutureCount > rules.maxCardsFutureStage) {
          showToast(
            'Limite de cartões na etapa futura',
            `Dividir em ${validParts.length} partes ultrapassaria o limite de ${rules.maxCardsFutureStage} cartões na etapa futura.`,
            'warning'
          );
          return false;
        }
      }

      const now = new Date().toISOString();
      const dateStr = now.split('T')[0];

      // Shift order of existing 'pronta' cards in this stage
      const existingStagePronta = sortByOrder(
        tasks.filter(
          (t) =>
            t.stageId === stage.id &&
            t.status === 'pronta' &&
            t.id !== taskId
        )
      );

      // Create new sub-cards at the TOP of 'A fazer'
      const newCards: Task[] = validParts.map((part, index) => ({
        id: `task-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
        title: part.title.trim(),
        durationMinutes: part.durationMinutes ?? 20,
        expectedEvidence: part.expectedEvidence?.trim() ?? '',
        status: 'pronta',
        stageId: stage.id,
        projectId: task.projectId,
        projectName: task.projectName,
        isNextPhysicalAction: index === 0,
        order: index + 1,
        createdAt: dateStr
      }));

      // Reindex existing ready cards so they come after new cards
      const reindexedExisting = existingStagePronta.map((t, idx) => ({
        ...t,
        order: validParts.length + 1 + idx,
        isNextPhysicalAction: false
      }));

      const existingMap = new Map(reindexedExisting.map((t) => [t.id, t]));

      setTasks((prev) => {
        const withoutOriginal = prev.map((t) => {
          if (t.id === taskId) {
            return {
              ...t,
              status: 'arquivada' as TaskStatus,
              archivedAt: now,
              archiveReason: 'Dividido em partes',
              isNextPhysicalAction: false
            };
          }
          if (task.projectId && t.projectId === task.projectId && t.isNextPhysicalAction) {
            return {
              ...t,
              isNextPhysicalAction: false
            };
          }
          const updatedExisting = existingMap.get(t.id);
          if (updatedExisting) {
            return updatedExisting;
          }
          return t;
        });

        return [...withoutOriginal, ...newCards];
      });

      if (task.projectId) {
        touchProject(task.projectId);
        setProjects((prev) =>
          prev.map((p) =>
            p.id === task.projectId
              ? { ...p, nextAction: newCards[0].title, lastActivityAt: now }
              : p
          )
        );
      }

      showToast(
        'Cartão Dividido',
        `"${task.title}" foi arquivado e dividido em ${validParts.length} ações menores no topo de "A fazer".`,
        'success'
      );
      return true;
    },
    [tasks, stages, userProfile, setTasks, setProjects, touchProject, showToast]
  );

  const createProjectWithMesa = useCallback(
    (input: CreateProjectWithMesaInput): string => {
      const now = new Date().toISOString();
      const dateStr = now.split('T')[0];
      const projectId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // 1. Create all stages
      const newStages: Stage[] = input.stages.map((stg, index) => ({
        id: `stage-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
        projectId,
        title: stg.title.trim(),
        doneCriteria: stg.doneCriteria.trim(),
        order: index + 1,
        status: index === 0 ? 'atual' : 'futura',
        createdAt: now
      }));

      // 2. Create all cards linked to their respective stage
      const newTasks: Task[] = [];
      let foundNextPhysicalAction = false;

      input.stages.forEach((stg, stageIdx) => {
        const stageObj = newStages[stageIdx];
        if (!stg.cards || stg.cards.length === 0) return;

        stg.cards.forEach((card, cardIdx) => {
          const isNext = Boolean(card.isNextPhysicalAction);
          if (isNext) foundNextPhysicalAction = true;

          newTasks.push({
            id: `task-${Date.now()}-${stageIdx}-${cardIdx}-${Math.random().toString(36).substring(2, 6)}`,
            title: card.title.trim(),
            durationMinutes: card.durationMinutes || 20,
            expectedEvidence: card.expectedEvidence?.trim() || '',
            status: 'pronta',
            stageId: stageObj.id,
            projectId,
            projectName: input.name.trim(),
            isNextPhysicalAction: isNext,
            order: cardIdx + 1,
            createdAt: dateStr
          });
        });
      });

      // If no card was specifically marked as next physical action, but cards exist, mark the first card
      if (!foundNextPhysicalAction && newTasks.length > 0) {
        newTasks[0].isNextPhysicalAction = true;
      }

      // Next action string for the project
      const nextPhysicalActionCard = newTasks.find((t) => t.isNextPhysicalAction) || newTasks[0];
      const nextActionTitle = nextPhysicalActionCard
        ? nextPhysicalActionCard.title
        : 'Definir o primeiro passo físico';

      // 3. Create project
      const newProject: Project = {
        id: projectId,
        name: input.name.trim(),
        desiredOutcome: input.desiredOutcome.trim(),
        deadline: input.deadline,
        priority: input.priority,
        status: input.status || 'ativo',
        lastActivityAt: now,
        nextAction: nextActionTitle,
        createdAt: dateStr,
        templateId: input.templateId
      };

      // 4. Batched atomic state update
      setProjects((prev) => [...prev, newProject]);
      setStages((prev) => [...prev, ...newStages]);
      setTasks((prev) => [...prev, ...newTasks]);

      showToast(
        'Mesa Criada!',
        `O projeto "${newProject.name}" e suas etapas foram organizados com sucesso.`,
        'success'
      );

      return projectId;
    },
    [setProjects, setStages, setTasks, showToast]
  );

  const importProcessIntoStage = useCallback(
    (
      processDoc: ProcessDoc,
      stageId: string
    ): { createdCount: number; parkedCount: number } => {
      const stage = stages.find((s) => s.id === stageId);
      if (!stage) {
        showToast('Erro ao Importar', 'Etapa não encontrada.', 'warning');
        return { createdCount: 0, parkedCount: 0 };
      }

      const project = projects.find((p) => p.id === stage.projectId);
      const rules = getBoardRules(userProfile);
      const expectedEvidence = shortenToOneSentence(processDoc.minimumStandard);
      const description = `Processo: ${processDoc.title}`;

      const createdCards: Task[] = [];
      const parkedIdeas: Idea[] = [];

      let runningTasks = [...tasks];
      const stageProntaTasks = runningTasks.filter(
        (t) => t.stageId === stageId && t.status === 'pronta'
      );
      let runningOrder = nextOrder(stageProntaTasks);

      const hasNextActionInProject = runningTasks.some(
        (t) => t.projectId === stage.projectId && t.isNextPhysicalAction
      );

      for (let i = 0; i < processDoc.steps.length; i++) {
        const step = processDoc.steps[i];
        const trimmed = step.trim();
        if (!trimmed) continue;
        const title = trimmed.length > 90 ? trimmed.slice(0, 90) : trimmed;

        const violation = canAddCard(runningTasks, stage, rules);
        if (!violation) {
          const isFirstCard = !hasNextActionInProject && createdCards.length === 0;
          const newCard: Task = {
            id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${i}`,
            title,
            durationMinutes: 15,
            projectId: stage.projectId,
            projectName: project ? project.name : undefined,
            stageId: stage.id,
            status: 'pronta',
            expectedEvidence,
            description,
            isNextPhysicalAction: isFirstCard,
            order: runningOrder++,
            createdAt: new Date().toISOString().split('T')[0]
          };
          createdCards.push(newCard);
          runningTasks.push(newCard);
        } else {
          const newIdea: Idea = {
            id: `idea-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${i}`,
            projectId: stage.projectId,
            text: trimmed,
            createdAt: new Date().toISOString()
          };
          parkedIdeas.push(newIdea);
        }
      }

      if (createdCards.length > 0) {
        setTasks((prev) => [...prev, ...createdCards]);
      }
      if (parkedIdeas.length > 0) {
        setIdeas((prev) => [...prev, ...parkedIdeas]);
      }

      touchProject(stage.projectId);

      if (parkedIdeas.length > 0) {
        showToast(
          'Processo Importado',
          `${createdCards.length} ${createdCards.length === 1 ? 'cartão criado' : 'cartões criados'} na etapa "${stage.title}". ${parkedIdeas.length} ${parkedIdeas.length === 1 ? 'passo foi estacionado' : 'passos foram estacionados'} como ideias porque o limite da etapa foi atingido.`,
          'warning'
        );
      } else {
        showToast(
          'Processo Importado',
          `${createdCards.length} ${createdCards.length === 1 ? 'cartão criado' : 'cartões criados'} na etapa "${stage.title}".`,
          'success'
        );
      }

      return {
        createdCount: createdCards.length,
        parkedCount: parkedIdeas.length
      };
    },
    [stages, projects, tasks, userProfile, setTasks, setIdeas, touchProject, showToast]
  );

  return {
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
  };
}
