import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BlockerModal } from '../components/modals/BlockerModal';
import { WeatherClockWidget } from '../components/common/WeatherClockWidget';
import { PrioritiesCard } from '../components/dashboard/PrioritiesCard';
import { ExecutionMode } from '../types';
import { FolderKanban, Scale, CheckSquare, Sparkles, ArrowRight, Zap, ListChecks, BarChart3 } from 'lucide-react';
import { getIdleDays } from '../lib/projectUtils';
import { getFocusTask } from '../lib/selectors';

const MODES: ExecutionMode[] = ['Normal', 'Reduzido', 'Recuperação'];

export const DashboardPage: React.FC = () => {
  const { userProfile, activeTodayMission: m, missions, projects, stages, tasks, decisions, navigateTo, setExecutionMode, completeMission } = useApp();
  const [blockerOpen, setBlockerOpen] = useState(false);

  // Mobile Direct View Switcher: allows entrepreneur to switch views in 1 tap without 100% scrolling down
  const [mobileTab, setMobileTab] = useState<'agora' | 'seguir' | 'ciclo'>('agora');

  const mode = userProfile.currentMode;
  const done = missions.filter((x) => x.completed).length;
  const first = userProfile.name?.split(' ')[0] ?? '';
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const dateLabel = today.charAt(0).toUpperCase() + today.slice(1);

  // Unified selector for the primary focus next physical action card
  const nextTask = getFocusTask(tasks, projects, stages) ?? tasks.find((t) => t.status !== 'concluida' && t.status !== 'bloqueada' && t.status !== 'arquivada' && t.isNextPhysicalAction);
  const blockedTask = tasks.find((t) => t.status === 'bloqueada');
  const project = [...projects].filter((p) => p.status === 'ativo').sort((a, b) => getIdleDays(b) - getIdleDays(a))[0];
  const decision = decisions.find((d) => d.status === 'pendente');
  const upNext = [
    project && {
      icon: FolderKanban,
      kind: 'Projeto parado',
      title: project.nextAction,
      cta: 'Ver',
      route: `/app/projetos/${project.id}`
    },
    decision && { icon: Scale, kind: `Decisão aberta há ${decision.openDays} dias`, title: decision.title, cta: 'Decidir', route: '/app/decisoes' },
    blockedTask && { icon: CheckSquare, kind: 'Tarefa bloqueada', title: blockedTask.title, cta: 'Desbloquear', route: '/app/tarefas' }
  ].filter(Boolean) as { icon: React.ElementType; kind: string; title: string; cta: string; route: string }[];

  const isFriday = [5, 6, 0].includes(new Date().getDay());

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Cabeçalho contextual com Saudação Modo eXec + Modo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <p className="text-xs sm:text-sm text-[#8D9298] font-mono uppercase tracking-wider">{dateLabel}</p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl mt-0.5 sm:mt-1 font-bold tracking-tight text-white font-display">
            Olá, {first}. <span className="text-[#D7FF3F]">É hora de executar.</span>
          </h1>
        </div>

        <div role="group" aria-label="Modo de execução" className="inline-flex p-1 bg-[#16181D] border border-white/10 rounded-xl self-start sm:self-center shrink-0">
          {MODES.map((x) => (
            <button key={x} onClick={() => setExecutionMode(x)} aria-pressed={mode === x}
              className={`px-3 py-1.5 sm:px-3.5 text-xs sm:text-sm rounded-lg cursor-pointer transition-all ${
                mode === x
                  ? 'bg-[#D7FF3F] text-[#101114] font-bold shadow-xs'
                  : 'text-[#8D9298] hover:text-white'
              }`}>
              {x}
            </button>
          ))}
        </div>
      </div>

      {/* MOBILE HIGH-TICKET DIRECT CONTROL DECK (lg:hidden) */}
      <div className="lg:hidden">
        <div className="flex items-center p-1 bg-[#16181D] border border-white/10 rounded-2xl mb-4 text-xs font-semibold shadow-inner">
          <button
            onClick={() => setMobileTab('agora')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 rounded-xl transition-all cursor-pointer ${
              mobileTab === 'agora'
                ? 'bg-[#D7FF3F] text-[#101114] font-bold shadow-xs'
                : 'text-[#8D9298] hover:text-white'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${mobileTab === 'agora' ? 'text-[#101114] fill-[#101114]' : 'text-[#D7FF3F]'}`} />
            <span>Foco de Agora</span>
          </button>
          <button
            onClick={() => setMobileTab('seguir')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 rounded-xl transition-all cursor-pointer ${
              mobileTab === 'seguir'
                ? 'bg-[#D7FF3F] text-[#101114] font-bold shadow-xs'
                : 'text-[#8D9298] hover:text-white'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>A Seguir ({upNext.length})</span>
          </button>
          <button
            onClick={() => setMobileTab('ciclo')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 rounded-xl transition-all cursor-pointer ${
              mobileTab === 'ciclo'
                ? 'bg-[#D7FF3F] text-[#101114] font-bold shadow-xs'
                : 'text-[#8D9298] hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Ciclo 30D</span>
          </button>
        </div>

        {/* Mobile View 1: Agora with Redesigned Clean PrioritiesCard */}
        {mobileTab === 'agora' && (
          <PrioritiesCard
            mission={m}
            mode={mode}
            nextTask={nextTask}
            onNavigate={navigateTo}
            onOpenBlocker={() => setBlockerOpen(true)}
            onCompleteMission={(ev) => completeMission(m.id, ev)}
            onSwitchMobileTab={(tab) => setMobileTab(tab)}
            isMobile={true}
          />
        )}

        {/* Mobile View 2: A Seguir (Pendências) directly reachable */}
        {mobileTab === 'seguir' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white font-display">Itens que precisam de atenção</h2>
              <span className="text-xs text-[#8D9298] font-mono">{upNext.length} itens</span>
            </div>
            {upNext.length === 0 ? (
              <p className="p-4 bg-[#16181D] border border-white/10 rounded-xl text-[#8D9298] text-sm">
                Tudo limpo no momento! Nenhuma pendência urgente.
              </p>
            ) : (
              <div className="space-y-2.5">
                {upNext.map((i, k) => {
                  const Icon = i.icon;
                  return (
                    <div key={k} className="p-4 bg-[#16181D] border border-white/10 rounded-2xl shadow-lg space-y-2 text-white">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-white/6 grid place-items-center shrink-0">
                          <Icon className="w-4 h-4 text-[#D7FF3F]" />
                        </span>
                        <span className="text-xs font-semibold text-[#8D9298] font-mono uppercase tracking-wide">{i.kind}</span>
                      </div>
                      <p className="text-sm font-bold text-white leading-snug">{i.title}</p>
                      <button
                        onClick={() => navigateTo(i.route)}
                        className="w-full mt-2 py-2 text-xs font-bold rounded-xl border border-white/15 bg-white/5 hover:bg-[#D7FF3F] hover:text-[#101114] text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {i.cta} <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Mobile View 3: Ciclo 30D directly reachable */}
        {mobileTab === 'ciclo' && (
          <section className="space-y-4">
            <div className="bg-[#16181D] border border-white/10 rounded-2xl p-5 shadow-2xl text-white">
              <div className="font-bold text-lg tabular-nums font-display">Dia {m.day} de 30</div>
              <p className="text-xs text-[#8D9298] mt-0.5">{done} {done === 1 ? 'entrega concluída' : 'entregas concluídas'}</p>
              <div className="ribbon on-light [&>i]:h-2! mt-4" aria-hidden="true">
                {Array.from({ length: 30 }, (_, i) => <i key={i} className={i < done ? 'done' : i === m.day - 1 ? 'now' : ''} />)}
              </div>
              <button onClick={() => navigateTo('/app/programa')} className="mt-4 text-xs font-bold text-[#D7FF3F] hover:underline block cursor-pointer">
                Abrir Jornada de 30 Dias →
              </button>
            </div>

            {/* Relógio e Clima abaixo do card do ciclo no mobile */}
            <div className="w-full flex justify-center py-1">
              <WeatherClockWidget />
            </div>

            {isFriday && (
              <button onClick={() => navigateTo('/app/revisao')} className="w-full text-left bg-[#8D79FF]/10 border border-[#8D79FF]/30 rounded-2xl p-4 cursor-pointer hover:bg-[#8D79FF]/20 transition-colors text-white">
                <Sparkles className="w-4 h-4 text-[#8D79FF] mb-1" />
                <div className="font-bold text-white text-sm">Sua revisão semanal está pronta</div>
                <p className="text-xs text-[#8D9298] mt-0.5">Leva poucos minutos e define o foco da próxima semana.</p>
              </button>
            )}
          </section>
        )}
      </div>

      {/* DESKTOP VIEW (hidden lg:grid) - COMPLETELY PRESERVED AND UNCHANGED */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_300px] gap-8 items-start">
        <div className="space-y-8">
          {/* 1. Priorities Now with Redesigned Clean PrioritiesCard & LiquidGlassButton */}
          <PrioritiesCard
            mission={m}
            mode={mode}
            nextTask={nextTask}
            onNavigate={navigateTo}
            onOpenBlocker={() => setBlockerOpen(true)}
            onCompleteMission={(ev) => completeMission(m.id, ev)}
            isMobile={false}
          />

          {/* 2. A seguir */}
          <section aria-label="A seguir">
            <h2 className="text-xl mb-3 text-white font-display">Depois desta missão</h2>
            {upNext.length === 0 ? (
              <p className="p-5 bg-[#16181D] border border-white/10 rounded-2xl text-[#8D9298]">Nada pendente além da missão. Quando surgir um projeto, uma decisão ou uma tarefa travada, ela aparece aqui.</p>
            ) : (
              <ul className="bg-[#16181D] border border-white/10 rounded-2xl divide-y divide-white/10 text-white shadow-xl">
                {upNext.map((i, k) => {
                  const Icon = i.icon;
                  return (
                    <li key={k} className="flex items-center gap-4 p-4 sm:p-5">
                      <span className="w-10 h-10 rounded-lg bg-white/6 grid place-items-center shrink-0"><Icon className="w-5 h-5 text-[#D7FF3F]" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-[#8D9298] font-mono uppercase tracking-wider">{i.kind}</div>
                        <div className="font-semibold text-white leading-snug mt-0.5">{i.title}</div>
                      </div>
                      <button onClick={() => navigateTo(i.route)} className="px-4 py-2 text-sm font-semibold rounded-xl border border-white/20 hover:border-[#D7FF3F] hover:text-[#D7FF3F] hover:bg-[#D7FF3F]/10 text-white transition-all cursor-pointer">{i.cta}</button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* 3. Contexto */}
        <aside className="space-y-4" aria-label="Contexto do ciclo">
          <div className="bg-[#16181D] border border-white/10 rounded-2xl p-5 shadow-2xl text-white">
            <div className="font-bold text-lg tabular-nums font-display">Dia {m.day} de 30</div>
            <p className="text-sm text-[#8D9298] mt-0.5">{done} {done === 1 ? 'entrega concluída' : 'entregas concluídas'}</p>
            <div className="ribbon on-light [&>i]:h-2! mt-4" aria-hidden="true">
              {Array.from({ length: 30 }, (_, i) => <i key={i} className={i < done ? 'done' : i === m.day - 1 ? 'now' : ''} />)}
            </div>
            <button onClick={() => navigateTo('/app/programa')} className="mt-4 text-sm font-semibold text-[#D7FF3F] hover:underline cursor-pointer block">Ver ciclo completo</button>
          </div>

          {/* Relógio e Clima posicionado no canto inferior direito, abaixo do card de Dia/Entregas */}
          <div className="w-full flex justify-center">
            <WeatherClockWidget />
          </div>

          {isFriday && (
            <button onClick={() => navigateTo('/app/revisao')} className="w-full text-left bg-[#8D79FF]/10 border border-[#8D79FF]/30 rounded-2xl p-5 cursor-pointer hover:bg-[#8D79FF]/20 transition-colors shadow-xl text-white">
              <Sparkles className="w-5 h-5 text-[#8D79FF] mb-2" />
              <div className="font-semibold text-white">Sua revisão semanal está pronta</div>
              <p className="text-sm text-[#8D9298] mt-0.5">Leva poucos minutos e define a prioridade da próxima semana.</p>
            </button>
          )}
        </aside>
      </div>

      <BlockerModal mission={m} isOpen={blockerOpen} onClose={() => setBlockerOpen(false)}
        onAcceptReduced={() => { setBlockerOpen(false); setExecutionMode('Reduzido'); }} />
    </div>
  );
};
