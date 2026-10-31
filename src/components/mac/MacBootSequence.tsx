import React, { useState, useEffect } from 'react';
import { AppleLogo } from '../common/MacDesktop';

export function playMacStartupChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Smooth F-sharp major chord harmonics simulation (iconic Mac chime feeling)
    const freqs = [185.0, 277.18, 369.99, 554.37, 739.99];
    const now = ctx.currentTime;

    freqs.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = index === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08 / (index + 1), now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.9);
    });
  } catch {
    // Ignore autoplay restrictions gracefully
  }
}

interface MacBootSequenceProps {
  onComplete: () => void;
  systemTitle?: string;
}

export const MacBootSequence: React.FC<MacBootSequenceProps> = ({
  onComplete,
  systemTitle = 'Modo Execução macOS'
}) => {
  const [progress, setProgress] = useState(0);
  const [bootStep, setBootStep] = useState('Iniciando macOS Workspace...');

  useEffect(() => {
    playMacStartupChime();

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        const next = prev + 5;
        if (next > 20 && next < 50) {
          setBootStep(`Carregando ecossistema executivo de foco...`);
        } else if (next >= 50 && next < 80) {
          setBootStep('Inicializando gerenciador de janelas macOS...');
        } else if (next >= 80) {
          setBootStep('Ambiente de alta execução pronto.');
        }
        return next;
      });
    }, 40);

    const handleKeyDown = () => {
      clearInterval(interval);
      onComplete();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]);

  return (
    <div
      onClick={onComplete}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-white select-none cursor-pointer transition-opacity duration-500 font-sans"
      title="Clique ou pressione qualquer tecla para pular"
    >
      {/* Centered Apple Logo */}
      <div className="flex flex-col items-center space-y-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="drop-shadow-[0_0_30px_rgba(255,255,255,0.45)]">
          <AppleLogo className="w-20 h-20 text-white" />
        </div>

        {/* Apple macOS style thin progress bar */}
        <div className="w-56 sm:w-72 space-y-3">
          <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-white rounded-full transition-all duration-75 ease-out shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] font-mono text-center text-white/50 tracking-wider">
            {bootStep}
          </p>
        </div>
      </div>

      <div className="absolute bottom-8 text-[11px] text-white/30 font-sans">
        Clique para entrar imediatamente
      </div>
    </div>
  );
};
