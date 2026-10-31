import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ProjectStatus } from '../types';
import { Plus, Calendar, FolderKanban, ArrowRight } from 'lucide-react';
import { NewProjectModal } from '../components/modals/NewItemModals';
import { getIdleDays } from '../lib/projectUtils';
import { getBoardRules } from '../lib/boardRules';
import { getActiveProjectsProgress } from '../lib/selectors';

const TABS: { id: 'all' | ProjectStatus; label: string }[] = [
  { id: 'ativo', label: 'Ativos' }, { id: 'pausado', label: 'Pausados' },
  { id: 'concluido', label: 'Concluídos' }, { id: 'cancelado', label: 'Cancelados' }, { id: 'all', label: 'Todos' }
];
const STATUS_LABEL: Record<ProjectStatus, string> = { ativo: 'Ativo', pausado: 'Pausado', concluido: 'Concluído', cancelado: 'Cancelado' };

export const ProjectsPage: React.FC = () => {
  const { userProfile, projects, stages, tasks, updateProject, deleteProject, navigateTo } = useApp();
  const [filter, setFilter] = useState<'all' | ProjectStatus>('ativo');
  const [modalOpen, setModalOpen] = useState(false);

  const projectsProgress = useMemo(
    () => getActiveProjectsProgress(projects, stages, tasks),
    [projects, stages, tasks]
  );

  const limit = getBoardRules(userProfile).maxActiveProjects;
  const activeCount = projects.filter((p) => p.status === 'ativo').length;
  const overLimit = activeCount > limit;
  const list = projects
    .filter((p) => filter === 'all' || p.status === filter)
    .sort((a, b) => getIdleDays(b) - getIdleDays(a));

  const btn = 'px-3.5 py-2 text-sm font-semibold rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white cursor-pointer transition-colors';

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-display">Projetos</h1>
          <p className="text-[#8D9298] mt-1">Cada projeto precisa de um resultado claro e de uma próxima ação física.</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl cursor-pointer shrink-0 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Novo projeto
        </button>
      </div>

      {/* Limite de foco */}
      <div className={`rounded-2xl p-5 border text-white ${overLimit ? 'bg-amber-950/20 border-amber-500/30' : 'bg-[#16181D] border-white/10'}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="font-bold text-lg tabular-nums font-display">{activeCount} de {limit} projetos ativos</div>
          <div className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: Math.max(limit, activeCount) }, (_, i) => (
              <span key={i} className={`w-8 h-2 rounded-full ${i < activeCount ? (i >= limit ? 'bg-amber-400' : 'bg-[#D7FF3F]') : 'bg-white/10'}`} />
            ))}
          </div>
        </div>
        <p className="text-sm text-[#8D9298] mt-2">
          {overLimit
            ? `Você tem ${activeCount - limit} projeto${activeCount - limit > 1 ? 's' : ''} acima do limite. Pause o que não é para agora e o foco volta.`
            : 'Poucos projetos ativos aumentam a chance de terminar cada um.'}
        </p>
      </div>

      <div role="tablist" aria-label="Filtrar projetos" className="inline-flex flex-wrap p-1 bg-[#16181D] border border-white/10 rounded-xl">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={filter === t.id} onClick={() => setFilter(t.id)}
            className={`px-3.5 py-1.5 text-sm rounded-lg cursor-pointer transition-colors ${filter === t.id ? 'bg-[#D7FF3F] text-[#101114] font-bold shadow-xs' : 'text-[#8D9298] hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="p-10 text-center bg-[#16181D] border border-white/10 rounded-2xl space-y-3 text-white">
          <FolderKanban className="w-8 h-8 text-[#8D9298] mx-auto" />
          <h2 className="text-lg font-bold text-white font-display">{filter === 'ativo' ? 'Nenhum projeto ativo' : 'Nada por aqui'}</h2>
          <p className="text-[#8D9298] max-w-sm mx-auto">Defina o resultado que você quer e a primeira ação física para começar.</p>
          <button onClick={() => setModalOpen(true)} className="px-5 py-3 text-sm font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl cursor-pointer transition-colors">Criar projeto</button>
        </div>
      ) : (
        <ul className="grid md:grid-cols-2 gap-4">
          {list.map((p) => {
            const idleDays = getIdleDays(p);
            const stalled = p.status === 'ativo' && idleDays >= 7;
            const openTasks = tasks.filter((t) => t.projectId === p.id && t.status !== 'concluida' && t.status !== 'arquivada').length;
            const prog = projectsProgress[p.id];
            const currentStageTitle = prog?.currentStage?.title;
            const stageLabel = currentStageTitle
              ? `Etapa ${prog.stageNumber}/${prog.totalStages} · ${currentStageTitle}`
              : prog?.totalStages && prog.totalStages > 0
              ? `${prog.totalStages} etapas`
              : null;

            return (
              <li key={p.id} className="bg-[#16181D] border border-white/10 rounded-2xl p-5 flex flex-col gap-4 text-white shadow-xl">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#F3F0EB] font-medium border border-white/10 text-xs">{STATUS_LABEL[p.status]}</span>
                    {stalled && <span className="px-2.5 py-0.5 rounded-full bg-amber-900/40 text-amber-200 border border-amber-600/40 font-medium tabular-nums text-xs">{idleDays} dias sem mover</span>}
                    <span className="text-[#8D9298] text-xs">Prioridade {p.priority.toLowerCase()}</span>
                  </div>
                  <h2 className="text-xl leading-tight font-bold font-display">
                    <button
                      onClick={() => navigateTo(`/app/projetos/${p.id}`)}
                      className="text-left text-white hover:text-[#D7FF3F] transition-colors cursor-pointer"
                    >
                      {p.name}
                    </button>
                  </h2>
                  <p className="text-[#8D9298] leading-relaxed text-sm">
                    <span className="font-semibold text-[#F3F0EB]">Resultado: </span>
                    {p.desiredOutcome}
                  </p>

                  {/* Stage and thin progress bar under outcome */}
                  <div className="pt-1 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-[#8D9298]">
                      <span>{stageLabel || 'Sem etapas definidas'}</span>
                      {prog && prog.totalCardsCount > 0 && (
                        <span className="tabular-nums font-medium text-[#F3F0EB]">
                          {prog.doneCardsCount} de {prog.totalCardsCount} cartões ({prog.progressPercent}%)
                        </span>
                      )}
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden" aria-hidden="true">
                      <div
                        className="h-full bg-[#D7FF3F] transition-all duration-300"
                        style={{ width: `${prog?.progressPercent ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-black/40 border-l-4 border-[#D7FF3F] border border-white/10 p-4">
                  <div className="text-xs text-[#8D9298] mb-0.5 uppercase tracking-wide font-mono">Próxima ação física</div>
                  <div className="font-semibold text-white leading-snug">{p.nextAction}</div>
                </div>

                <div className="flex items-center justify-between text-sm text-[#8D9298] mt-auto">
                  <button
                    onClick={() => navigateTo(`/app/projetos/${p.id}`)}
                    className="font-semibold text-[#D7FF3F] hover:underline cursor-pointer tabular-nums text-xs"
                  >
                    {openTasks} {openTasks === 1 ? 'tarefa aberta' : 'tarefas abertas'}
                  </button>
                  {p.deadline && <span className="inline-flex items-center gap-1.5 text-xs text-[#8D9298]"><Calendar className="w-3.5 h-3.5 text-[#D7FF3F]" /> {p.deadline}</span>}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/10">
                  <button
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-[#D7FF3F] text-[#101114] hover:bg-white cursor-pointer transition-colors shadow-sm inline-flex items-center gap-1.5"
                    onClick={() => navigateTo(`/app/projetos/${p.id}`)}
                  >
                    <span>Abrir mesa</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  {p.status === 'ativo' && <button className={btn} onClick={() => updateProject(p.id, { status: 'pausado' })}>Pausar</button>}
                  {p.status === 'pausado' && <button className={btn} onClick={() => updateProject(p.id, { status: 'ativo' })}>Reativar</button>}
                  {(p.status === 'ativo' || p.status === 'pausado') && (
                    <button className={`${btn} text-emerald-400`} onClick={() => updateProject(p.id, { status: 'concluido' })}>Concluir</button>
                  )}
                  <button className="ml-auto px-3 py-2 text-xs text-[#8D9298] hover:text-rose-400 cursor-pointer transition-colors"
                    onClick={() => { if (window.confirm(`Excluir o projeto "${p.name}"?`)) deleteProject(p.id); }}>Excluir</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <NewProjectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};
