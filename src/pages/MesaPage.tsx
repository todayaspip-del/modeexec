import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useQueryParams } from '../lib/router';
import { ArrowLeft, FolderX, Workflow, LayoutDashboard } from 'lucide-react';
import { MacDesktop } from '../components/common/MacDesktop';
import { ProjectHeader } from '../components/mesa/ProjectHeader';
import { FocusBanner } from '../components/mesa/FocusBanner';
import { StageStepper } from '../components/mesa/StageStepper';
import { StageBoard } from '../components/mesa/StageBoard';
import { CardDrawer } from '../components/mesa/CardDrawer';
import { IdeaParking } from '../components/mesa/IdeaParking';
import { NewCardModal } from '../components/mesa/NewCardModal';
import { StageDetailDialog } from '../components/mesa/StageDetailDialog';
import { Task } from '../types';

interface MesaPageProps {
  projectId: string;
}

export const MesaPage: React.FC<MesaPageProps> = ({ projectId }) => {
  const { projects, stages, tasks, navigateTo } = useApp();
  const queryParams = useQueryParams();
  const cardIdFromUrl = queryParams.get('cartao');

  const [newCardModalOpen, setNewCardModalOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string | undefined>(undefined);
  const [drawerOpenCardId, setDrawerOpenCardId] = useState<string | null>(cardIdFromUrl);
  const [drawerFocusField, setDrawerFocusField] = useState<'evidence' | undefined>(undefined);
  const [mobileIdeasOpen, setMobileIdeasOpen] = useState(false);
  const [stageDetailOpen, setStageDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'mac-desktop' | 'classic'>('mac-desktop');

  const project = projects.find((p) => p.id === projectId);

  useEffect(() => {
    const handleOpenMobile = () => setMobileIdeasOpen(true);
    window.addEventListener('open-ideas-mobile', handleOpenMobile);
    return () => window.removeEventListener('open-ideas-mobile', handleOpenMobile);
  }, []);

  // Sync drawer state with URL search param
  useEffect(() => {
    if (cardIdFromUrl) {
      setDrawerOpenCardId(cardIdFromUrl);
    } else {
      setDrawerOpenCardId(null);
    }
  }, [cardIdFromUrl]);

  const handleOpenCard = useCallback((task: Task, options?: { focus?: string }) => {
    setDrawerOpenCardId(task.id);
    setDrawerFocusField(options?.focus === 'evidence' ? 'evidence' : undefined);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('cartao', task.id);
      window.history.pushState({}, '', url.pathname + url.search);
    }
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpenCardId(null);
    setDrawerFocusField(undefined);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('cartao');
      const nextUrl = url.pathname + (url.search ? url.search : '');
      window.history.pushState({}, '', nextUrl);
    }
  }, []);

  if (!project) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="bg-[#16181D] border border-white/10 rounded-2xl p-8 sm:p-12 space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#8D9298]">
            <FolderX className="w-6 h-6 text-[#D7FF3F]" />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">
            Não encontramos esse projeto
          </h1>
          <p className="text-sm text-[#8D9298] max-w-md mx-auto">
            O projeto solicitado pode ter sido excluído ou o identificador informado está incorreto.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigateTo('/app/projetos')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-[#D7FF3F] text-[#101114] hover:bg-white transition-colors cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para Projetos</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Stages for this project sorted by order
  const projectStages = stages
    .filter((s) => s.projectId === project.id)
    .sort((a, b) => a.order - b.order);

  const currentStage = projectStages.find((s) => s.status === 'atual');

  const activeStageForCards =
    projectStages.find((s) => s.id === selectedStageId) || currentStage;

  if (viewMode === 'mac-desktop') {
    return (
      <MacDesktop
        project={project}
        projectId={project.id}
        onSwitchToClassic={() => setViewMode('classic')}
      />
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Section A: ProjectHeader */}
      <ProjectHeader
        project={project}
        stages={projectStages}
        tasks={tasks}
        onOpenIdeaParking={() => setMobileIdeasOpen(true)}
      />

      {/* Main Board Layout with Sticky Ideas Parking at >= 1280px */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-6 sm:space-y-8 w-full">
          {/* Section B: FocusBanner ("Faça agora") */}
          <FocusBanner
            project={project}
            currentStage={currentStage}
            tasks={tasks}
            onAddNewCard={() => setNewCardModalOpen(true)}
            onOpenCard={handleOpenCard}
          />

          {/* Section C: StageStepper (Roadmap) */}
          <StageStepper
            projectId={project.id}
            stages={projectStages}
            tasks={tasks}
            selectedStageId={selectedStageId || currentStage?.id}
            onSelectStage={(id) => setSelectedStageId(id)}
          />

          {/* Section D: StageBoard (Kanban da etapa) */}
          {activeStageForCards && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-white font-display tracking-tight">
                    Quadro da Etapa: {activeStageForCards.title}
                  </h2>
                  {activeStageForCards.status === 'atual' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#D7FF3F] text-[#101114] text-xs font-extrabold shadow-sm">
                      Etapa Atual
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('mac-desktop')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg cursor-pointer transition-colors shadow-sm"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#D7FF3F]" />
                    <span>Workspace Mac (Trello)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStageDetailOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#16181D] hover:bg-white/10 border border-white/15 rounded-lg cursor-pointer transition-colors shadow-sm"
                  >
                    <Workflow className="w-3.5 h-3.5 text-[#D7FF3F]" />
                    <span>Detalhes & Processos</span>
                  </button>
                </div>
              </div>

              <StageBoard
                project={project}
                stage={activeStageForCards}
                onOpenCard={handleOpenCard}
              />
            </div>
          )}
        </div>

        {/* Section E: IdeaParking (Estacionamento de Ideias) */}
        <IdeaParking
          project={project}
          stages={projectStages}
          isMobileOpen={mobileIdeasOpen}
          onCloseMobile={() => setMobileIdeasOpen(false)}
        />
      </div>

      {/* Stage Detail & Process Modal */}
      {activeStageForCards && (
        <StageDetailDialog
          isOpen={stageDetailOpen}
          onClose={() => setStageDetailOpen(false)}
          stage={activeStageForCards}
          projectId={project.id}
        />
      )}

      {/* Quick card modal */}
      {activeStageForCards && (
        <NewCardModal
          isOpen={newCardModalOpen}
          onClose={() => setNewCardModalOpen(false)}
          stageId={activeStageForCards.id}
          projectId={project.id}
          projectName={project.name}
        />
      )}

      {/* Card Detail Drawer */}
      <CardDrawer
        task={
          drawerOpenCardId
            ? tasks.find((t) => t.id === drawerOpenCardId) || null
            : null
        }
        stage={
          drawerOpenCardId
            ? stages.find(
                (s) =>
                  s.id ===
                  tasks.find((t) => t.id === drawerOpenCardId)?.stageId
              ) || activeStageForCards
            : activeStageForCards
        }
        isOpen={Boolean(
          drawerOpenCardId && tasks.some((t) => t.id === drawerOpenCardId)
        )}
        onClose={handleCloseDrawer}
        initialFocusField={drawerFocusField}
      />
    </div>
  );
};
