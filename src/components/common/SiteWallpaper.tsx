import React from 'react';
import { useApp } from '../../context/AppContext';

export const SiteWallpaper: React.FC = () => {
  const { wallpaper } = useApp();

  if (!wallpaper.enabled || !wallpaper.imageUrl) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#070913] transition-colors duration-300"
      aria-hidden="true"
    >
      {/* 
        Solid obsidian dark base layer ensures that as opacity decreases,
        the image shifts toward dark tones, NOT white.
      */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-300"
        style={{
          backgroundImage: `url(${wallpaper.imageUrl})`,
          opacity: wallpaper.opacity,
          filter: `blur(${wallpaper.blur}px)`,
          transform: 'scale(1.08)' // Prevents white bleed on borders from CSS blur
        }}
      />

      {/* Dark gradient vignette & scrim to enhance depth and keep text ultra-crisp */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70 pointer-events-none" />
    </div>
  );
};
