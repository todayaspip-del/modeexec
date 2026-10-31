import React, { useState } from 'react';
import { Project, Stage, Task } from '../../types';
import { useApp } from '../../context/AppContext';
import { sortByOrder } from '../../lib/boardUtils';
import { Clock, FileCheck2, CheckCircle2, AlertCircle, Plus, CheckSquare } from 'lucide-react';

interface FocusBannerProps {
  project: Project;
  currentStage: Stage | undefined;
  tasks: Task[];
  onAddNewCard?: () => void;
  onOpenCard?: (task: Task) => void;
}

import { UnblockDialog } from './UnblockDialog';

export const FocusBanner: React.FC<FocusBannerProps> = ({
  project,
  currentStage,
  tasks,
  onAddNewCard,
  onOpenCard
}) => {
  const { moveCard, showToast } = useApp();
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);

  // 1. Check if the project has an active card flagged as isNextPhysicalAction
  const projectActiveTasks = tasks.filter(
    (t) => t.projectId === project.id && t.status !== 'concluida' && t.status !== 'arquivada'
  );

  let focusCard: Task | undefined = projectActiveTasks.find((t) => t.isNextPhysicalAction);

  // 2. If not, pick the first 'pronta' card of the current stage by order
  if (!focusCard && currentStage) {
    const stageReadyCards = sortByOrder(
      projectActiveTasks.filter(
        (t) => t.stageId === currentStage.id && t.status === 'pronta'
      )
    );
    if (stageReadyCards.length > 0) {
      focusCard = stageReadyCards[0];
    }
  }

  // 3. Fallback: check if there's an 'em_andamento' card in current stage or project
  if (!focusCard && currentStage) {
    const stageDoingCards = projectActiveTasks.filter(
      (t) => t.stageId === currentStage.id && t.status === 'em_andamento'
    );
    if (stageDoingCards.length > 0) {
      focusCard = stageDoingCards[0];
    }
  }

  // 4. Fallback: any ready card in the project
  if (!focusCard) {
    const anyReady = sortByOrder(projectActiveTasks.filter((t) => t.status === 'pronta'));
    if (anyReady.length > 0) {
      focusCard = anyReady[0];
    }
  }

  const handleComplete = () => {
    if (!focusCard) return;
    moveCard(focusCard.id, { status: 'concluida' });
    showToast(
      'Cartão concluído!',
      `"${focusCard.title}" foi concluído com sucesso.`,
      'success'
    );
  };

  if (!focusCard) {
    return (
      <section
        className="bg-[#16181D] border border-white/10 text-white rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl"
        aria-label="Faça agora"
      >
        <div className="flex items-center justify-between">
          <span className="inline-block px-3 py-1 rounded-full bg-[#D7FF3F] text-[#101114] text-xs sm:text-sm font-bold uppercase tracking-wider">
            Faça agora
          </span>
          <span className="text-xs text-[#8D9298]">
            {currentStage ? `Etapa: ${currentStage.title}` : 'Sem etapa ativa'}
          </span>
        </div>

        <div className="space-y-1.5 py-2">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
            Escolha o próximo cartão ou crie um novo.
          </h2>
          <p className="text-sm text-[#8D9298] max-w-xl">
            {currentStage
              ? `Não há cartões prontos na etapa atual (${currentStage.title}). Defina a próxima ação física para começar.`
              : 'Defina a etapa atual do projeto para avançar.'}
          </p>
        </div>

        {onAddNewCard && currentStage && (
          <div className="pt-2">
            <button
              onClick={onAddNewCard}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-[#101114] bg-[#D7FF3F] hover:bg-[#c2ef26] rounded-xl cursor-pointer transition-colors shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Criar cartão na etapa atual</span>
            </button>
          </div>
        )}
      </section>
    );
  }

  return (
    <section
      className="bg-[#16181D] border border-white/10 text-white rounded-2xl p-6 sm:p-7 space-y-5 shadow-xl relative overflow-hidden"
      aria-label="Faça agora"
    >
      <div className="absolute top-0 right-0 w-64 h-32 bg-[#D7FF3F]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-wrap items-center justify-between gap-2 relative z-10">
        <span className="inline-block px-3 py-1 rounded-full bg-[#D7FF3F] text-[#101114] text-xs sm:text-sm font-bold uppercase tracking-wider">
          Faça agora
        </span>
        {currentStage && (
          <span className="text-xs text-[#8D9298] bg-black/40 border border-white/10 px-3 py-1 rounded-full">
            Etapa: {currentStage.title}
          </span>
        )}
      </div>

      <h2 className="relative z-10">
        <button
          type="button"
          onClick={() => onOpenCard?.(focusCard)}
          className="text-left text-2xl sm:text-3xl font-display font-bold text-white text-balance leading-snug hover:text-[#D7FF3F] transition-colors cursor-pointer"
        >
          {focusCard.title}
        </button>
      </h2>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#F3F0EB] relative z-10">
        <span className="inline-flex items-center gap-2 tabular-nums">
          <Clock className="w-4 h-4 text-[#D7FF3F]" />
          {focusCard.durationMinutes} minutos
        </span>
        {(focusCard.expectedEvidence || focusCard.evidenceNote) && (
          <span className="inline-flex items-start gap-2 text-[#8D9298]">
            <FileCheck2 className="w-4 h-4 text-[#D7FF3F] mt-0.5 shrink-0" />
            <span>Termina quando: <span className="text-[#F3F0EB]">{focusCard.expectedEvidence || focusCard.evidenceNote}</span></span>
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-1 relative z-10">
        <button
          onClick={handleComplete}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 font-bold text-[#101114] bg-[#D7FF3F] hover:bg-[#c2ef26] rounded-xl cursor-pointer transition-colors shadow-lg"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Concluir</span>
        </button>
        <button
          onClick={() => setUnblockDialogOpen(true)}
          className="px-5 py-3.5 text-sm font-semibold border border-white/15 text-white hover:bg-white/5 rounded-xl cursor-pointer transition-colors text-center"
        >
          Estou travado nesta
        </button>
      </div>

      {unblockDialogOpen && focusCard && (
        <UnblockDialog
          isOpen={unblockDialogOpen}
          onClose={() => setUnblockDialogOpen(false)}
          task={focusCard}
          project={project}
          stage={currentStage}
        />
      )}
    </section>
  );
};
