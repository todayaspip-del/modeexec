import React, { useState, useEffect, useRef } from 'react';
import { AppleLogo } from '../common/MacDesktop';
import { useApp } from '../../context/AppContext';
import {
  Wifi,
  Battery,
  Sparkles,
  Palette,
  Check,
  Settings,
  LogOut,
  AppWindow,
  Maximize2,
  FolderKanban,
  RotateCcw
} from 'lucide-react';

interface MacTopBarProps {
  activeAppName: string;
  onSelectWallpaper: (presetStyle: string) => void;
  currentWallpaper: string;
  onCloseAllWindows: () => void;
  onOpenApp: (id: string) => void;
  onSwitchToClassic?: () => void;
}

export const WALLPAPER_PRESETS = [
  { id: 'sonoma-dusk', name: 'macOS Sonoma Dusk', style: 'linear-gradient(135deg, #181938 0%, #301f4e 50%, #101226 100%)' },
  { id: 'sequoia-dawn', name: 'macOS Sequoia Dawn', style: 'linear-gradient(135deg, #2b1055 0%, #7597de 50%, #0c0827 100%)' },
  { id: 'trello-blue', name: 'Trello Clássico', style: 'linear-gradient(135deg, #0079bf 0%, #5067c5 100%)' },
  { id: 'dark-obsidian', name: 'Obsidian Minimal', style: 'linear-gradient(135deg, #090B14 0%, #10142B 100%)' },
  { id: 'sunset-amber', name: 'Sunset Amber', style: 'linear-gradient(135deg, #37113e 0%, #901c1c 50%, #c44d00 100%)' }
];

