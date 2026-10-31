import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileCheck,
  Footprints,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { BlockerModal } from '../components/modals/BlockerModal';
import { HelpModal } from '../components/modals/HelpModal';

interface MissionDetailPageProps {
  missionId: number;
}

export const MissionDetailPage: React.FC<MissionDetailPageProps> = ({ missionId }) => {
  const { missions, completeMission, navigateTo, userProfile } = useApp();

  const mission = missions.find((m) => m.id === missionId) || missions[0];

  const [reflection, setReflection] = useState(mission.userReflection || '');
  const [evidence, setEvidence] = useState(mission.userEvidence || '');
  const [isBlockerOpen, setIsBlockerOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'normal' | 'reduzida'>('normal');

  // Mobile view switcher: 'acao' for instant execution without scrolling, 'leitura' for editorial chapter
  const [mobileFocus, setMobileFocus] = useState<'acao' | 'leitura'>('acao');

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidence.trim()) return;

    completeMission(mission.id, evidence, reflection);
  };

  const nextMission = missions.find((m) => m.id === mission.id + 1);
  const prevMission = missions.find((m) => m.id === mission.id - 1);

  return (
    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 pb-12 lg:pb-0 text-white">
      {/* Top breadcrumb & navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <button
          onClick={() => navigateTo('/app/programa')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8D9298] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Voltar ao Programa de 30 Dias</span>
          <span className="sm:hidden">Programa 30D</span>
        </button>

        <div className="flex items-center gap-2">
          {prevMission && (
            <button
              onClick={() => navigateTo(`/app/missao/${prevMission.id}`)}
              className="p-1.5 text-[#8D9298] hover:text-white text-xs rounded-lg hover:bg-white/10 transition-colors"
              title="Missão anterior"
            >
              ← Dia {prevMission.day}
            </button>
          )}
          <span className="text-xs font-mono text-white/20">·</span>
          {nextMission && (
            <button
              onClick={() => navigateTo(`/app/missao/${nextMission.id}`)}
              className="p-1.5 text-[#8D9298] hover:text-white text-xs rounded-lg hover:bg-white/10 transition-colors"
              title="Próxima missão"
            >
              Dia {nextMission.day} →
            </button>
          )}
        </div>
      </div>

      {/* MOBILE-ONLY QUICK FOCUS SWITCHER (lg:hidden) */}
      <div className="lg:hidden flex items-center p-1 bg-[#16181D] border border-white/10 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setMobileFocus('acao')}
          className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
            mobileFocus === 'acao'
              ? 'bg-[#D7FF3F] text-[#101114] shadow-xs font-bold'
              : 'text-[#8D9298] hover:text-white'
          }`}
        >
          Ação Física & Evidência
        </button>
        <button
          onClick={() => setMobileFocus('leitura')}
          className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
            mobileFocus === 'leitura'
              ? 'bg-[#D7FF3F] text-[#101114] shadow-xs font-bold'
              : 'text-[#8D9298] hover:text-white'
          }`}
        >
          Capítulo & Reflexão
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-[#16181D] p-5 sm:p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6 text-white">
        {/* Header Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-[#D7FF3F]">
              DIA {mission.day.toString().padStart(2, '0')} DE 30
            </span>
            <span aria-hidden="true" className="text-white/20">·</span>
            <span className="text-[#8D9298] font-mono tabular-nums">
              {mission.estimatedMinutes} min de execução
            </span>
          </div>

          {mission.completed ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-full text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Concluída</span>
            </div>
          ) : (
            <button
              onClick={() => setIsHelpOpen(true)}
              className="inline-flex items-center gap-1 text-[#8D9298] hover:text-white text-xs cursor-pointer transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#D7FF3F]" />
              <span>Preciso de ajuda</span>
            </button>
          )}
        </div>

        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-white tracking-tight leading-tight font-display">
            {mission.title}
          </h1>
          <p className="text-xs sm:text-base text-[#8D9298] mt-1.5 leading-relaxed">
            {mission.subtitle}
          </p>
        </div>

        {/* SECTION A: READING & EDITORIAL */}
        <div className={`space-y-6 ${mobileFocus === 'acao' ? 'hidden lg:block' : 'block'}`}>
          {/* Why this mission matters (Editorial insight) */}
          <div className="p-4 sm:p-5 rounded-xl bg-black/40 border border-white/10 space-y-2 text-white">
            <div className="flex items-center gap-2 text-xs font-bold text-[#D7FF3F] uppercase tracking-wide font-mono">
              <BookOpen className="w-4 h-4 text-[#D7FF3F]" />
              <span>Por que esta missão importa:</span>
            </div>
            <p className="text-xs sm:text-sm text-[#F3F0EB] leading-relaxed font-sans">
              {mission.whyItMatters}
            </p>
          </div>

          {/* Reflection prompt */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-white uppercase tracking-wide font-mono">
              Campo de Reflexão Rápida:
            </label>
            <p className="text-xs text-[#8D9298]">{mission.reflectionPrompt}</p>
            <textarea
              rows={3}
              placeholder="Escreva seus pensamentos honestos aqui..."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              disabled={mission.completed}
              className="w-full p-3 text-xs border border-white/20 rounded-xl bg-black/40 text-white placeholder-white/40 focus:outline-none focus:border-[#D7FF3F] disabled:opacity-50"
            />
          </div>

          {/* Mobile prompt to switch to action */}
          <div className="lg:hidden pt-2">
            <button
              onClick={() => setMobileFocus('acao')}
              className="w-full py-2.5 px-4 text-xs font-bold text-[#101114] bg-[#D7FF3F] rounded-xl text-center cursor-pointer shadow-sm"
            >
              Ir para Ação Prática Agora →
            </button>
          </div>
        </div>

        {/* SECTION B: PRACTICAL ACTION & EVIDENCE */}
        <div className={`space-y-6 ${mobileFocus === 'leitura' ? 'hidden lg:block' : 'block'}`}>
          {/* Practical Action vs Minimal Action Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wide font-mono">
                Instrução Prática
              </span>
              <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('normal')}
                  className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                    activeTab === 'normal'
                      ? 'bg-[#D7FF3F] text-[#101114] shadow-xs'
                      : 'text-[#8D9298] hover:text-white'
                  }`}
                >
                  Padrão ({mission.estimatedMinutes}m)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('reduzida')}
                  className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                    activeTab === 'reduzida'
                      ? 'bg-[#D7FF3F] text-[#101114] shadow-xs'
                      : 'text-[#8D9298] hover:text-white'
                  }`}
                >
                  Mínima (3-5m)
                </button>
              </div>
            </div>

            {activeTab === 'normal' ? (
              <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-2 text-white">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#D7FF3F]">
                  <Footprints className="w-4 h-4 text-[#D7FF3F]" />
                  <span>Ação Física a Executar:</span>
                </div>
                <p className="text-xs sm:text-sm text-[#F3F0EB] leading-relaxed font-medium">
                  {mission.practicalAction}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-[#8D79FF]/30 bg-[#8D79FF]/10 space-y-2 text-white">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#8D79FF]">
                  <Sparkles className="w-4 h-4 text-[#8D79FF]" />
                  <span>Versão Mínima (Sem Culpa):</span>
                </div>
                <p className="text-xs sm:text-sm text-[#F3F0EB] leading-relaxed font-medium">
                  {mission.minimalAction}
                </p>
                <p className="text-[11px] text-[#8D9298]">
                  Execute apenas esta ação mínima caso o seu dia esteja sobrecarregado.
                </p>
              </div>
            )}
          </div>

          {/* Expected Evidence & Completion Form */}
          <form onSubmit={handleComplete} className="pt-2 border-t border-white/10 space-y-4">
            <div className="p-3.5 sm:p-4 rounded-xl bg-black/40 border border-white/10 space-y-1.5 text-white">
              <div className="flex items-center gap-2 text-xs font-bold text-[#D7FF3F] uppercase tracking-wide font-mono">
                <FileCheck className="w-4 h-4 text-[#D7FF3F]" />
                <span>Evidência Esperada de Conclusão:</span>
              </div>
              <p className="text-xs text-[#8D9298]">{mission.expectedEvidence}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wide mb-1 font-mono">
                Registro da Sua Evidência *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Cole aqui o texto, a frase, o link ou a comprovação física do que foi feito..."
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                disabled={mission.completed}
                className="w-full p-3 text-xs border border-white/20 rounded-xl bg-black/40 text-white placeholder-white/40 focus:outline-none focus:border-[#D7FF3F] disabled:opacity-50"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsBlockerOpen(true)}
                className="text-xs font-semibold text-[#8D9298] hover:text-white transition-colors py-2 text-center sm:text-left cursor-pointer min-h-[44px]"
              >
                Não consegui fazer hoje?
              </button>

              <div className="flex items-center gap-3">
                {mission.completed ? (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-emerald-400 font-medium">
                      Evidência salva
                    </span>
                    {nextMission && (
                      <button
                        type="button"
                        onClick={() => navigateTo(`/app/missao/${nextMission.id}`)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors cursor-pointer w-full sm:w-auto min-h-[44px]"
                      >
                        <span>Missão {nextMission.day} →</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap w-full sm:w-auto min-h-[48px]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Concluir Missão & Registrar Evidência</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Modals */}
      <BlockerModal
        mission={mission}
        isOpen={isBlockerOpen}
        onClose={() => setIsBlockerOpen(false)}
        onAcceptReduced={() => {
          setIsBlockerOpen(false);
          setActiveTab('reduzida');
          setMobileFocus('acao');
        }}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};
