import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { ChevronRight, ArrowRight, Play, Check, Sparkles, Plus, Eye, ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';

export interface LiquidGlassButtonProps {
  label: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  icon?: 'chevron' | 'arrow' | 'play' | 'check' | 'sparkles' | 'plus' | 'eye' | 'chevron-down' | 'chevron-up' | 'expand' | 'none';
  iconPosition?: 'left' | 'right';
  variant?: 'clear' | 'frosted' | 'tinted' | 'signal';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
}

export const LiquidGlassButton: React.FC<LiquidGlassButtonProps> = ({
  label,
  onClick,
  icon = 'chevron',
  iconPosition = 'right',
  variant = 'frosted',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  ariaLabel,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Mouse coordinates normalized between -0.5 and 0.5
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Pixel coordinates for the specular pointer light
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  // Spring physics for tilt and reflections
  const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), springConfig);
  const reflectionX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-25, 25]), springConfig);
  const reflectionY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-15, 15]), springConfig);
  const causticX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), springConfig);

  // Dynamic Specular Pointer Light background (called unconditionally at top level)
  const specularBg = useTransform(
    [pointerX, pointerY],
    ([x, y]) => `radial-gradient(circle 90px at ${x}px ${y}px, rgba(255, 255, 255, 0.42), transparent 70%)`
  );

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || disabled) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    pointerX.set(x);
    pointerY.set(y);

    const normX = x / rect.width - 0.5;
    const normY = y / rect.height - 0.5;
    mouseX.set(normX);
    mouseY.set(normY);
  }, [disabled, mouseX, mouseY, pointerX, pointerY]);

  const handlePointerEnter = useCallback(() => {
    if (!disabled) setIsHovered(true);
  }, [disabled]);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  // Size styling map
  const sizeStyles = {
    sm: {
      button: 'px-4 py-2 text-xs',
      iconSize: 'w-3.5 h-3.5',
      gap: 'gap-2',
      minH: 'min-h-[38px]',
    },
    md: {
      button: 'px-6 py-3 text-sm sm:text-base font-semibold',
      iconSize: 'w-4 h-4',
      gap: 'gap-2.5',
      minH: 'min-h-[48px]',
    },
    lg: {
      button: 'px-8 py-3.5 sm:py-4 text-base sm:text-lg font-bold',
      iconSize: 'w-5 h-5',
      gap: 'gap-3',
      minH: 'min-h-[56px]',
    },
  }[size];

  // Variant color definitions
  const variantStyles = {
    clear: {
      text: 'text-white',
      surfaceBg: 'linear-gradient(150deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04) 42%, rgba(255,255,255,0.14))',
      rim: 'rgba(255,255,255,0.4)',
      tint: 'rgba(255,255,255,0.06)',
      caustic: 'rgba(255,255,255,0.7)',
      activeGlow: 'rgba(255,255,255,0.25)',
    },
    frosted: {
      text: 'text-white',
      surfaceBg: 'linear-gradient(150deg, rgba(255,255,255,0.26), rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.20))',
      rim: 'rgba(255,255,255,0.6)',
      tint: 'rgba(255,255,255,0.12)',
      caustic: 'rgba(255,255,255,0.9)',
      activeGlow: 'rgba(255,255,255,0.35)',
    },
    tinted: {
      text: 'text-[#D7FF3F]',
      surfaceBg: 'linear-gradient(150deg, rgba(215,255,63,0.24), rgba(161,192,57,0.08) 45%, rgba(215,255,63,0.18))',
      rim: 'rgba(215,255,63,0.65)',
      tint: 'rgba(215,255,63,0.12)',
      caustic: 'rgba(215,255,63,0.95)',
      activeGlow: 'rgba(215,255,63,0.4)',
    },
    signal: {
      text: 'text-[#101114] font-bold',
      surfaceBg: 'linear-gradient(150deg, #E2FF6B, #D7FF3F 45%, #C2ED2B)',
      rim: 'rgba(255,255,255,0.95)',
      tint: 'rgba(215,255,63,0.35)',
      caustic: 'rgba(255,255,255,0.95)',
      activeGlow: 'rgba(215,255,63,0.55)',
    },
  }[variant];

  const renderIcon = () => {
    const s = sizeStyles.iconSize;
    switch (icon) {
      case 'chevron':
        return <ChevronRight className={`${s} transition-transform duration-200 ${isHovered ? 'translate-x-0.5' : ''}`} />;
      case 'arrow':
        return <ArrowRight className={`${s} transition-transform duration-200 ${isHovered ? 'translate-x-1' : ''}`} />;
      case 'play':
        return <Play className={`${s} fill-current transition-transform duration-200 ${isHovered ? 'scale-110' : ''}`} />;
      case 'check':
        return <Check className={`${s} stroke-[2.5]`} />;
      case 'sparkles':
        return <Sparkles className={`${s} transition-transform duration-200 ${isHovered ? 'rotate-12 scale-110' : ''}`} />;
      case 'plus':
        return <Plus className={`${s}`} />;
      case 'eye':
        return <Eye className={`${s} transition-transform duration-200 ${isHovered ? 'scale-110' : ''}`} />;
      case 'chevron-down':
        return <ChevronDown className={`${s} transition-transform duration-200 ${isHovered ? 'translate-y-0.5' : ''}`} />;
      case 'chevron-up':
        return <ChevronUp className={`${s} transition-transform duration-200 ${isHovered ? '-translate-y-0.5' : ''}`} />;
      case 'expand':
        return <Maximize2 className={`${s} transition-transform duration-200 ${isHovered ? 'scale-110' : ''}`} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ perspective: 900 }} className={`inline-flex ${className}`}>
      <motion.button
        ref={buttonRef}
        type={type}
        disabled={disabled}
        aria-label={ariaLabel || label}
        onClick={onClick}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerDown={() => !disabled && setIsPressed(true)}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.96 }}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`group relative isolate inline-flex items-center justify-center select-none cursor-pointer rounded-2xl sm:rounded-full border-0 outline-none transition-shadow ${sizeStyles.minH} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        {/* Optical Outer Body Drop Shadows */}
        <div
          className="absolute inset-0 rounded-2xl sm:rounded-full pointer-events-none transition-all duration-300"
          style={{
            boxShadow: isHovered
              ? `0 2px 4px rgba(0,0,0,0.25), 0 8px 24px -4px rgba(0,0,0,0.4), 0 0 28px -4px ${variantStyles.activeGlow}`
              : '0 1px 2px rgba(0,0,0,0.2), 0 4px 12px -2px rgba(0,0,0,0.3)',
          }}
        />

        {/* Optical Surface with Backdrop Blur & Shimmer */}
        <div
          className="absolute inset-0 rounded-2xl sm:rounded-full overflow-hidden pointer-events-none backdrop-blur-md"
          style={{
            background: variantStyles.surfaceBg,
            boxShadow: `inset 0 1px 1px rgba(255,255,255,0.7), inset 0 -1px 1px rgba(255,255,255,0.25), inset 1px 0 0.5px rgba(255,255,255,0.3), inset -1px 0 0.5px rgba(0,0,0,0.15)`,
          }}
        >
          {/* Subtle Tint Layer */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: variantStyles.tint }}
          />

          {/* Optical Shoulder Depth Shadow (simulates 3D curved glass thickness) */}
          <div
            className="absolute inset-0 rounded-2xl sm:rounded-full pointer-events-none"
            style={{
              boxShadow: `inset 0 8px 12px -6px rgba(0,0,0,0.35), inset 0 -8px 10px -6px rgba(255,255,255,0.5)`,
            }}
          />

          {/* Diagonal Glass Reflection Highlight */}
          <motion.div
            className="absolute pointer-events-none will-change-transform"
            style={{
              inset: '-40% -30%',
              x: reflectionX,
              y: reflectionY,
              background: 'linear-gradient(112deg, transparent 25%, rgba(255,255,255,0.03) 30%, rgba(255,255,255,0.32) 42%, rgba(255,255,255,0.55) 46%, rgba(255,255,255,0.12) 52%, transparent 60%)',
              opacity: isHovered ? 0.95 : 0.6,
            }}
          />

          {/* Bottom Edge Caustic Highlight Bar */}
          <motion.div
            className="absolute bottom-[1.5px] pointer-events-none rounded-full h-[2px]"
            style={{
              left: '12%',
              right: '12%',
              x: causticX,
              background: `linear-gradient(90deg, transparent, ${variantStyles.caustic}, transparent)`,
              opacity: isHovered ? 1 : 0.65,
            }}
          />

          {/* Dynamic Specular Pointer Light following mouse */}
          <motion.div
            className="absolute inset-0 pointer-events-none transition-opacity duration-200"
            style={{
              background: specularBg,
              opacity: isHovered ? 1 : 0,
            }}
          />

          {/* Refined Glass Rim Bevel */}
          <div
            className="absolute inset-0 rounded-2xl sm:rounded-full pointer-events-none border"
            style={{
              borderColor: variantStyles.rim,
              opacity: isHovered ? 0.9 : 0.6,
            }}
          />
        </div>

        {/* Content Layer (Label + Icon) with 3D elevation */}
        <div
          className={`relative z-10 flex items-center justify-center ${sizeStyles.gap} ${sizeStyles.button} ${variantStyles.text}`}
          style={{ transform: 'translateZ(12px)' }}
        >
          {iconPosition === 'left' && icon !== 'none' && renderIcon()}
          <span className="tracking-tight whitespace-nowrap drop-shadow-xs">{label}</span>
          {iconPosition === 'right' && icon !== 'none' && renderIcon()}
        </div>
      </motion.button>
    </div>
  );
};