export const MacTopBar: React.FC<MacTopBarProps> = ({
  activeAppName,
  onSelectWallpaper,
  currentWallpaper,
  onCloseAllWindows,
  onOpenApp,
  onSwitchToClassic
}) => {
  const { userProfile, navigateTo, showToast } = useApp();

  // Apple Menu Dropdown
  const [appleMenuOpen, setAppleMenuOpen] = useState(false);
  const [wallpaperMenuOpen, setWallpaperMenuOpen] = useState(false);
  const appleMenuRef = useRef<HTMLDivElement>(null);
  const wallpaperMenuRef = useRef<HTMLDivElement>(null);

  // Live clock
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted =
        now.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }) +
        ' ' +
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setTimeStr(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (appleMenuRef.current && !appleMenuRef.current.contains(e.target as Node)) {
        setAppleMenuOpen(false);
      }
      if (wallpaperMenuRef.current && !wallpaperMenuRef.current.contains(e.target as Node)) {
        setWallpaperMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <header className="h-7 w-full bg-[#0d1020]/80 dark:bg-black/80 backdrop-blur-2xl border-b border-white/10 px-3 flex items-center justify-between text-white text-[12px] font-medium z-50 select-none shadow-xs shrink-0">
      {/* ==================================================================== */}
      {/* LEFT ZONE: Apple Logo & Application Menus                            */}
      {/* ==================================================================== */}
      <div className="flex items-center gap-3.5">
        {/* Apple  Logo Menu */}
        <div className="relative" ref={appleMenuRef}>
          <button
            onClick={() => setAppleMenuOpen(!appleMenuOpen)}
            className="flex items-center justify-center p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
            title="Menu Apple"
          >
            <AppleLogo className="w-3.5 h-3.5 text-white drop-shadow-xs" />
          </button>

          {appleMenuOpen && (
            <div className="absolute left-0 top-7 w-60 bg-[#161a2e]/95 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl py-1.5 z-50 text-xs text-white/90 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1 text-white font-bold border-b border-white/10 text-[11px] flex items-center justify-between">
                <span>Modo Execução macOS</span>
                <span className="text-[10px] text-white/40">v2.4</span>
              </div>

              <button
                onClick={() => {
                  setAppleMenuOpen(false);
                  onOpenApp('configuracoes');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-blue-400" />
                <span>Ajustes do Sistema...</span>
              </button>

              <button
                onClick={() => {
                  setAppleMenuOpen(false);
                  onOpenApp('trello-mesa');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
              >
                <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
                <span>Abrir Mesa Executiva (Trello)...</span>
              </button>

              <div className="my-1 border-t border-white/10" />

              <button
                onClick={() => {
                  setAppleMenuOpen(false);
                  onCloseAllWindows();
                  showToast('Todas as janelas foram minimizadas/fechadas');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
              >
                <AppWindow className="w-3.5 h-3.5 text-slate-400" />
                <span>Fechar Todas as Janelas</span>
              </button>

              {onSwitchToClassic && (
                <button
                  onClick={() => {
                    setAppleMenuOpen(false);
                    onSwitchToClassic();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/10 text-amber-300 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Alternar para Modo Web Clássico</span>
                </button>
              )}

              <button
                onClick={() => {
                  setAppleMenuOpen(false);
                  navigateTo('/');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-rose-500/20 text-rose-300 flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Encerrar Sessão & Voltar à Landing</span>
              </button>
            </div>
          )}
        </div>

        {/* Active Application Title */}
        <span className="font-extrabold tracking-tight text-white truncate max-w-xs">
          {activeAppName}
        </span>

        {/* Standard macOS Menu Items */}
        <span className="text-white/60 hover:text-white cursor-pointer hidden sm:inline">
          Arquivo
        </span>
        <span className="text-white/60 hover:text-white cursor-pointer hidden sm:inline">
          Editar
        </span>
        <span className="text-white/60 hover:text-white cursor-pointer hidden md:inline">
          Visualizar
        </span>
        <span className="text-white/60 hover:text-white cursor-pointer hidden md:inline">
          Janela
        </span>
        <span className="text-white/60 hover:text-white cursor-pointer hidden lg:inline">
          Ajuda
        </span>
      </div>

      {/* ==================================================================== */}
      {/* RIGHT ZONE: Wallpapers, Focus Mode, System Tray & Live Clock         */}
      {/* ==================================================================== */}
      <div className="flex items-center gap-3 text-white/80 text-[11px]">
        {/* Wallpaper Picker */}
        <div className="relative" ref={wallpaperMenuRef}>
          <button
            onClick={() => setWallpaperMenuOpen(!wallpaperMenuOpen)}
            className="flex items-center gap-1 p-1 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Alterar Papel de Parede"
          >
            <Palette className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden xl:inline text-[11px]">Tema</span>
          </button>

          {wallpaperMenuOpen && (
            <div className="absolute right-0 top-7 w-56 bg-[#161a2e]/95 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1.5">
              <div className="text-[10px] font-bold text-white/50 px-1 pb-1 border-b border-white/10">
                PAPEIS DE PAREDE MACOS
              </div>
              {WALLPAPER_PRESETS.map((wp) => {
                const isSelected = currentWallpaper === wp.style;
                return (
                  <button
                    key={wp.id}
                    onClick={() => {
                      onSelectWallpaper(wp.style);
                      setWallpaperMenuOpen(false);
                      showToast(`Papel de parede: ${wp.name}`);
                    }}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                      isSelected ? 'bg-white/20 text-white font-bold' : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border border-white/40 shrink-0" style={{ background: wp.style }} />
                      <span className="truncate">{wp.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Switch to Classic Web View Button */}
        {onSwitchToClassic && (
          <button
            onClick={onSwitchToClassic}
            title="Alternar para Modo Web Clássico"
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer text-[11px] font-medium"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span className="hidden xl:inline">Modo Clássico</span>
          </button>
        )}

        {/* Execution Mode Badge */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold text-[10px] hidden sm:flex">
          <Sparkles className="w-2.5 h-2.5 text-amber-300" />
          <span>Foco 30D</span>
        </div>

        {/* Hardware & Network Status */}
        <div className="flex items-center gap-2 hidden sm:flex">
          <Wifi className="w-3 h-3 text-white/70" />
          <Battery className="w-3.5 h-3.5 text-emerald-400" />
        </div>

        {/* Clock */}
        <span className="font-mono tabular-nums text-white font-semibold">
          {timeStr}
        </span>

        {/* User Mini Profile */}
        <div
          onClick={() => onOpenApp('configuracoes')}
          title={`Perfil: ${userProfile.name}`}
          className="flex items-center gap-1.5 pl-1 cursor-pointer hover:opacity-85"
        >
          <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center border border-white/20">
            {userProfile.name.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};
