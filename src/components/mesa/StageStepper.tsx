import React, { useState } from 'react';
import { Stage, Task } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Layers,
  Plus,
  CheckCircle2,
  MoreHorizontal,
  Edit2,
  Trash2,
  ArrowRightCircle,
  Flag,
  Workflow
} from 'lucide-react';
import { NewStageModal, EditStageModal, CompleteStageModal } from './StageModals';
import { StageDetailDialog } from './StageDetailDialog';

interface StageStepperProps {
  projectId: string;
  stages: Stage[];
  tasks: Task[];
  selectedStageId?: string;
  onSelectStage?: (stageId: string) => void;
}

export const StageStepper: React.FC<StageStepperProps> = ({
  projectId,
  stages,
  tasks,
  selectedStageId,
  onSelectStage
}) => {
  const { setCurrentStage, deleteStage } = useApp();
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [editStage, setEditStage] = useState<Stage | null>(null);
  const [detailStage, setDetailStage] = useState<Stage | null>(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [activeMenuStageId, setActiveMenuStageId] = useState<string | null>(null);

  const currentStage = stages.find((s) => s.status === 'atual');

  // Open tasks in current stage
  const currentStageOpenTasks = currentStage
    ? tasks.filter(
        (t) =>
          t.stageId === currentStage.id &&
          t.status !== 'concluida' &&
          t.status !== 'arquivada'
      ).length
    : 0;

  const handleStageClick = (stage: Stage) => {
    if (onSelectStage) {
      onSelectStage(stage.id);
    }
  };

  const handleDelete = (stage: Stage) => {
    setActiveMenuStageId(null);
    const stageTasks = tasks.filter((t) => t.stageId === stage.id && t.status !== 'arquivada');
    if (stageTasks.length > 0) {
      const confirmMove = window.confirm(
        `Esta etapa tem ${stageTasks.length} cartão(ões). Deseja excluí-la? Os cartões ficarão sem etapa atribuída.`
      );
      if (!confirmMove) return;
    } else {
      if (!window.confirm(`Excluir a etapa "${stage.title}"?`)) return;
    }
    deleteStage(stage.id);
  };

  return (
    <div className="space-y-4">
      {/* Header of the Roadmap section */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-[#D7FF3F]" />
          <h2 className="text-xl font-display font-bold text-white tracking-tight">
            Roadmap do Projeto
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-[#8D9298] text-xs font-semibold tabular-nums">
            {stages.length} {stages.length === 1 ? 'etapa' : 'etapas'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {currentStage && (
            <button
              onClick={() => setCompleteModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#D7FF3F] bg-[#D7FF3F]/15 hover:bg-[#D7FF3F]/25 border border-[#D7FF3F]/30 rounded-lg cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#D7FF3F]" />
              <span>Concluir etapa atual</span>
            </button>
          )}

          <button
            onClick={() => setNewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-lg cursor-pointer transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova etapa</span>
          </button>
        </div>
      </div>

      {stages.length === 0 ? (
        <div className="bg-[#16181D] border border-white/10 rounded-2xl p-8 text-center space-y-3 shadow-xl">
          <Layers className="w-8 h-8 text-[#8D9298] mx-auto" />
          <h3 className="text-base font-display font-bold text-white">
            Nenhuma etapa definida para este projeto
          </h3>
          <p className="text-sm text-[#8D9298] max-w-md mx-auto">
            O roadmap divide sua meta em etapas sequenciais com critérios claros de entrega.
          </p>
          <button
            onClick={() => setNewModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-lg cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Criar primeira etapa</span>
          </button>
        </div>
      ) : (
        /* Horizontally scrollable stepper with scroll-snap */
        <div className="relative">
          <div
            className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-thin"
            role="region"
            aria-label="Etapas do projeto"
          >
            {stages.map((stage, idx) => {
              const isAtual = stage.status === 'atual';
              const isConcluida = stage.status === 'concluida';
              const isSelected = selectedStageId === stage.id;

              const stageCards = tasks.filter(
                (t) => t.stageId === stage.id && t.status !== 'arquivada'
              );
              const doneCards = stageCards.filter((t) => t.status === 'concluida');
              const totalCards = stageCards.length;
              const progressPct =
                totalCards > 0
                  ? Math.round((doneCards.length / totalCards) * 100)
                  : isConcluida
                  ? 100
                  : 0;

              return (
                <div
                  key={stage.id}
                  onClick={() => handleStageClick(stage)}
                  className={`snap-start min-w-[280px] sm:min-w-[320px] max-w-[340px] shrink-0 rounded-2xl p-5 flex flex-col justify-between transition-all duration-150 cursor-pointer relative shadow-xl ${
                    isAtual
                      ? 'bg-[#16181D] border-2 border-[#D7FF3F] shadow-2xl ring-2 ring-[#D7FF3F]/20'
                      : isConcluida
                      ? 'bg-[#16181D] border border-white/15 hover:border-white/25'
                      : 'bg-[#16181D] border border-white/10 hover:border-white/20'
                  } ${isSelected && !isAtual ? 'ring-2 ring-white/30' : ''}`}
                >
                  {/* Top Row: Number, status badge & options menu */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isAtual
                              ? 'bg-[#D7FF3F] text-[#101114]'
                              : isConcluida
                              ? 'bg-white/10 text-white border border-white/15'
                              : 'bg-black/40 text-[#8D9298] border border-white/10'
                          }`}
                        >
                          {idx + 1}
                        </span>

                        {/* Status Badge */}
                        {isAtual && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#D7FF3F] text-[#101114] text-xs font-bold shadow-xs">
                            Atual
                          </span>
                        )}
                        {isConcluida && (
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/15 text-xs font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#D7FF3F]" />
                            <span>Concluída</span>
                          </span>
                        )}
                        {!isAtual && !isConcluida && (
                          <span className="px-2 py-0.5 rounded-full bg-black/40 text-[#8D9298] border border-white/10 text-xs font-medium">
                            {idx === 1 && stages[0]?.status === 'atual' ? 'Próxima' : 'Futura'}
                          </span>
                        )}
                      </div>

                      {/* Dropdown Menu Toggle */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuStageId(
                              activeMenuStageId === stage.id ? null : stage.id
                            );
                          }}
                          aria-label="Opções da etapa"
                          className="p-1 text-[#8D9298] hover:text-white hover:bg-white/10 rounded-md cursor-pointer transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {activeMenuStageId === stage.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1 w-44 bg-[#16181D] border border-white/15 rounded-xl shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                          >
                            {!isAtual && !isConcluida && (
                              <button
                                onClick={() => {
                                  setActiveMenuStageId(null);
                                  setCurrentStage(projectId, stage.id);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-[#F3F0EB] hover:bg-white/10 flex items-center gap-2 text-left cursor-pointer"
                              >
                                <ArrowRightCircle className="w-3.5 h-3.5 text-[#D7FF3F]" />
                                <span>Definir como atual</span>
                              </button>
                            )}

                            {isAtual && (
                              <button
                                onClick={() => {
                                  setActiveMenuStageId(null);
                                  setCompleteModalOpen(true);
                                }}
                                className="w-full px-3 py-1.5 text-xs font-bold text-[#D7FF3F] hover:bg-[#D7FF3F]/10 flex items-center gap-2 text-left cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#D7FF3F]" />
                                <span>Concluir etapa</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setActiveMenuStageId(null);
                                setDetailStage(stage);
                              }}
                              className="w-full px-3 py-1.5 text-xs text-[#F3F0EB] hover:bg-white/10 flex items-center gap-2 text-left cursor-pointer"
                            >
                              <Workflow className="w-3.5 h-3.5 text-[#D7FF3F]" />
                              <span>Detalhes e Processos</span>
                            </button>

                            <button
                              onClick={() => {
                                setActiveMenuStageId(null);
                                setEditStage(stage);
                              }}
                              className="w-full px-3 py-1.5 text-xs text-[#F3F0EB] hover:bg-white/10 flex items-center gap-2 text-left cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#8D9298]" />
                              <span>Editar etapa</span>
                            </button>

                            <button
                              onClick={() => handleDelete(stage)}
                              className="w-full px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 text-left cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span>Excluir etapa</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stage Title */}
                    <h3
                      className={`font-display font-bold text-base leading-snug ${
                        isAtual ? 'text-white' : 'text-white/90'
                      }`}
                    >
                      {stage.title}
                    </h3>

                    {/* Done Criteria (one-line) */}
                    <div className="text-xs text-[#8D9298] leading-relaxed bg-black/40 p-2.5 rounded-lg border border-white/10">
                      <span className="font-bold text-white block mb-0.5 flex items-center gap-1">
                        <Flag className="w-3 h-3 text-[#D7FF3F]" />
                        <span>Critério de entrega:</span>
                      </span>
                      <p className="line-clamp-2 text-[#8D9298]">{stage.doneCriteria}</p>
                    </div>
                  </div>

                  {/* Progress Bar & Card Count */}
                  <div className="pt-4 mt-3 border-t border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-[#8D9298]">
                      <span>Progresso</span>
                      <span className="font-semibold text-white tabular-nums">
                        {doneCards.length} de {totalCards} {totalCards === 1 ? 'cartão' : 'cartões'}
                      </span>
                    </div>

                    <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-white/10">
                      <div
                        className="h-full transition-all duration-300 rounded-full bg-[#D7FF3F]"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <NewStageModal
        isOpen={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        projectId={projectId}
      />

      <EditStageModal
        isOpen={Boolean(editStage)}
        onClose={() => setEditStage(null)}
        stage={editStage}
      />

      <StageDetailDialog
        isOpen={Boolean(detailStage)}
        onClose={() => setDetailStage(null)}
        stage={detailStage}
        projectId={projectId}
      />

      {currentStage && (
        <CompleteStageModal
          isOpen={completeModalOpen}
          onClose={() => setCompleteModalOpen(false)}
          projectId={projectId}
          stageTitle={currentStage.title}
          pendingTasksCount={currentStageOpenTasks}
        />
      )}
    </div>
  );
};
