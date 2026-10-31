import React, { useRef, useState, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
  MotionValue
} from 'motion/react';
import { useApp } from '../../context/AppContext';
import { ASSETS } from '../../assets/images';

// ============================================================================
// ICONS RELEVANT TO MODO EXECUÇÃO PLATFORM
// ============================================================================

// 1. Hoje / Prioridade Agora
export const HojeIcon: React.FC = () => (
  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#020617] p-2.5 flex items-center justify-center shadow-md relative overflow-hidden border border-white/10">
    <div className="absolute inset-0 bg-radial from-amber-400/20 to-transparent" />
    <svg viewBox="0 0 24 24" className="w-full h-full text-amber-400" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <polygon points="12,4 14.5,9.5 20,12 14.5,14.5 12,20 9.5,14.5 4,12 9.5,9.5" fill="#F4B900" stroke="#F4B900" />
      <circle cx="12" cy="12" r="2.5" fill="#0F172A" />
    </svg>
  </div>
);

// 2. Tarefas Físicas & Próximas Ações
export const TarefasIcon: React.FC = () => (
  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#065F46] via-[#047857] to-[#064E3B] p-2.5 flex items-center justify-center shadow-md relative overflow-hidden border border-emerald-400/30">
    <svg viewBox="0 0 24 24" className="w-full h-full text-white" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" />
      <path d="M7 2h10" strokeLinecap="round" />
      <polyline points="7,12 10.5,15.5 17,9" stroke="#34D399" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

// 3. Decisões Pendentes
export const DecisoesIcon: React.FC = () => (
  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#854D0E] via-[#A16207] to-[#713F12] p-2.5 flex items-center justify-center shadow-md relative overflow-hidden border border-amber-400/30">
    <svg viewBox="0 0 24 24" className="w-full h-full text-amber-200" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="3" x2="12" y2="21" strokeWidth="2.2" />
      <line x1="4" y1="7" x2="20" y2="7" strokeWidth="2.2" />
      <polygon points="4,7 1,14 7,14" fill="#FDE047" stroke="currentColor" />
      <polygon points="20,7 17,14 23,14" fill="#FDE047" stroke="currentColor" />
      <line x1="8" y1="21" x2="16" y2="21" strokeWidth="2.5" />
    </svg>
  </div>
);

// 4. Projetos Ativos
export const ProjetosIcon: React.FC = () => (
  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#3730A3] via-[#4338CA] to-[#312E81] p-2.5 flex items-center justify-center shadow-md relative overflow-hidden border border-indigo-400/30">
    <svg viewBox="0 0 24 24" className="w-full h-full text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#4F46E5" />
      <line x1="8" y1="12" x2="16" y2="12" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="15" x2="13" y2="15" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </div>
);

// 5. Programa 30 Dias
export const ProgramaIcon: React.FC = () => (
  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#991B1B] via-[#DC2626] to-[#7F1D1D] p-2 flex flex-col items-center justify-between shadow-md relative overflow-hidden border border-red-400/30">
    <div className="w-full bg-white/20 rounded-t py-0.5 text-center text-[9px] font-mono font-black uppercase text-white tracking-widest">
      30 DIAS
    </div>
    <div className="text-xl font-mono font-black text-white leading-none tracking-tighter">
      30
    </div>
    <div className="w-full flex justify-center gap-0.5 pb-0.5">
      <span className="w-1.5 h-1 rounded-full bg-amber-400" />
      <span className="w-1.5 h-1 rounded-full bg-amber-400" />
      <span className="w-1.5 h-1 rounded-full bg-white/60" />
    </div>
  </div>
);

// 6. Conversas Difíceis
export const ConversasIcon: React.FC = () => (
  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#9D174D] via-[#BE185D] to-[#831843] p-2.5 flex items-center justify-center shadow-md relative overflow-hidden border border-rose-400/30">
    <svg viewBox="0 0 24 24" className="w-full h-full text-rose-200" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="#DB2777" />
      <path d="M12 7v4" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="14" r="1" fill="white" />
    </svg>
  </div>
);

// 7. Post-it Note Icon (Created as specifically requested by the user!)
export const PostItIcon: React.FC = () => (
  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#FEF08A] via-[#FDE047] to-[#EAB308] p-2 flex flex-col justify-between shadow-md relative overflow-hidden border border-yellow-300 drop-shadow-[0_4px_8px_rgba(202,138,4,0.35)]">
    {/* Red Pushpin in top center */}
    <div className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white mx-auto shadow-xs" />

    {/* Ruled lines on note */}
    <div className="space-y-1 my-auto px-1">
      <div className="h-0.5 bg-[#854D0E]/30 rounded-full w-full" />
      <div className="h-0.5 bg-[#854D0E]/30 rounded-full w-4/5" />
      <div className="h-0.5 bg-[#854D0E]/30 rounded-full w-2/3" />
    </div>

    {/* Realistic Folded Corner in bottom right */}
    <div
      className="absolute bottom-0 right-0 w-3.5 h-3.5"
      style={{
        background: 'linear-gradient(135deg, transparent 50%, #CA8A04 50%)',
        borderTopLeftRadius: '2px'
      }}
    />
  </div>
);

// 8. Modo Recuperação (SOS)
export const RecuperacaoIcon: React.FC = () => (
  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#C2410C] via-[#EA580C] to-[#9A3412] p-2.5 flex items-center justify-center shadow-md relative overflow-hidden border border-orange-400/40">
    <svg viewBox="0 0 24 24" className="w-full h-full text-white" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9.5" stroke="white" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="#0C0E1A" stroke="white" strokeWidth="1.8" />
      <path d="M12 2.5v5.5M12 16v5.5M2.5 12h5.5M16 12h5.5" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  </div>
);

// 9. Trello Workspace Icon (MacDesktop)
export const TrelloIcon: React.FC = () => (
  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#0052CC] via-[#0065FF] to-[#2684FF] p-2 flex items-center justify-center shadow-md relative overflow-hidden border border-blue-300/40">
    <div className="w-full h-full flex gap-1.5 p-1 items-start justify-center">
      <div className="w-1/2 h-full bg-white rounded-xs shadow-xs" />
      <div className="w-1/2 h-2/3 bg-white rounded-xs shadow-xs" />
    </div>
  </div>
);

// 10. Modo Execução (Janela Principal Unificada)
export const ModoExecucaoIcon: React.FC = () => (
  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#0f172a] p-2 flex items-center justify-center shadow-md relative overflow-hidden border border-indigo-400/40">
    <div className="absolute inset-0 bg-radial from-amber-400/20 via-transparent to-transparent" />
    <svg viewBox="0 0 24 24" className="w-full h-full text-amber-400" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" stroke="#F59E0B" />
      <polygon points="12,5 14.5,10 20,12 14.5,14 12,19 9.5,14 4,12 9.5,10" fill="#F59E0B" stroke="#F59E0B" />
      <circle cx="12" cy="12" r="2" fill="#0F172A" />
    </svg>
  </div>
);

// ============================================================================
// DOCK ITEM COMPONENT WITH MAGNIFICATION PHYSICS
// ============================================================================
interface DockItemProps {
  mouseX: MotionValue<number>;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick: () => void;
}

const DockItem: React.FC<DockItemProps> = ({ mouseX, label, icon, isActive, onClick }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [bouncing, setBouncing] = useState(false);

  // Distance from cursor to center of icon
  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return 999;
    return val - (bounds.x + bounds.width / 2);
  });

  // Smooth magnification with spring physics (48px idle up to 76px hovered)
  const sizeSync = useTransform(distance, [-120, 0, 120], [48, 76, 48]);
  const size = useSpring(sizeSync, { mass: 0.1, stiffness: 240, damping: 16 });

  // Floating tooltip height adjustment based on magnified size
  const tooltipBottom = useTransform(size, (s) => `${s + 10}px`);

  const handleClick = () => {
    setBouncing(true);
    onClick();
    setTimeout(() => setBouncing(false), 600);
  };

  return (
    <motion.div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      style={{ width: size }}
      className={`relative flex flex-col items-center justify-end h-[48px] cursor-pointer select-none group transition-none ${
        hovered ? 'z-30' : 'z-10'
      }`}
    >
      {/* Tooltip Label (macOS style floating pill) */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            style={{ bottom: tooltipBottom }}
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-[#0F1424]/95 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-white whitespace-nowrap shadow-xl pointer-events-none z-50 flex items-center gap-1"
          >
            <span>{label}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Magnified Icon - Anchored to bottom, expands upwards beyond the fixed dock bar */}
      <motion.div
        style={{ width: size, height: size }}
        animate={bouncing ? { y: [0, -22, 0, -10, 0] } : { y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center justify-center origin-bottom active:scale-90"
      >
        <div className="w-full h-full">{icon}</div>
      </motion.div>

      {/* Active Dot Indicator under running app */}
      {isActive && (
        <span className="w-1.5 h-1.5 rounded-full bg-white/80 shadow-[0_0_6px_rgba(255,255,255,0.8)] absolute -bottom-1.5 left-1/2 -translate-x-1/2 shrink-0 pointer-events-none z-20" />
      )}
    </motion.div>
  );
};

// ============================================================================
// MAIN MACOS DOCK
// ============================================================================
interface MacOsDockProps {
  onOpenPostIt: () => void;
  onOpenApp?: (appId: string) => void;
  activeWindowIds?: string[];
  className?: string;
  alwaysVisible?: boolean;
}

export const MacOsDock: React.FC<MacOsDockProps> = ({
  onOpenPostIt,
  onOpenApp,
  activeWindowIds,
  className = '',
  alwaysVisible = false
}) => {
  const { currentRoute, navigateTo, userProfile } = useApp();
  const mouseX = useMotionValue(Infinity);

  // Visibility state: either permanently visible or revealed on hover
  const [isVisible, setIsVisible] = useState(alwaysVisible);
  const [isHoldingBottom, setIsHoldingBottom] = useState(false);

  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // Bottom area hover handler: start 1.5s hold timer to reveal dock
  const handleBottomMouseEnter = () => {
    setIsHoldingBottom(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (!isVisible) {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = setTimeout(() => {
        setIsVisible(true);
        setIsHoldingBottom(false);
      }, 1500); // 1.5s hold required
    }
  };

  const handleBottomMouseLeave = () => {
    setIsHoldingBottom(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  // Instant trigger if user clicks the iOS bar directly
  const handleTriggerClick = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setIsHoldingBottom(false);
    setIsVisible(true);
  };

  // Dock mouse handlers: reset hide timer while interacting with the dock
  const handleDockMouseEnter = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const handleDockMouseMove = (e: React.MouseEvent) => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    mouseX.set(e.clientX);
  };

  // When mouse leaves the dock: schedule disappearance after 4 seconds (if not alwaysVisible)
  const handleDockMouseLeave = () => {
    mouseX.set(Infinity);
    if (alwaysVisible) return;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 4000); // 4s disappearance timer
  };

  const dockApps = [
    {
      id: 'main',
      appId: 'main',
      label: 'Modo Execução (Janela Principal)',
      icon: <ModoExecucaoIcon />,
      route: '/app',
      isActive: activeWindowIds ? activeWindowIds.includes('main') : true
    },
    {
      id: 'hoje',
      appId: 'hoje',
      label: 'Hoje (Ação de Agora)',
      icon: <HojeIcon />,
      route: '/app',
      isActive: activeWindowIds ? activeWindowIds.includes('hoje') : currentRoute === '/app'
    },
    {
      id: 'tarefas',
      appId: 'tarefas',
      label: 'Tarefas Físicas & Ações',
      icon: <TarefasIcon />,
      route: '/app/tarefas',
      isActive: activeWindowIds ? activeWindowIds.includes('tarefas') : currentRoute === '/app/tarefas'
    },
    {
      id: 'decisoes',
      appId: 'decisoes',
      label: 'Decisões Pendentes',
      icon: <DecisoesIcon />,
      route: '/app/decisoes',
      isActive: activeWindowIds ? activeWindowIds.includes('decisoes') : currentRoute === '/app/decisoes'
    },
    {
      id: 'projetos',
      appId: 'projetos',
      label: 'Projetos Ativos',
      icon: <ProjetosIcon />,
      route: '/app/projetos',
      isActive: activeWindowIds ? activeWindowIds.includes('projetos') : currentRoute === '/app/projetos'
    },
    {
      id: 'workspace',
      appId: 'trello-mesa',
      label: 'MacDesktop (Trello Workspace)',
      icon: <TrelloIcon />,
      route: '/app/workspace',
      isActive: activeWindowIds ? activeWindowIds.includes('trello-mesa') : currentRoute === '/app/workspace'
    },
    {
      id: 'programa',
      appId: 'programa',
      label: 'Programa 30 Dias',
      icon: <ProgramaIcon />,
      route: '/app/programa',
      isActive: activeWindowIds ? activeWindowIds.includes('programa') : (currentRoute.startsWith('/app/programa') || currentRoute.startsWith('/app/missao'))
    },
    {
      id: 'conversas',
      appId: 'conversas',
      label: 'Conversas Difíceis',
      icon: <ConversasIcon />,
      route: '/app/conversas',
      isActive: activeWindowIds ? activeWindowIds.includes('conversas') : currentRoute === '/app/conversas'
    },
    {
      id: 'postit',
      appId: 'postit',
      label: 'Post-it (Notas Rápidas)',
      icon: <PostItIcon />,
      isAction: true,
      isActive: activeWindowIds ? activeWindowIds.includes('postit') : false,
      onClick: onOpenPostIt
    },
    {
      id: 'recuperacao',
      appId: 'recuperacao',
      label: 'Modo Recuperação (SOS)',
      icon: <RecuperacaoIcon />,
      route: '/app/recuperacao',
      isActive: activeWindowIds ? activeWindowIds.includes('recuperacao') : currentRoute === '/app/recuperacao'
    }
  ];

  return (
    <>
      {/* 1. iOS-Style Home Indicator Bar (displayed when dock is hidden) */}
      <AnimatePresence>
        {!isVisible && (
          <motion.div
            key="ios-home-indicator"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            className={`fixed bottom-2.5 inset-x-0 mx-auto w-fit z-40 hidden md:flex flex-col items-center select-none ${className}`}
            onMouseEnter={handleBottomMouseEnter}
            onMouseLeave={handleBottomMouseLeave}
            onClick={handleTriggerClick}
          >
            {/* Interactive Hit Area (generous touch & hover target) */}
            <div className="relative py-2.5 px-8 flex flex-col items-center cursor-pointer group">
              {/* Floating micro-hint when holding */}
              <AnimatePresence>
                {isHoldingBottom && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: -6, scale: 1 }}
                    exit={{ opacity: 0, y: 2, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute -top-7 px-2.5 py-0.5 rounded-full bg-[#0F1424]/90 backdrop-blur-md border border-white/15 text-[10px] font-mono tracking-tight text-white whitespace-nowrap shadow-xl flex items-center gap-1.5 pointer-events-none"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span>Segure 1.5s para expandir Dock</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* iOS Home Indicator Pill */}
              <div className="relative w-36 h-[5px] rounded-full bg-white/40 hover:bg-white/70 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.35)] overflow-hidden border border-white/20 transition-all duration-300 group-hover:w-44 group-hover:shadow-[0_0_14px_rgba(255,255,255,0.45)]">
                {/* Hold progress indicator bar (fills over 1.5s) */}
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: isHoldingBottom ? '100%' : '0%' }}
                  transition={{ duration: isHoldingBottom ? 1.5 : 0.2, ease: 'linear' }}
                  className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. macOS Dock Container (revealed when isVisible is true) */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            key="macos-dock-panel"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            className={`fixed bottom-4 inset-x-0 mx-auto w-fit z-40 hidden md:flex items-end justify-center pointer-events-auto overflow-visible pt-12 ${className}`}
            onMouseEnter={handleDockMouseEnter}
            onMouseMove={handleDockMouseMove}
            onMouseLeave={handleDockMouseLeave}
          >
            {/* Glassmorphic Dock Container with strictly fixed height */}
            <motion.nav className="relative flex items-center gap-2.5 px-3 h-[68px] min-h-[68px] max-h-[68px] rounded-3xl overflow-visible select-none">
              {/* Fixed Height Background Pill (never grows or stretches) */}
              <div className="absolute inset-0 h-[68px] rounded-3xl bg-[#141829]/80 hover:bg-[#141829]/90 backdrop-blur-2xl border border-white/12 shadow-[0_16px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] pointer-events-none transition-colors" />

              {/* Core Apps */}
              {dockApps.map((app) => (
                <DockItem
                  key={app.id}
                  mouseX={mouseX}
                  label={app.label}
                  icon={app.icon}
                  isActive={app.isActive}
                  onClick={() => {
                    if (onOpenApp && app.appId) {
                      onOpenApp(app.appId);
                    } else if (app.isAction && app.onClick) {
                      app.onClick();
                    } else if (app.route) {
                      navigateTo(app.route);
                    }
                  }}
                />
              ))}

              {/* Vertical Divider line (from Framer Dock) */}
              <div className="w-[1px] h-8 bg-white/15 my-auto mx-0.5 rounded-full shrink-0 z-10" />

              {/* Profile Avatar (from Framer Dock) */}
              <DockItem
                mouseX={mouseX}
                label={`${userProfile.name} • Ajustes`}
                isActive={currentRoute === '/configuracoes'}
                onClick={() => navigateTo('/configuracoes')}
                icon={
                  <div className="w-full h-full rounded-2xl overflow-hidden border border-white/20 shadow-md relative bg-[#101114] group">
                    <img
                      src={ASSETS.avatarRafael}
                      alt={userProfile.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black" />
                  </div>
                }
              />
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
