import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, FastForward } from 'lucide-react';

interface VideoLoadingSequenceProps {
  onComplete: () => void;
  videoSrcWebm?: string;
  videoSrcMp4?: string;
}

export const VideoLoadingSequence: React.FC<VideoLoadingSequenceProps> = ({
  onComplete,
  videoSrcWebm = '/assets/aistudio/_MConverter.eu_Logo_loading_on_solid_background_20261021110253_d43948be.webm',
  videoSrcMp4 = '/assets/aistudio/logo_loading.mp4'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Iniciando ecossistema executivo...');
  const completedRef = useRef(false);

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.currentTime = 0;
      video.play().catch(() => {
        // Autoplay fallback: timer will drive animation smoothly
      });
    }

    // Smooth progress driver across ~4.2 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(handleFinish, 300);
          return 100;
        }
        const next = prev + 2.5;
        if (next > 25 && next < 60) {
          setStatusMessage('Processando tarefas e etapas em segundo plano...');
        } else if (next >= 60 && next < 90) {
          setStatusMessage('Otimizando ambiente de alta execução...');
        } else if (next >= 90) {
          setStatusMessage('Ambiente pronto.');
        }
        return next;
      });
    }, 100);

    // Fallback maximum safety timeout (5 seconds)
    const safetyTimeout = setTimeout(() => {
      clearInterval(interval);
      handleFinish();
    }, 5000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        clearInterval(interval);
        clearTimeout(safetyTimeout);
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimeout);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration || isNaN(video.duration)) return;
    const currentPercent = Math.min(100, Math.round((video.currentTime / video.duration) * 100));
    setProgress((prev) => Math.max(prev, currentPercent));
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  return (
    <div
      onClick={handleFinish}
      role="dialog"
      aria-modal="true"
      aria-label="Carregando Modo Execução"
      className={`fixed inset-0 w-screen h-screen z-[99999] bg-[#a1c039] select-none cursor-pointer overflow-hidden transition-all duration-600 ease-out ${
        isFadingOut ? 'opacity-0 scale-102 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background solid matching color */}
      <div className="absolute inset-0 bg-[#a1c039]" />

      {/* Fullscreen Video Animation */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={handleFinish}
        onTimeUpdate={handleVideoTimeUpdate}
        className="absolute inset-0 w-full h-full object-cover z-10"
      >
        <source src={videoSrcMp4} type="video/mp4" />
        <source src={videoSrcWebm} type="video/webm" />
      </video>

      {/* Subtle overlay gradient at the bottom for readability */}
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/50 via-black/20 to-transparent z-20 pointer-events-none" />

      {/* Synchronized Progress Bar & Status Text */}
      <div className="absolute bottom-20 inset-x-0 z-30 flex flex-col items-center px-4 pointer-events-none">
        <div className="w-72 sm:w-88 flex flex-col items-center space-y-2.5">
          <div className="w-full h-1.5 bg-black/35 backdrop-blur-md rounded-full overflow-hidden p-[1px] shadow-inner border border-white/10">
            <div
              className="h-full bg-white rounded-full transition-all duration-100 ease-out shadow-[0_0_12px_rgba(255,255,255,0.9)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-xs font-semibold text-white font-mono tracking-wide text-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            {statusMessage}
          </p>
        </div>
      </div>

      {/* Bottom Floating Skip & Audio Controls */}
      <div className="absolute bottom-6 inset-x-6 flex items-center justify-between text-xs text-white z-30 pointer-events-auto">
        {/* Audio Toggle */}
        <button
          type="button"
          onClick={toggleSound}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white border border-white/20 transition-all cursor-pointer text-xs font-medium shadow-md hover:scale-105"
          title={isMuted ? 'Ativar som' : 'Desativar som'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          <span>{isMuted ? 'Mudo' : 'Com áudio'}</span>
        </button>

        {/* Skip Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleFinish();
          }}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white border border-white/20 transition-all cursor-pointer text-xs font-bold hover:scale-105 shadow-md active:scale-95"
        >
          <span>Pular introdução</span>
          <FastForward className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
