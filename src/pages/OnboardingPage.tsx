import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ExecutionMode } from '../types';
import { ArrowRight, Compass, CheckCircle2, ShieldCheck } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { userProfile, updateUserProfile, navigateTo, resetToDemoData } = useApp();
  const [name, setName] = useState(userProfile.name === 'Você' ? '' : userProfile.name);
  const [business, setBusiness] = useState(userProfile.business || '');
  const [teamSize, setTeamSize] = useState(userProfile.teamSize || '1 pessoa');
  const [currentMode, setCurrentMode] = useState<ExecutionMode>(userProfile.currentMode || 'Normal');
  const [dailyMinutes, setDailyMinutes] = useState(userProfile.dailyMinutes || 20);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: name.trim() || 'Empreendedor',
      business: business.trim() || 'Negócio Próprio',
      teamSize,
      currentMode,
      dailyMinutes,
      onboardingCompleted: true,
      isDemo: false
    });
    navigateTo('/app');
  };

  return (
    <div className="min-h-screen bg-[#101114] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="bg-[#16181D] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6">
          <div className="space-y-1 border-b border-white/10 pb-4">
            <span className="text-xs font-semibold text-[#D7FF3F] uppercase tracking-wide">
              Configuração Inicial
            </span>
            <h1 className="text-2xl font-display font-bold text-white">
              Personalize sua Central de Execução
            </h1>
            <p className="text-xs text-[#8D9298]">
              Defina as bases da sua operação para que o sistema calibre o volume e o ritmo das suas missões.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#8D9298] mb-1">
                Como você gostaria de ser chamado(a)? *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Rafael"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white focus:outline-none focus:border-[#D7FF3F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8D9298] mb-1">
                Qual é a área ou modelo do seu negócio? *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Consultoria B2B, Loja Virtual, Prestação de Serviços..."
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white focus:outline-none focus:border-[#D7FF3F]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#8D9298] mb-1">
                  Tamanho da Equipe
                </label>
                <select
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white focus:outline-none focus:border-[#D7FF3F]"
                >
                  <option value="1 pessoa" className="bg-[#16181D] text-white">Apenas eu</option>
                  <option value="2 pessoas" className="bg-[#16181D] text-white">2 pessoas</option>
                  <option value="3 a 5 pessoas" className="bg-[#16181D] text-white">3 a 5 pessoas</option>
                  <option value="6 a 15 pessoas" className="bg-[#16181D] text-white">6 a 15 pessoas</option>
                  <option value="Mais de 15 pessoas" className="bg-[#16181D] text-white">Mais de 15 pessoas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8D9298] mb-1">
                  Disponibilidade Diária
                </label>
                <select
                  value={dailyMinutes}
                  onChange={(e) => setDailyMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white focus:outline-none focus:border-[#D7FF3F]"
                >
                  <option value={10} className="bg-[#16181D] text-white">10 min/dia</option>
                  <option value={15} className="bg-[#16181D] text-white">15 min/dia</option>
                  <option value={20} className="bg-[#16181D] text-white">20 min/dia (Padrão)</option>
                  <option value={30} className="bg-[#16181D] text-white">30 min/dia</option>
                  <option value={45} className="bg-[#16181D] text-white">45 min/dia</option>
                </select>
              </div>
            </div>

            {/* Mode selection */}
            <div>
              <label className="block text-xs font-semibold text-[#8D9298] mb-2">
                Modo Operacional Inicial
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Normal', label: 'Normal', note: 'Ritmo padrão' },
                  { id: 'Reduzido', label: 'Reduzido', note: 'Dias corridos' },
                  { id: 'Recuperação', label: 'Recuperação', note: 'Sem pressão' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCurrentMode(m.id as ExecutionMode)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      currentMode === m.id
                        ? 'border-[#D7FF3F] bg-[#D7FF3F]/15 ring-1 ring-[#D7FF3F]'
                        : 'border-white/10 hover:border-white/20 bg-black/30'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{m.label}</div>
                    <div className="text-[10px] text-[#8D9298] mt-0.5">{m.note}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigateTo('/app')}
                className="text-xs text-[#8D9298] hover:text-white transition-colors cursor-pointer"
              >
                Pular por enquanto
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                <span>Concluir e Entrar no Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={() => {
                resetToDemoData();
                navigateTo('/app');
              }}
              className="text-xs text-[#8D9298] hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
            >
              Prefiro só explorar primeiro, com dados de exemplo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
