import React, { useState, useMemo, useCallback } from 'react';
import { Project, Stage, Task, TaskStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { getBoardRules, canMoveToDoing, canAddCard } from '../../lib/boardRules';
import { sortByOrder } from '../../lib/boardUtils';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { motion, useReducedMotion } from 'motion/react';
import { StageBoardCard, COLUMN_DEFINITIONS, BoardColumnStatus } from './StageBoardCard';
import { UnblockDialog } from './UnblockDialog';
import { Plus, AlertTriangle, Lightbulb, X, HelpCircle } from 'lucide-react';

interface StageBoardProps {
  project: Project;
  stage: Stage;
  onOpenCard?: (task: Task, options?: { focus?: string }) => void;
}

const STATUS_NAME_MAP: Record<TaskStatus, string> = {
  pronta: 'A fazer',
  em_andamento: 'Fazendo',
  bloqueada: 'Travado',
  concluida: 'Feito',
  arquivada: 'Arquivada'
};

interface DroppableColumnProps {
  status: BoardColumnStatus;
  title: string;
  badge: React.ReactNode;
  isDoingColumn?: boolean;
  isFullDoing?: boolean;
  shake?: boolean;
  shouldReduceMotion?: boolean | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  status,
  title,
  badge,
  isDoingColumn,
  isFullDoing,
  shake,
  shouldReduceMotion,
  children,
  footer
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${status}`,
    data: {
      type: 'Column',
      status
    }
  });

  return (
    <motion.div
      animate={
        shake && !shouldReduceMotion
          ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
          : { x: 0 }
      }
      transition={{ duration: 0.35 }}
      className={`flex flex-col bg-[#16181D] border rounded-2xl p-3 sm:p-4 min-h-[420px] transition-all shadow-xl ${
        isDoingColumn && isFullDoing
          ? 'border-amber-500/40 ring-1 ring-amber-500/20'
          : 'border-white/10'
      } ${isOver ? 'ring-2 ring-[#D7FF3F]/50 bg-white/5' : ''}`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-2 border-b border-white/10">
        <h3 className="text-sm font-display font-bold text-white tracking-tight flex items-center gap-2">
          <span>{title}</span>
        </h3>
        <div>{badge}</div>
      </div>

      {/* Cards list droppable container */}
      <div
        ref={setNodeRef}
        className="flex-1 space-y-2.5 min-h-[120px] overflow-y-auto"
      >
        {children}
      </div>

      {/* Optional column footer (e.g. Quick Add) */}
      {footer && <div className="mt-3 pt-2 border-t border-white/10">{footer}</div>}
    </motion.div>
  );
};

export const StageBoard: React.FC<StageBoardProps> = ({
  project,
  stage,
  onOpenCard
}) => {
  const {
    userProfile,
    tasks,
    moveCard,
    updateTask,
    addCard,
    addIdea,
    showToast
  } = useApp();

  const rules = getBoardRules(userProfile);
  const shouldReduceMotion = useReducedMotion();

  // Active tab on mobile / small screens (<1024px)
  const [activeMobileTab, setActiveMobileTab] = useState<BoardColumnStatus>('pronta');

  // Currently dragged task for DragOverlay
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Light shake trigger on "Fazendo" column when WIP limit is violated
  const [shakeDoing, setShakeDoing] = useState(false);

  // Inline reason dialog for 'bloqueada'
  const [pendingBlock, setPendingBlock] = useState<{
    task: Task;
    targetIndex?: number;
  } | null>(null);
  const [blockReason, setBlockReason] = useState('');

  // Quick add state in "A fazer"
  const [quickAddText, setQuickAddText] = useState('');
  const [quickAddViolation, setQuickAddViolation] = useState<{
    message: string;
    hint: string;
  } | null>(null);

  // Setup DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 6
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Tasks in this stage, excluding 'arquivada'
  const stageTasks = useMemo(() => {
    return tasks.filter(
      (t) => t.stageId === stage.id && t.status !== 'arquivada'
    );
  }, [tasks, stage.id]);

  // Tasks grouped and sorted by status
  const cardsByStatus: Record<BoardColumnStatus, Task[]> = useMemo(() => {
    const pronta = sortByOrder(stageTasks.filter((t) => t.status === 'pronta'));
    const em_andamento = sortByOrder(
      stageTasks.filter((t) => t.status === 'em_andamento')
    );
    const bloqueada = sortByOrder(
      stageTasks.filter((t) => t.status === 'bloqueada')
    );
    const concluida = sortByOrder(
      stageTasks.filter((t) => t.status === 'concluida')
    );

    return { pronta, em_andamento, bloqueada, concluida };
  }, [stageTasks]);

  const triggerDoingShake = useCallback(() => {
    setShakeDoing(true);
    setTimeout(() => setShakeDoing(false), 450);
  }, []);

  // Central movement validation and execution handler (shared by drag and "Mover para..." menu)
  const executeCardMove = useCallback(
    (
      task: Task,
      targetStatus: TaskStatus,
      targetIndex?: number
    ): boolean => {
      // 1. Moving to 'em_andamento'
      if (targetStatus === 'em_andamento' && task.status !== 'em_andamento') {
        const violation = canMoveToDoing(tasks, stage, rules, task.id);
        if (violation) {
          triggerDoingShake();
          showToast('Limite de trabalho em andamento', `${violation.message} ${violation.hint}`, 'warning');
          return false;
        }
      }

      // 2. Moving to 'concluida'
      if (targetStatus === 'concluida') {
        if (!task.expectedEvidence || !task.expectedEvidence.trim()) {
          // Do not complete; focus on evidence drawer / dialog
          onOpenCard?.(task, { focus: 'evidence' });
          showToast(
            'Evidência necessária',
            'Defina o critério de conclusão antes de marcar como feito.',
            'warning'
          );
          return false;
        }
      }

      // 3. Moving to 'bloqueada'
      if (targetStatus === 'bloqueada') {
        setPendingBlock({ task, targetIndex });
        setBlockReason(task.blockedReason || '');
        return true;
      }

      // Standard move
      return moveCard(task.id, {
        status: targetStatus,
        stageId: stage.id,
        index: targetIndex
      });
    },
    [tasks, stage, rules, triggerDoingShake, showToast, onOpenCard, moveCard]
  );

  const confirmBlock = useCallback(() => {
    if (!pendingBlock || !blockReason.trim()) return;

    moveCard(pendingBlock.task.id, {
      status: 'bloqueada',
      stageId: stage.id,
      index: pendingBlock.targetIndex
    });
    updateTask(pendingBlock.task.id, {
      blockedReason: blockReason.trim()
    });
    showToast(
      'Ação travada registrada',
      'Impedimento salvo com sucesso.',
      'info'
    );
    setPendingBlock(null);
    setBlockReason('');
  }, [pendingBlock, blockReason, moveCard, stage.id, updateTask, showToast]);

  const cancelBlock = useCallback(() => {
    setPendingBlock(null);
    setBlockReason('');
  }, []);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = stageTasks.find((t) => t.id === event.active.id);
      setActiveTask(task || null);
    },
    [stageTasks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const activeTaskId = String(active.id);
      const draggedTask = stageTasks.find((t) => t.id === activeTaskId);
      if (!draggedTask) return;

      const overId = String(over.id);

      let targetStatus: BoardColumnStatus;
      let targetIndex: number | undefined;

      if (overId.startsWith('col-')) {
        targetStatus = overId.replace('col-', '') as BoardColumnStatus;
        targetIndex = undefined;
      } else {
        const overTask = stageTasks.find((t) => t.id === overId);
        if (overTask && overTask.status !== 'arquivada') {
          targetStatus = overTask.status as BoardColumnStatus;
          const targetCol = cardsByStatus[targetStatus];
          const foundIdx = targetCol.findIndex((t: Task) => t.id === overId);
          targetIndex = foundIdx >= 0 ? foundIdx : undefined;
        } else {
          return;
        }
      }

      executeCardMove(draggedTask, targetStatus, targetIndex);
    },
    [stageTasks, cardsByStatus, executeCardMove]
  );

  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
  }, []);

  // Quick add submission in "A fazer"
  const handleQuickAddSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const text = quickAddText.trim();
      if (!text) return;

      const violation = canAddCard(tasks, stage, rules);
      if (violation) {
        setQuickAddViolation({
          message: violation.message,
          hint: violation.hint
        });
        return;
      }

      setQuickAddViolation(null);
      addCard(stage.id, {
        title: text,
        durationMinutes: 20,
        expectedEvidence: '',
        projectId: project.id,
        projectName: project.name
      });
      setQuickAddText('');
    },
    [quickAddText, tasks, stage, rules, addCard, project]
  );

  const handleSaveAsIdea = useCallback(() => {
    if (!quickAddText.trim()) return;
    addIdea(project.id, quickAddText.trim());
    setQuickAddText('');
    setQuickAddViolation(null);
  }, [quickAddText, addIdea, project.id]);

  const doingCount = cardsByStatus.em_andamento.length;
  const isFullDoing = doingCount >= rules.wipDoing;

  // Accessibility screen reader announcements
  const accessibilityAnnouncements = useMemo(() => {
    return {
      onDragStart({ active }: DragStartEvent) {
        const t = stageTasks.find((item) => item.id === active.id);
        const colName = t ? STATUS_NAME_MAP[t.status] : 'desconhecida';
        return `Cartão "${t?.title || active.id}" selecionado. Posição inicial: coluna ${colName}.`;
      },
      onDragOver({ over }: { over: DragEndEvent['over'] }) {
        if (!over) return '';
        const overId = String(over.id);
        const col = overId.startsWith('col-')
          ? STATUS_NAME_MAP[overId.replace('col-', '') as TaskStatus]
          : 'um cartão';
        return `Movendo sobre ${col}.`;
      },
      onDragEnd({ over }: DragEndEvent) {
        if (!over) return 'Movimento cancelado.';
        return 'Cartão solto. Nova posição definida.';
      },
      onDragCancel() {
        return 'Movimento cancelado. Cartão retornou à posição inicial.';
      }
    };
  }, [stageTasks]);

  return (
    <div className="space-y-4">
      {/* Mobile Segmented Control (Tabs) <1024px */}
      <div className="lg:hidden">
        <div
          role="tablist"
          aria-label="Colunas da etapa"
          className="grid grid-cols-4 p-1 bg-black/40 border border-white/10 rounded-xl gap-1 text-xs"
        >
          {COLUMN_DEFINITIONS.map((col) => {
            const isSelected = activeMobileTab === col.status;
            const count =
              col.status === 'em_andamento'
                ? `${cardsByStatus.em_andamento.length}/${rules.wipDoing}`
                : cardsByStatus[col.status].length;

            return (
              <button
                key={col.status}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveMobileTab(col.status)}
                className={`py-2 px-1 text-center font-bold rounded-lg cursor-pointer transition-colors truncate ${
                  isSelected
                    ? 'bg-[#D7FF3F] text-[#101114] shadow-xs'
                    : 'text-[#8D9298] hover:text-white'
                }`}
              >
                <span>{col.title}</span>
                <span className="ml-1 opacity-75 tabular-nums">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DndContext Wrapping Columns */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        accessibility={{
          announcements: accessibilityAnnouncements
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          {/* COLUMN 1: A fazer (pronta) */}
          <div className={`${activeMobileTab !== 'pronta' ? 'hidden lg:block' : ''}`}>
            <SortableContext
              items={cardsByStatus.pronta.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <DroppableColumn
                status="pronta"
                title="A fazer"
                badge={
                  <span className="px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-[#8D9298] text-xs font-semibold tabular-nums">
                    {cardsByStatus.pronta.length}
                  </span>
                }
                footer={
                  <div className="space-y-2">
                    <form onSubmit={handleQuickAddSubmit}>
                      <input
                        type="text"
                        placeholder="Novo cartão… (Enter)"
                        value={quickAddText}
                        onChange={(e) => {
                          setQuickAddText(e.target.value);
                          if (quickAddViolation) setQuickAddViolation(null);
                        }}
                        className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white placeholder:text-[#8D9298]/50 focus:outline-none focus:border-[#D7FF3F]"
                      />
                    </form>

                    {quickAddViolation && (
                      <div className="p-2.5 bg-amber-950/40 border border-amber-800/40 rounded-xl space-y-2 animate-in fade-in duration-150">
                        <div className="flex items-start gap-1.5 text-xs text-amber-300 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{quickAddViolation.message}</span>
                        </div>
                        <p className="text-[11px] text-amber-200/80">
                          {quickAddViolation.hint}
                        </p>
                        <button
                          type="button"
                          onClick={handleSaveAsIdea}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-lg cursor-pointer transition-colors"
                        >
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>Guardar como ideia</span>
                        </button>
                      </div>
                    )}
                  </div>
                }
              >
                {cardsByStatus.pronta.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#8D9298]/50">
                    Nenhum cartão a fazer
                  </div>
                ) : (
                  cardsByStatus.pronta.map((task) => (
                    <StageBoardCard
                      key={task.id}
                      task={task}
                      onOpenCard={onOpenCard}
                      onMoveToStatus={(t, s) => executeCardMove(t, s)}
                    />
                  ))
                )}
              </DroppableColumn>
            </SortableContext>
          </div>

          {/* COLUMN 2: Fazendo (em_andamento) */}
          <div className={`${activeMobileTab !== 'em_andamento' ? 'hidden lg:block' : ''}`}>
            <SortableContext
              items={cardsByStatus.em_andamento.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <DroppableColumn
                status="em_andamento"
                title="Fazendo"
                isDoingColumn
                isFullDoing={isFullDoing}
                shake={shakeDoing}
                shouldReduceMotion={shouldReduceMotion}
                badge={
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold tabular-nums transition-colors ${
                      isFullDoing
                        ? 'bg-amber-950/50 text-amber-300 border border-amber-800/50'
                        : 'bg-black/40 text-[#8D9298] border border-white/10'
                    }`}
                  >
                    {doingCount}/{rules.wipDoing}
                  </span>
                }
              >
                {cardsByStatus.em_andamento.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#8D9298]/50">
                    Nenhum cartão em andamento
                  </div>
                ) : (
                  cardsByStatus.em_andamento.map((task) => (
                    <StageBoardCard
                      key={task.id}
                      task={task}
                      onOpenCard={onOpenCard}
                      onMoveToStatus={(t, s) => executeCardMove(t, s)}
                    />
                  ))
                )}
              </DroppableColumn>
            </SortableContext>
          </div>

          {/* COLUMN 3: Travado (bloqueada) */}
          <div id="column-bloqueada" className={`${activeMobileTab !== 'bloqueada' ? 'hidden lg:block' : ''}`}>
            <SortableContext
              items={cardsByStatus.bloqueada.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <DroppableColumn
                status="bloqueada"
                title="Travado"
                badge={
                  <span className="px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-[#8D9298] text-xs font-semibold tabular-nums">
                    {cardsByStatus.bloqueada.length}
                  </span>
                }
              >
                {cardsByStatus.bloqueada.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#8D9298]/50">
                    Nenhum cartão travado
                  </div>
                ) : (
                  cardsByStatus.bloqueada.map((task) => (
                    <StageBoardCard
                      key={task.id}
                      task={task}
                      onOpenCard={onOpenCard}
                      onMoveToStatus={(t, s) => executeCardMove(t, s)}
                    />
                  ))
                )}
              </DroppableColumn>
            </SortableContext>
          </div>

          {/* COLUMN 4: Feito (concluida) */}
          <div className={`${activeMobileTab !== 'concluida' ? 'hidden lg:block' : ''}`}>
            <SortableContext
              items={cardsByStatus.concluida.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <DroppableColumn
                status="concluida"
                title="Feito"
                badge={
                  <span className="px-2 py-0.5 rounded-full bg-[#D7FF3F]/15 border border-[#D7FF3F]/30 text-[#D7FF3F] text-xs font-bold tabular-nums">
                    {cardsByStatus.concluida.length}
                  </span>
                }
              >
                {cardsByStatus.concluida.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#8D9298]/50">
                    Nenhum cartão concluído
                  </div>
                ) : (
                  cardsByStatus.concluida.map((task) => (
                    <StageBoardCard
                      key={task.id}
                      task={task}
                      onOpenCard={onOpenCard}
                      onMoveToStatus={(t, s) => executeCardMove(t, s)}
                    />
                  ))
                )}
              </DroppableColumn>
            </SortableContext>
          </div>
        </div>

        {/* Drag Overlay for active dragged card */}
        <DragOverlay>
          {activeTask ? (
            <StageBoardCard task={activeTask} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Guided Unblock Dialog when dropped or moved to 'bloqueada' */}
      {pendingBlock && (
        <UnblockDialog
          isOpen={Boolean(pendingBlock)}
          onClose={() => setPendingBlock(null)}
          task={pendingBlock.task}
          project={project}
          stage={stage}
          onSuccess={() => setPendingBlock(null)}
        />
      )}
    </div>
  );
};
