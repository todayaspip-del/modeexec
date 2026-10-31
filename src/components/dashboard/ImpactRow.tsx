import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, CheckCircle2, Play, AlertCircle, FileCheck2, ArrowRight } from 'lucide-react';
import { LiquidGlassButton } from '../common/LiquidGlassButton';

export interface ImpactCardItem {
  id: string;
  number: string;
  title: string;
  description: string;
  badge?: string;
  content: React.ReactNode;
}

interface ImpactRowProps {
  cards: ImpactCardItem[];
  defaultIndex?: number;
  resetOnLeave?: boolean;
  isMobile?: boolean;
  onSelectCard?: (index: number) => void;
}

// Exact spring transition curve from Framer ImpactRow
export const impactSpringTransition = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 34,
  mass: 0.9,
};

export const ImpactRow: React.FC<ImpactRowProps> = ({
  cards,
  defaultIndex = 0,
  resetOnLeave = false,
  isMobile = false,
  onSelectCard,
}) => {
  const [active, setActive] = useState(defaultIndex);

  const handleMouseEnter = useCallback((index: number) => {
    setActive(index);
    if (onSelectCard) onSelectCard(index);
  }, [onSelectCard]);

  const handleMouseLeave = useCallback(() => {
    if (resetOnLeave) {
      setActive(defaultIndex);
    }
  }, [resetOnLeave, defaultIndex]);

  // STACKED VIEW FOR MOBILE
  if (isMobile) {
    return (
      <div className="flex flex-col gap-3 w-full">
        {cards.map((card, index) => {
          const isActive = index === active;
          return (
            <div
              key={card.id || index}
              onClick={() => setActive(index)}
              className={`rounded-2xl transition-all duration-300 border ${
                isActive
                  ? 'bg-white/[0.08] border-amber-400/50 shadow-lg shadow-black/30'
                  : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05]'
              } p-4 overflow-hidden cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold tracking-widest text-amber-400">
                    {card.number}
                  </span>
                  <span className="text-white/20">·</span>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {card.title}
                  </h3>
                </div>
                {card.badge && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-400/15 text-amber-300 font-medium">
                    {card.badge}
                  </span>
                )}
              </div>

              <p className="text-xs text-white/70 leading-relaxed mb-3">
                {card.description}
              </p>

              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={impactSpringTransition}
                    className="pt-3 border-t border-white/10 overflow-hidden"
                  >
                    {card.content}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    );
  }

  // DESKTOP HOVER ROW: Framer ImpactRow layout
  return (
    <div
      onMouseLeave={handleMouseLeave}
      className="relative flex flex-row items-stretch gap-3 w-full min-h-[300px]"
    >
      {cards.map((card, index) => {
        const isActive = index === active;

        return (
          <motion.div
            key={card.id || index}
            onMouseEnter={() => handleMouseEnter(index)}
            onFocus={() => handleMouseEnter(index)}
            onClick={() => handleMouseEnter(index)}
            tabIndex={0}
            aria-expanded={isActive}
            initial={false}
            animate={{
              flex: isActive ? 2.6 : 1,
            }}
            transition={impactSpringTransition}
            style={{
              willChange: 'flex',
            }}
            className={`group relative rounded-3xl overflow-hidden cursor-pointer outline-none transition-colors duration-300 border flex flex-col justify-between p-5 ${
              isActive
                ? 'bg-[#141937] border-amber-400/40 shadow-2xl shadow-black/40 z-10'
                : 'bg-white/[0.035] border-white/10 hover:border-white/20 hover:bg-white/[0.05] z-0'
            }`}
          >
            {/* Top rim sheen accent on active card */}
            {isActive && (
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none" />
            )}

            {/* Inner Content Grid */}
            <div className="flex flex-row items-stretch gap-4 w-full h-full min-w-0">
              {/* Text Column (Always visible, adjusts flex) */}
              <div className="flex flex-col justify-between flex-1 min-w-[180px] h-full">
                <div>
                  {/* Card Number & Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                      {card.number}
                    </span>
                    {card.badge && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-400/15 text-amber-300 font-semibold uppercase">
                        {card.badge}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mb-2 leading-snug">
                    {card.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                {/* Collapsed Hint when inactive */}
                {!isActive && (
                  <div className="pt-4 flex items-center gap-1.5 text-xs text-amber-300/70 font-semibold group-hover:text-amber-300 transition-colors">
                    <span>Expandir</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                )}
              </div>

              {/* Revealed Interactive/Visual Panel (Expands smoothly when active) */}
              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={impactSpringTransition}
                    className="flex-1 min-w-[220px] max-w-[340px] rounded-2xl bg-black/25 border border-white/10 p-4 flex flex-col justify-center overflow-hidden"
                  >
                    {card.content}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
