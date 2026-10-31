import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { ASSETS } from '../../assets/images';
import {
  X,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  Eye,
  RotateCcw,
  Check,
  Link2,
  Trash2
} from 'lucide-react';

interface WallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PRESET_WALLPAPERS = [
  {
    id: 'desk',
    name: 'Mesa Executiva',
    desc: 'Caderno, café e foco matinal',
    url: ASSETS.heroDesk
  },
  {
    id: 'dusk',
    name: 'Céu Crepúsculo',
    desc: 'Céu atmosférico com brilho suave',
    url: ASSETS.weatherPartlyCloudy
  },
  {
    id: 'storm',
    name: 'Tempestade Cinética',
    desc: 'Nuvens escuras e atmosfera densa',
    url: ASSETS.weatherRainStorm
  },
  {
    id: 'night',
    name: 'Noite Estrelada',
    desc: 'Horizonte calmo e céu profundo',
    url: ASSETS.weatherClearNight
  },
  {
    id: 'book',
    name: 'Capa Editorial',
    desc: 'Textura sofisticada do livro oficial',
    url: ASSETS.ebookCover
  }
];

export const WallpaperModal: React.FC<WallpaperModalProps> = ({ isOpen, onClose }) => {
  const { wallpaper, updateWallpaper, showToast } = useApp();
  const [customUrl, setCustomUrl] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (url: string, name: string) => {
    updateWallpaper({
      enabled: true,
      imageUrl: url,
      presetName: name
    });
    showToast('Papel de Parede Aplicado', `Ativado: ${name}`);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    updateWallpaper({
      enabled: true,
      imageUrl: customUrl.trim(),
      presetName: 'Personalizado'
    });
    showToast('Papel de Parede Personalizado', 'Imagem aplicada com sucesso');
    setShowCustomInput(false);
  };

  const handleReset = () => {
    updateWallpaper({
      enabled: false,
      imageUrl: ASSETS.heroDesk,
      opacity: 0.18,
      blur: 8,
      presetName: 'Mesa Executiva'
    });
    showToast('Papel de Parede Desativado', 'Plano de fundo restaurado para o padrão limpo.');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-lg bg-[#16181D] text-white rounded-3xl border border-white/15 shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden p-5 sm:p-6 space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-[#D7FF3F]/15 text-[#D7FF3F] grid place-items-center">
                <ImageIcon className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-base font-display font-bold text-white tracking-tight">
                  Papel de Parede do Sistema
                </h3>
                <p className="text-[11px] text-[#8D9298]">
                  Personalize a imagem de fundo, opacidade e desfoque
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 text-white/60 hover:text-white grid place-items-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Master Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-black/30 border border-white/8">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">
                Ativar Imagem de Fundo
              </span>
              <span className="text-[11px] text-[#8D9298] block">
                {wallpaper.enabled ? `Ativo: ${wallpaper.presetName}` : 'Desativado (Fundo neutro padrão)'}
              </span>
            </div>

            <button
              onClick={() => {
                const nextState = !wallpaper.enabled;
                updateWallpaper({ enabled: nextState });
                if (nextState && !wallpaper.imageUrl) {
                  updateWallpaper({ imageUrl: ASSETS.heroDesk });
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                wallpaper.enabled ? 'bg-[#D7FF3F]' : 'bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-[#101114] transition-transform ${
                  wallpaper.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Presets Gallery */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#8D9298]">
                Temas & Fotografias
              </span>
              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="text-[11px] text-[#D7FF3F] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
              >
                <Link2 className="w-3 h-3" />
                <span>Usar Link Próprio</span>
              </button>
            </div>

            {/* Custom URL Input Bar */}
            {showCustomInput && (
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="Cole o link HTTPS direto da imagem (ex: Unsplash)"
                  className="w-full text-xs bg-black/60 border border-white/10 rounded-lg p-2 text-white outline-none placeholder:text-[#8D9298]/50 focus:border-[#D7FF3F]"
                />
                <button
                  onClick={handleApplyCustomUrl}
                  className="w-full py-1.5 rounded-lg bg-[#D7FF3F] text-[#101114] text-xs font-bold hover:bg-white transition-colors cursor-pointer"
                >
                  Aplicar Imagem
                </button>
              </div>
            )}

            {/* Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_WALLPAPERS.map((preset) => {
                const isSelected = wallpaper.enabled && wallpaper.imageUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.url, preset.name)}
                    className={`group relative rounded-xl overflow-hidden text-left border p-2 transition-all cursor-pointer h-20 flex flex-col justify-end ${
                      isSelected
                        ? 'border-[#D7FF3F] ring-2 ring-[#D7FF3F]/40 shadow-md'
                        : 'border-white/10 hover:border-white/25 bg-black/30'
                    }`}
                  >
                    {/* Background thumbnail */}
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold text-white leading-tight truncate">
                          {preset.name}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-[#D7FF3F] text-[#101114] grid place-items-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sliders: Opacity & Blur */}
          <div className="space-y-3.5 pt-1">
            {/* 1. Opacity Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70 font-medium flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#D7FF3F]" />
                  <span>Opacidade (menor = tom mais escuro e noturno)</span>
                </span>
                <span className="font-mono text-[#D7FF3F] font-bold tabular-nums">
                  {Math.round(wallpaper.opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.85"
                step="0.01"
                value={wallpaper.opacity}
                onChange={(e) => updateWallpaper({ opacity: parseFloat(e.target.value) })}
                className="w-full accent-[#D7FF3F] cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-[#8D9298] font-mono">
                <span>Mais Escuro / Sutil (5%)</span>
                <span>Equilibrado (35%)</span>
                <span>Vibrante (85%)</span>
              </div>
            </div>

            {/* 2. Blur Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#8D9298]" />
                  <span>Nível de Desfoque (Blur)</span>
                </span>
                <span className="font-mono text-[#8D9298] font-bold tabular-nums">
                  {wallpaper.blur}px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                step="1"
                value={wallpaper.blur}
                onChange={(e) => updateWallpaper({ blur: parseInt(e.target.value, 10) })}
                className="w-full accent-[#8D9298] cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-[#8D9298]/80 font-mono">
                <span>Nítido (0px)</span>
                <span>Foco Suave (12px)</span>
                <span>Difuso (32px)</span>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <button
              onClick={handleReset}
              className="text-[#8D9298] hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar padrão limpo</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#D7FF3F] hover:bg-white text-[#101114] font-bold text-xs transition-colors cursor-pointer"
            >
              Concluir
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
