import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Task, TASK_STATUS_LABEL } from '../types';
import {
  Plus,
  Clock,
  FileCheck2,
  CheckCircle2,
  Circle,
  Trash2,
  Unlock,
  ArrowUp,
  CheckSquare,
  Archive,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { NewTaskModal } from '../components/modals/NewItemModals';
import { getFocusTask } from '../lib/selectors';
import { UnblockDialog } from '../components/mesa/UnblockDialog';

export const TasksPage: React.FC = () => {
  const { tasks, projects, stages, toggleTaskComplete, deleteTask, updateTask, navigateTo } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reason, setReason] = useState('');

  const stagesMap = useMemo(() => new Map(stages.map((s) => [s.id, s])), [stages]);
  const projectsMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const open = tasks.filter((t) => t.status !== 'concluida' && t.status !== 'arquivada');
  const blocked = open.filter((t) => t.status === 'bloqueada');
  const ready = open.filter((t) => t.status !== 'bloqueada');

  // Global "Faça agora" uses getFocusTask
  const focus = useMemo(
    () => getFocusTask(tasks, projects, stages) ?? ready.find((t) => t.isNextPhysicalAction) ?? ready[0],
    [tasks, projects, stages, ready]
  );

  const queue = ready.filter((t) => t.id !== focus?.id);
  const done = tasks.filter((t) => t.status === 'concluida');
  const archived = tasks.filter((t) => t.status === 'arquivada');
  const queueMinutes = ready.reduce((sum, t) => sum + t.durationMinutes, 0);

  const makeNext = (t: Task) => {
    if (focus && focus.id !== t.id) updateTask(focus.id, { isNextPhysicalAction: false });
    updateTask(t.id, { isNextPhysicalAction: true });
  };
  const saveBlock = () => {
    if (!focus || !reason.trim()) return;
    updateTask(focus.id, { status: 'bloqueada', blockedReason: reason.trim(), isNextPhysicalAction: false });
    setReason(''); setBlocking(false);
  };
  const unblock = (t: Task) => updateTask(t.id, { status: 'pronta', blockedReason: undefined });
  const restoreTask = (t: Task) => {
    updateTask(t.id, {
      status: 'pronta',
      archivedAt: undefined,
      archiveReason: undefined
    });
  };
  const remove = (t: Task) => { if (window.confirm(`Excluir "${t.title}"?`)) deleteTask(t.id); };

  const meta = (t: Task) => {
    const stage = t.stageId ? stagesMap.get(t.stageId) : undefined;
    const project = t.projectId ? projectsMap.get(t.projectId) : (stage?.projectId ? projectsMap.get(stage.projectId) : undefined);
    const projectName = t.projectName || project?.name;
    const targetProjectId = t.projectId || stage?.projectId;

    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#8D9298]">
        {projectName && <span className="font-medium text-[#F3F0EB]">{projectName}</span>}
        {stage && (
          <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-[#F3F0EB] font-medium border border-white/10">
            {stage.title}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <Clock className="w-3.5 h-3.5 text-[#D7FF3F]" /> {t.durationMinutes} min
        </span>
        {t.stageId && targetProjectId && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateTo(`/app/projetos/${targetProjectId}?cartao=${t.id}`);
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#D7FF3F] hover:underline cursor-pointer"
          >
            <span>Abrir na mesa</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-display">Minhas tarefas</h1>
          <p className="text-[#8D9298] mt-1 tabular-nums">
            {ready.length} {ready.length === 1 ? 'ação pronta' : 'ações prontas'}, cerca de {queueMinutes} min no total
            {blocked.length > 0 && ` · ${blocked.length} ${blocked.length === 1 ? 'travada' : 'travadas'}`}
            {archived.length > 0 && ` · ${archived.length} ${archived.length === 1 ? 'arquivada' : 'arquivadas'}`}
          </p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl cursor-pointer shrink-0 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Nova ação
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="p-10 text-center bg-[#16181D] border border-white/10 rounded-2xl space-y-3 text-white">
          <CheckSquare className="w-8 h-8 text-[#8D9298] mx-auto" />
          <h2 className="text-lg font-bold text-white font-display">Nenhuma ação cadastrada</h2>
          <p className="text-[#8D9298] max-w-sm mx-auto">Escreva a primeira ação física de um projeto: algo que você consegue fazer em até 25 minutos e mostrar pronto.</p>
          <button onClick={() => setModalOpen(true)} className="px-5 py-3 text-sm font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl cursor-pointer transition-colors">Escrever primeira ação</button>
        </div>
      ) : (
        <>
          {/* Faça agora */}
          {focus ? (
            <section className="bg-[#16181D] text-white border border-[#D7FF3F]/40 rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden" aria-label="Faça agora">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D7FF3F]/5 rounded-full blur-3xl pointer-events-none" />
              <span className="inline-block px-3 py-1 rounded-full bg-[#D7FF3F] text-[#101114] text-xs font-bold uppercase tracking-wider">Faça agora</span>
              <h2 className="text-2xl sm:text-3xl text-balance font-bold text-white font-display">{focus.title}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#8D9298]">
                {focus.projectName && <span className="font-semibold text-white">{focus.projectName}</span>}
                {focus.stageId && stagesMap.get(focus.stageId) && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-[#F3F0EB] font-medium border border-white/10">
                    {stagesMap.get(focus.stageId)?.title}
                  </span>
                )}
                <span className="inline-flex items-center gap-2 tabular-nums"><Clock className="w-4 h-4 text-[#D7FF3F]" /> {focus.durationMinutes} minutos</span>
                <span className="inline-flex items-start gap-2 text-[#F3F0EB]"><FileCheck2 className="w-4 h-4 text-[#D7FF3F] mt-0.5 shrink-0" /> Termina quando: {focus.expectedEvidence}</span>
                {(() => {
                  const targetProjectId = focus.projectId || (focus.stageId ? stagesMap.get(focus.stageId)?.projectId : undefined);
                  if (!focus.stageId || !targetProjectId) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => navigateTo(`/app/projetos/${targetProjectId}?cartao=${focus.id}`)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#D7FF3F] hover:underline underline-offset-2 cursor-pointer transition-colors"
                    >
                      <span>Abrir na mesa</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  );
                })()}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => toggleTaskComplete(focus.id)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl cursor-pointer transition-colors shadow-sm">
                  <CheckCircle2 className="w-5 h-5" /> Concluir tarefa
                </button>
                <button onClick={() => setBlocking(true)} className="px-5 py-3.5 text-sm font-semibold border border-white/20 hover:bg-white/10 text-white rounded-xl cursor-pointer transition-colors">Estou travado nesta</button>
              </div>

              {blocking && focus && (
                <UnblockDialog
                  isOpen={blocking}
                  onClose={() => setBlocking(false)}
                  task={focus}
                  project={projects.find((p) => p.id === focus.projectId)}
                  stage={stages.find((s) => s.id === focus.stageId)}
                  onSuccess={() => setBlocking(false)}
                />
              )}
            </section>
          ) : (
            <p className="p-5 bg-[#16181D] border border-white/10 rounded-2xl text-[#8D9298]">Nenhuma ação pronta no momento. Destrave uma tarefa abaixo ou cadastre a próxima.</p>
          )}

          {/* Na fila */}
          {queue.length > 0 && (
            <section aria-label="Na fila">
              <h2 className="text-xl font-bold mb-3 text-white font-display">Na fila</h2>
              <ul className="bg-[#16181D] border border-white/10 rounded-2xl divide-y divide-white/10 shadow-xl">
                {queue.map((t) => (
                  <li key={t.id} className="flex items-start gap-3 p-4 sm:p-5">
                    <button onClick={() => toggleTaskComplete(t.id)} aria-label={`Concluir: ${t.title}`} className="mt-0.5 text-[#8D9298] hover:text-[#D7FF3F] cursor-pointer"><Circle className="w-5 h-5" /></button>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="font-semibold text-white leading-snug">{t.title}</div>
                      {meta(t)}
                      <div className="text-sm text-[#8D9298]">Evidência: <span className="text-[#F3F0EB]">{t.expectedEvidence}</span></div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => makeNext(t)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg border border-white/20 text-white hover:bg-white/10 cursor-pointer"><ArrowUp className="w-3.5 h-3.5 text-[#D7FF3F]" /> Fazer primeiro</button>
                      <button onClick={() => remove(t)} aria-label={`Excluir: ${t.title}`} className="p-2 text-[#8D9298] hover:text-rose-400 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Travadas */}
          {blocked.length > 0 && (
            <section aria-label="Travadas">
              <h2 className="text-xl font-bold mb-3 text-white font-display">Travadas</h2>
              <ul className="space-y-3">
                {blocked.map((t) => (
                  <li key={t.id} className="p-4 sm:p-5 bg-rose-950/20 border border-rose-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white leading-snug">{t.title}</span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-900/50 text-rose-200 border border-rose-700/40">
                          {TASK_STATUS_LABEL[t.status]}
                        </span>
                      </div>
                      {t.blockedReason && <p className="text-sm text-rose-300">Impedimento: {t.blockedReason}</p>}
                      {meta(t)}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => unblock(t)} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-lg cursor-pointer transition-colors"><Unlock className="w-4 h-4" /> Destravar</button>
                      <button onClick={() => remove(t)} aria-label={`Excluir: ${t.title}`} className="p-2 text-[#8D9298] hover:text-rose-400 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Concluídas */}
          {done.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-[#8D9298] hover:text-white font-semibold list-none flex items-center gap-2 select-none">
                <CheckCircle2 className="w-4 h-4 text-[#D7FF3F]" />
                <span className="text-white">{done.length} {done.length === 1 ? 'concluída' : 'concluídas'}</span>
                <span className="text-sm font-normal text-[#8D9298] group-open:hidden">Mostrar</span>
              </summary>
              <ul className="mt-3 bg-[#16181D] border border-white/10 rounded-2xl divide-y divide-white/10">
                {done.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 p-4">
                    <button onClick={() => toggleTaskComplete(t.id)} aria-label={`Reabrir: ${t.title}`} className="cursor-pointer"><CheckCircle2 className="w-5 h-5 text-[#D7FF3F]" /></button>
                    <span className="flex-1 text-[#8D9298] line-through">{t.title}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Arquivadas */}
          {archived.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-[#8D9298] hover:text-white font-semibold list-none flex items-center gap-2 select-none">
                <Archive className="w-4 h-4 text-[#8D9298]" />
                <span className="text-white">Arquivadas ({archived.length})</span>
                <span className="text-sm font-normal text-[#8D9298] group-open:hidden">Mostrar</span>
              </summary>
              <ul className="mt-3 space-y-3">
                {archived.map((t) => (
                  <li
                    key={t.id}
                    className="p-4 sm:p-5 bg-[#16181D] border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white leading-snug">{t.title}</span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-[#F3F0EB]">
                          {TASK_STATUS_LABEL[t.status]}
                        </span>
                      </div>
                      {t.archiveReason && (
                        <p className="text-xs text-[#8D9298]">
                          Motivo do arquivamento: <span className="font-medium text-[#F3F0EB]">{t.archiveReason}</span>
                        </p>
                      )}
                      {t.blockedReason && (
                        <p className="text-xs text-rose-300">
                          Impedimento original: {t.blockedReason}
                        </p>
                      )}
                      {meta(t)}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => restoreTask(t)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white cursor-pointer transition-colors shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#D7FF3F]" />
                        Restaurar
                      </button>
                      <button
                        onClick={() => remove(t)}
                        aria-label={`Excluir: ${t.title}`}
                        className="p-2 text-[#8D9298] hover:text-rose-400 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
      <NewTaskModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};
