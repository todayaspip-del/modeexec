import { useCallback } from 'react';
import { WallpaperSettings } from '../../types';
import { ASSETS } from '../../assets/images';
import { usePersistentState } from '../../hooks/usePersistentState';

export const INITIAL_WALLPAPER: WallpaperSettings = {
  enabled: false,
  imageUrl: ASSETS.heroDesk,
  opacity: 0.18,
  blur: 8,
  presetName: 'Mesa Executiva'
};

export function useWallpaperDomain() {
  const [wallpaper, setWallpaper] = usePersistentState<WallpaperSettings>(
    'wallpaper',
    INITIAL_WALLPAPER
  );

  const updateWallpaper = useCallback(
    (updates: Partial<WallpaperSettings>) => {
      setWallpaper((prev) => ({ ...prev, ...updates }));
    },
    [setWallpaper]
  );

  return {
    wallpaper,
    setWallpaper,
    updateWallpaper
  };
}
