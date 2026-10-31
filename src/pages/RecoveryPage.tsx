import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LifeBuoy,
  HeartHandshake,
  CheckCircle2,
  PauseCircle,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Footprints
} from 'lucide-react';
import { getIdleDays } from '../lib/projectUtils';

export const RecoveryPage: React.FC = () => {
  const {
    tasks,
    projects,
    missions,
    activateRecoveryMode,
    navigateTo,
    userProfile
  } = useApp();

  const [cleanBlocked, setCleanBlocked] = useState(true);
  const [pauseStale, setPauseStale] = useState(true);
  const [blockReason, setBlockReason] = useState('Sobrecarga de demandas e cansaço mental');
  const [selectedMinimalMission, setSelectedMinimalMission] = useState<number>(1);
  const [activated, setActivated] = useState(false);

  const blockedCount = tasks.filter((t) => t.status === 'bloqueada').length;
  const staleProjectsCount = projects.filter(
    (p) => p.status === 'ativo' && getIdleDays(p) > 3
  ).length;

  const handleApplyRecovery = () => {
    activateRecoveryMode({
      cleanBlockedTasks: cleanBlocked,
      pauseStaleProjects: pauseStale,
      chosenMinimalMissionId: selectedMinimalMission,
      notes: blockReason
    });
    setActivated(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Calm header with Electric Lilac recovery accent */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#8D79FF]/10 border border-[#8D79FF]/30 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#8D79FF] uppercase tracking-wide">
          <HeartHandshake className="w-4 h-4 text-[#8D79FF]" />
          <span>Protocolo de Desobstrução Operacional</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
          Não vamos compensar tudo. Vamos escolher o próximo passo possível.
        </h1>
        <p className="text-xs sm:text-sm text-[#F3F0EB]/80 leading-relaxed">
          Dias difíceis e semanas caóticas acontecem com todo empresário sério. O erro fatal é tentar trabalhar 16 horas para &quot;compensar o atraso&quot;, gerando mais cansaço e paralisia. Vamos limpar o atrito agora.
        </p>
      </div>

      {!activated ? (
        <div className="bg-[#16181D] p-6 sm:p-8 rounded-2xl border border-white/10 space-y-6 shadow-xl">
          <div className="space-y-4">
            <h2 className="text-base font-display font-bold text-white">
              O que você deseja fazer para desanuviar a operação?
            </h2>

            {/* Action 1: Clean blocked tasks */}
            <label className="flex items-start gap-3 p-4 rounded-xl border border-white/10 hover:border-white/20 bg-black/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={cleanBlocked}
                onChange={(e) => setCleanBlocked(e.target.checked)}
                className="mt-1 rounded border-white/20 text-[#D7FF3F] focus:ring-[#D7FF3F] bg-black/50"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white">
                  Arquivar tarefas com atrito ({blockedCount} encontradas)
                </span>
                <p className="text-xs text-[#8D9298]">
                  Tira a culpa de ver tarefas bloqueadas na lista. Elas são arquivadas sem julgamento.
                </p>
              </div>
            </label>

            {/* Action 2: Pause stale projects */}
            <label className="flex items-start gap-3 p-4 rounded-xl border border-white/10 hover:border-white/20 bg-black/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={pauseStale}
                onChange={(e) => setPauseStale(e.target.checked)}
                className="mt-1 rounded border-white/20 text-[#D7FF3F] focus:ring-[#D7FF3F] bg-black/50"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white">
                  Pausar projetos parados há mais de 3 dias ({staleProjectsCount} encontrados)
                </span>
                <p className="text-xs text-[#8D9298]">
                  Muda o status para &quot;Pausado conscientemente&quot;. Você não desistiu; apenas priorizou o fôlego.
                </p>
              </div>
            </label>

            {/* Choose one minimal micro-mission */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-[#8D9298] uppercase tracking-wide mb-2">
                Escolha uma microação de 5 a 10 minutos para hoje:
              </label>
              <div className="space-y-2">
                {[
                  {
                    id: 1,
                    title: 'Fazer o descarrego mental em papel cru',
                    desc: 'Apenas escrever 3 pendências e fechar o caderno.'
                  },
                  {
                    id: 2,
                    title: 'Abrir 1 documento e redigir 2 linhas',
                    desc: 'Dar apenas a partida mecânica sem compromisso de terminar tudo.'
                  },
                  {
                    id: 13,
                    title: 'Organizar apenas a área do teclado e tomar um café com calma',
                    desc: 'Limpeza física para recarregar o campo visual.'
                  }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedMinimalMission(item.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedMinimalMission === item.id
                        ? 'border-[#8D79FF] bg-[#8D79FF]/15 ring-1 ring-[#8D79FF]'
                        : 'border-white/10 hover:border-white/20 bg-black/30'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{item.title}</div>
                    <div className="text-[11px] text-[#8D9298] mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Register reason */}
            <div>
              <label className="block text-xs font-bold text-[#8D9298] uppercase tracking-wide mb-1">
                Motivo do bloqueio recente (para autoconhecimento):
              </label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white focus:outline-none focus:border-[#D7FF3F]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => navigateTo('/app')}
              className="text-xs font-medium text-[#8D9298] hover:text-white transition-colors cursor-pointer"
            >
              Cancelar e voltar
            </button>
            <button
              onClick={handleApplyRecovery}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-[#101114] bg-[#8D79FF] hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <span>Aplicar Limpeza e Ativar Recuperação</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#16181D] p-6 sm:p-8 rounded-2xl border border-white/10 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200 shadow-xl">
          <CheckCircle2 className="w-10 h-10 text-[#D7FF3F] mx-auto" />
          <h2 className="text-xl font-display font-bold text-white">
            Terreno Desobstruído
          </h2>
          <p className="text-xs sm:text-sm text-[#8D9298] max-w-md mx-auto leading-relaxed">
            As pendências foram desarmadas e seu painel está em <strong className="text-white">Modo Recuperação</strong>. Faça apenas o passo mínimo escolhido e descanse sem peso na consciência.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigateTo('/app')}
              className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <span>Retornar ao Dashboard com Fôlego</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
