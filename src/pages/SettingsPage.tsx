import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getAIStatus } from '../services/aiClient';
import { ASSETS } from '../assets/images';
import { ExecutionMode } from '../types';
import {
  Settings,
  User,
  Shield,
  RotateCcw,
  Sparkles,
  Download,
  Upload,
  CheckCircle2,
  Trash2,
  Lock,
  Image as ImageIcon
} from 'lucide-react';
import { WallpaperModal } from '../components/modals/WallpaperModal';
import { AccountCard } from '../components/common/AccountCard';
import { useAuth } from '../context/AuthGate';

export const SettingsPage: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    resetToDemoData,
    resetToCleanUser,
    showToast,
    missions,
    projects,
    tasks,
    decisions,
    wallpaper
  } = useApp();
  const { cloudEnabled } = useAuth();

  const [wallpaperModalOpen, setWallpaperModalOpen] = useState(false);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    getAIStatus().then((available) => {
      if (active) setAiAvailable(available);
    });
    return () => {
      active = false;
    };
  }, []);

  const [name, setName] = useState(userProfile.name);
  const [business, setBusiness] = useState(userProfile.business);
  const [teamSize, setTeamSize] = useState(userProfile.teamSize);
  const [currentMode, setCurrentMode] = useState<ExecutionMode>(userProfile.currentMode);
  const [dailyMinutes, setDailyMinutes] = useState(userProfile.dailyMinutes);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name,
      business,
      teamSize,
      currentMode,
      dailyMinutes
    });
  };

  const handleExportData = () => {
    const backup = {
      profile: userProfile,
      missions,
      projects,
      tasks,
      decisions,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modo_execucao_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup Exportado', 'Seus dados foram salvos com segurança em arquivo JSON.');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D7FF3F] uppercase tracking-wide">
            <span>Preferências</span>
            <span aria-hidden="true" className="text-white/20">·</span>
            <span className="text-[#8D9298] font-mono">Conta & Privacidade</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-white mt-1">
            Configurações da Central
          </h1>
          <p className="text-xs text-[#8D9298] mt-1">
            Personalize seu perfil operacional, controle a persistência local e alterne o modo de demonstração.
          </p>
        </div>
      </div>

      {/* Demo State Banner */}
      <div className="p-5 rounded-xl bg-[#16181D] border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={ASSETS.avatarRafael}
            alt="Avatar do usuário Rafael"
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-full object-cover border border-white/20 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-white">{userProfile.name}</span>
              <span className="text-white/20">·</span>
              <span className="text-[#8D9298] font-mono">
                {userProfile.isDemo ? 'Perfil Demo Ativo' : 'Conta Pessoal Ativa'}
              </span>
            </div>
            <p className="text-xs text-[#8D9298] mt-0.5">{userProfile.business}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {userProfile.isDemo ? (
            <button
              onClick={resetToCleanUser}
              className="px-3.5 py-2 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              Sair da demo e começar do zero
            </button>
          ) : (
            <button
              onClick={resetToDemoData}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/15 rounded-lg transition-colors cursor-pointer"
            >
              Restaurar Dados Demo (Rafael)
            </button>
          )}
        </div>
      </div>

      <AccountCard />

      {/* Form: Profile Information */}
      <div className="bg-[#16181D] p-6 sm:p-7 rounded-2xl border border-white/10 space-y-6 shadow-xl">
        <div className="pb-3 border-b border-white/10">
          <h2 className="text-base font-display font-bold text-white">
            Perfil Operacional
          </h2>
          <p className="text-xs text-[#8D9298] mt-0.5">
            Atualize os dados que alimentam os roteiros e as sugestões de processo.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#8D9298] mb-1">
                Nome do Empreendedor
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white focus:outline-none focus:border-[#D7FF3F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8D9298] mb-1">
                Nome / Área da Empresa
              </label>
              <input
                type="text"
                required
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white focus:outline-none focus:border-[#D7FF3F]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                Disponibilidade Diária de Foco
              </label>
              <select
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white focus:outline-none focus:border-[#D7FF3F] tabular-nums"
              >
                <option value={10} className="bg-[#16181D] text-white">10 minutos/dia (Modo Reduzido)</option>
                <option value={15} className="bg-[#16181D] text-white">15 minutos/dia</option>
                <option value={20} className="bg-[#16181D] text-white">20 minutos/dia (Padrão)</option>
                <option value={30} className="bg-[#16181D] text-white">30 minutos/dia</option>
                <option value={45} className="bg-[#16181D] text-white">45 minutos/dia (Aceleração)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8D9298] mb-1">
              Modo Operacional Ativo
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

          <div className="flex justify-end pt-3 border-t border-white/10">
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>

      {/* Status da IA */}
      <div className="bg-[#16181D] p-5 rounded-2xl border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#D7FF3F]/10 border border-[#D7FF3F]/30 flex items-center justify-center text-[#D7FF3F] shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white">
              Status da IA
            </h2>
            <p className="text-[11px] text-[#8D9298] mt-0.5">
              Disponibilidade do assistente inteligente para apoio em roteiros e organização.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 px-3 py-1.5 rounded-full bg-black/40 border border-white/10 self-start sm:self-auto">
          <span
            className={`w-2 h-2 rounded-full ${
              aiAvailable === true ? 'bg-[#D7FF3F]' : 'bg-[#8D9298]'
            }`}
          />
          <span className="text-xs font-semibold text-white">
            {aiAvailable === null ? 'Consultando...' : aiAvailable ? 'Disponível' : 'Indisponível'}
          </span>
        </div>
      </div>

      {/* Wallpaper & Atmosphere Card */}
      <div className="bg-[#16181D] p-6 sm:p-7 rounded-2xl border border-white/10 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#D7FF3F]" />
              <span>Papel de Parede & Atmosfera Visual</span>
            </h2>
            <p className="text-xs text-[#8D9298] mt-0.5">
              Escolha uma imagem de fundo para o sistema, configure o nível de desfoque e a opacidade desejada.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setWallpaperModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            Personalizar Papel de Parede
          </button>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/30 border border-white/10 text-xs">
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${wallpaper.enabled ? 'bg-[#D7FF3F]' : 'bg-white/20'}`} />
            <span className="font-semibold text-white">
              {wallpaper.enabled ? `Ativo: ${wallpaper.presetName}` : 'Desativado (Fundo neutro limpo)'}
            </span>
          </div>
          {wallpaper.enabled && (
            <div className="flex items-center gap-3 text-[#8D9298] font-mono text-[11px]">
              <span>Opacidade: {Math.round(wallpaper.opacity * 100)}%</span>
              <span className="text-white/20">·</span>
              <span>Desfoque: {wallpaper.blur}px</span>
            </div>
          )}
        </div>
      </div>

      {/* Privacy, Storage & Export */}
      <div className="bg-[#16181D] p-6 sm:p-7 rounded-2xl border border-white/10 space-y-6 shadow-xl">
        <div className="pb-3 border-b border-white/10">
          <h2 className="text-base font-display font-bold text-white">
            Privacidade & Persistência Local
          </h2>
          <p className="text-xs text-[#8D9298] mt-0.5">
            {cloudEnabled
              ? 'Seus dados ficam salvos na sua conta (sincronizados entre aparelhos) e em cache neste navegador.'
              : 'Seus dados ficam salvos apenas neste navegador, via armazenamento local.'}
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-black/30 border border-white/10 flex items-start gap-3">
            <Lock className="w-4 h-4 text-[#D7FF3F] shrink-0 mt-0.5" />
            <div className="space-y-1 text-[#8D9298]">
              <strong className="text-white">Seus dados, sob seu controle: </strong>
              Não vendemos nem compartilhamos suas tarefas e decisões com anunciantes. Ao usar o assistente de IA, o nome do projeto, o resultado desejado e o contexto do negócio que você digita são enviados ao provedor de IA (Google Gemini) apenas para gerar as etapas.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div>
              <div className="font-semibold text-white">Backup em Arquivo JSON</div>
              <div className="text-[#8D9298]">Exporte todas as suas missões e evidências salvas.</div>
            </div>

            <button
              onClick={handleExportData}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/15 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Meus Dados</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-white/10">
            <div>
              <div className="font-semibold text-rose-400">Limpar Tudo e Recomeçar</div>
              <div className="text-[#8D9298]">Zere todas as tarefas e missões e volte ao primeiro dia.</div>
            </div>

            <button
              onClick={resetToCleanUser}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Zerar Dados</span>
            </button>
          </div>
        </div>
      </div>

      <WallpaperModal
        isOpen={wallpaperModalOpen}
        onClose={() => setWallpaperModalOpen(false)}
      />
    </div>
  );
};
