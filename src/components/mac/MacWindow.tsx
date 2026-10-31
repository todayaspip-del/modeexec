import React, { useRef, useState, useCallback, useEffect } from 'react';
import { X, Minus, Maximize2, Sparkles } from 'lucide-react';
import { WindowState } from '../../hooks/useWindowManager';

interface MacWindowProps {
  window: WindowState;
  isActive: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onSizeChange: (size: { width: number; height: number }, pos?: { x: number; y: number }) => void;
  onSnap: (snap: 'left' | 'right' | 'top') => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  contentClassName?: string;
  onReintegrate?: () => void;
}

export const MacWindow: React.FC<MacWindowProps> = ({
  window: win,
  isActive,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onPositionChange,
  onSizeChange,
  onSnap,
  children,
  icon,
  contentClassName,
  onReintegrate
}) => {
  const windowRef = useRef<HTMLDivElement>(null);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0
  });

  // Resizing state
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const resizeStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  }>({ mouseX: 0, mouseY: 0, startX: 0, startY: 0, startW: 0, startH: 0 });

  // Snap ghost indicator state
  const [snapPreview, setSnapPreview] = useState<'top' | 'left' | 'right' | null>(null);

  // Calculate actual rendered dimensions & position based on snap / maximize state
  const computedStyle: React.CSSProperties = React.useMemo(() => {
    if (win.isMaximized || win.isSnapped === 'top') {
      return {
        top: 28, // Below macOS top bar (28px)
        left: 0,
        width: '100vw',
        height: 'calc(100vh - 28px - 60px)', // Leave space for Dock
        transform: 'none',
        zIndex: win.zIndex
      };
    }

    if (win.isSnapped === 'left') {
      return {
        top: 28,
        left: 0,
        width: '50vw',
        height: 'calc(100vh - 28px - 60px)',
        transform: 'none',
        zIndex: win.zIndex
      };
    }

    if (win.isSnapped === 'right') {
      return {
        top: 28,
        left: '50vw',
        width: '50vw',
        height: 'calc(100vh - 28px - 60px)',
        transform: 'none',
        zIndex: win.zIndex
      };
    }

    return {
      top: win.position.y,
      left: win.position.x,
      width: win.size.width,
      height: win.size.height,
      zIndex: win.zIndex
    };
  }, [win.isMaximized, win.isSnapped, win.position, win.size, win.zIndex]);

  // --------------------------------------------------------------------------
  // TITLEBAR DRAGGING (Pointer Capture)
  // --------------------------------------------------------------------------
  const handleTitleBarPointerDown = (e: React.PointerEvent) => {
    // Ignore button clicks on traffic lights
    if ((e.target as HTMLElement).closest('button')) return;

    onFocus();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: win.position.x,
      startY: win.position.y
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleTitleBarPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    let newX = dragStartRef.current.startX + deltaX;
    let newY = dragStartRef.current.startY + deltaY;

    // Boundaries: don't let window disappear above top bar (28px)
    if (newY < 28) newY = 28;

    // Check edge snapping thresholds (macOS Sequoia style)
    if (e.clientY < 38) {
      setSnapPreview('top');
    } else if (e.clientX < 20) {
      setSnapPreview('left');
    } else if (e.clientX > window.innerWidth - 20) {
      setSnapPreview('right');
    } else {
      setSnapPreview(null);
    }

    onPositionChange({ x: newX, y: newY });
  };

  const handleTitleBarPointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    // Apply snap if pointer released on edge
    if (snapPreview) {
      onSnap(snapPreview);
      setSnapPreview(null);
    }
  };

  // --------------------------------------------------------------------------
  // 8-POINT WINDOW RESIZING (Pointer Capture)
  // --------------------------------------------------------------------------
  const handleResizePointerDown = (direction: string, e: React.PointerEvent) => {
    e.stopPropagation();
    onFocus();
    setIsResizing(direction);

    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: win.position.x,
      startY: win.position.y,
      startW: win.size.width,
      startH: win.size.height
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizePointerMove = (e: React.PointerEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - resizeStartRef.current.mouseX;
    const deltaY = e.clientY - resizeStartRef.current.mouseY;

    const MIN_WIDTH = 420;
    const MIN_HEIGHT = 300;

    let newW = resizeStartRef.current.startW;
    let newH = resizeStartRef.current.startH;
    let newX = resizeStartRef.current.startX;
    let newY = resizeStartRef.current.startY;

    if (isResizing.includes('e')) {
      newW = Math.max(MIN_WIDTH, resizeStartRef.current.startW + deltaX);
    }
    if (isResizing.includes('s')) {
      newH = Math.max(MIN_HEIGHT, resizeStartRef.current.startH + deltaY);
    }
    if (isResizing.includes('w')) {
      const prospectiveW = resizeStartRef.current.startW - deltaX;
      if (prospectiveW >= MIN_WIDTH) {
        newW = prospectiveW;
        newX = resizeStartRef.current.startX + deltaX;
      }
    }
    if (isResizing.includes('n')) {
      const prospectiveH = resizeStartRef.current.startH - deltaY;
      if (prospectiveH >= MIN_HEIGHT) {
        newH = prospectiveH;
        newY = Math.max(28, resizeStartRef.current.startY + deltaY);
      }
    }

    onSizeChange({ width: newW, height: newH }, { x: newX, y: newY });
  };

  const handleResizePointerUp = (e: React.PointerEvent) => {
    if (!isResizing) return;
    setIsResizing(null);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // If window is minimized or closed, don't render
  if (!win.isOpen || win.isMinimized) {
    return null;
  }

  return (
    <>
      {/* Ghost snap indicator */}
      {snapPreview && (
        <div
          className={`fixed pointer-events-none z-50 border-2 border-blue-400 bg-blue-500/15 backdrop-blur-xs rounded-2xl transition-all duration-150 animate-pulse ${
            snapPreview === 'top'
              ? 'top-7 inset-x-0 h-[calc(100vh-28px-60px)]'
              : snapPreview === 'left'
              ? 'top-7 left-0 w-1/2 h-[calc(100vh-28px-60px)]'
              : 'top-7 right-0 w-1/2 h-[calc(100vh-28px-60px)]'
          }`}
        />
      )}

      {/* Main macOS Window Shell */}
      <div
        ref={windowRef}
        onPointerDown={onFocus}
        style={computedStyle}
        className={`fixed flex flex-col rounded-2xl overflow-hidden transition-shadow select-none ${
          isActive
            ? 'shadow-[0_25px_65px_rgba(0,0,0,0.65)] ring-1 ring-white/20'
            : 'shadow-[0_15px_35px_rgba(0,0,0,0.4)] opacity-95 ring-1 ring-white/10'
        }`}
      >
        {/* ================================================================== */}
        {/* WINDOW TITLE BAR (Draggable)                                      */}
        {/* ================================================================== */}
        <div
          onPointerDown={handleTitleBarPointerDown}
          onPointerMove={handleTitleBarPointerMove}
          onPointerUp={handleTitleBarPointerUp}
          onDoubleClick={onToggleMaximize}
          className={`h-10 px-3.5 flex items-center justify-between shrink-0 cursor-grab active:cursor-grabbing border-b select-none transition-colors ${
            isActive
              ? 'bg-[#1e2338]/95 dark:bg-[#0c0f1d]/95 backdrop-blur-2xl border-white/15 text-white'
              : 'bg-[#181c2e]/80 dark:bg-[#090b16]/80 backdrop-blur-md border-white/10 text-white/60'
          }`}
        >
          {/* macOS Traffic Lights */}
          <div className="flex items-center gap-2 group shrink-0">
            {/* Red: Close Window */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              title="Fechar Janela"
              className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] hover:opacity-85 transition-opacity flex items-center justify-center cursor-pointer"
            >
              <X className="w-2 h-2 text-[#4c0002] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Yellow: Minimize to Dock */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMinimize();
              }}
              title="Minimizar para o Dock"
              className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] hover:opacity-85 transition-opacity flex items-center justify-center cursor-pointer"
            >
              <Minus className="w-2 h-2 text-[#5a3a00] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Green: Maximize / Restore */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMaximize();
              }}
              title={win.isMaximized ? 'Restaurar Janela' : 'Maximizar Janela'}
              className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] hover:opacity-85 transition-opacity flex items-center justify-center cursor-pointer"
            >
              <Maximize2 className="w-1.5 h-1.5 text-[#004d11] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          {/* Window Center: Title & Optional Icon */}
          <div className="flex items-center gap-2 truncate px-2 font-medium text-xs">
            {icon && <span className="shrink-0">{icon}</span>}
            <span className="truncate font-semibold tracking-tight">{win.title}</span>
          </div>

          {/* Window Right: Side-by-Side Controls & Status */}
          <div className="flex items-center gap-1.5 shrink-0 pr-1">
            {onReintegrate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReintegrate();
                }}
                title="Fechar e reintegrar na Janela Principal"
                className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white/10 hover:bg-white/20 text-white/90 transition-colors cursor-pointer border border-white/10 shadow-xs"
              >
                <span>Reintegrar</span>
              </button>
            )}

            {/* Quick Snap Side-by-Side Controls */}
            <div className="flex items-center gap-0.5 bg-white/10 rounded-md p-0.5 border border-white/10" title="Posicionamento Lado a Lado">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (win.isSnapped === 'left') {
                    onToggleMaximize();
                  } else {
                    onSnap('left');
                  }
                }}
                title={win.isSnapped === 'left' ? 'Desencaixar da esquerda' : 'Encaixar à esquerda (Lado a Lado 50%)'}
                className={`p-1 rounded hover:bg-white/20 transition-colors cursor-pointer ${
                  win.isSnapped === 'left' ? 'bg-blue-500/40 text-blue-300' : 'text-white/60 hover:text-white'
                }`}
              >
                <div className="w-2.5 h-2.5 border border-current rounded-xs flex">
                  <div className="w-1/2 h-full bg-current" />
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (win.isSnapped === 'right') {
                    onToggleMaximize();
                  } else {
                    onSnap('right');
                  }
                }}
                title={win.isSnapped === 'right' ? 'Desencaixar da direita' : 'Encaixar à direita (Lado a Lado 50%)'}
                className={`p-1 rounded hover:bg-white/20 transition-colors cursor-pointer ${
                  win.isSnapped === 'right' ? 'bg-blue-500/40 text-blue-300' : 'text-white/60 hover:text-white'
                }`}
              >
                <div className="w-2.5 h-2.5 border border-current rounded-xs flex justify-end">
                  <div className="w-1/2 h-full bg-current" />
                </div>
              </button>
            </div>

            <span className="text-[10px] font-mono text-white/30 hidden md:inline ml-1">
              macOS
            </span>
          </div>
        </div>

        {/* ================================================================== */}
        {/* WINDOW BODY VIEWPORT (Scrollable)                                 */}
        {/* ================================================================== */}
        <div className={contentClassName || "flex-1 overflow-y-auto overflow-x-hidden bg-[#F7F8FA] dark:bg-[#10142B] custom-scrollbar relative"}>
          {children}
        </div>

        {/* ================================================================== */}
        {/* 8-POINT RESIZE HANDLES (Native Pointer Capture)                   */}
        {/* ================================================================== */}
        {!win.isMaximized && !win.isSnapped && (
          <>
            {/* North Edge */}
            <div
              onPointerDown={(e) => handleResizePointerDown('n', e)}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
              className="absolute top-0 left-2 right-2 h-1 cursor-ns-resize z-30"
            />
            {/* South Edge */}
            <div
              onPointerDown={(e) => handleResizePointerDown('s', e)}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
              className="absolute bottom-0 left-2 right-2 h-2 cursor-ns-resize z-30"
            />
            {/* West Edge */}
            <div
              onPointerDown={(e) => handleResizePointerDown('w', e)}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
              className="absolute top-2 bottom-2 left-0 w-2 cursor-ew-resize z-30"
            />
            {/* East Edge */}
            <div
              onPointerDown={(e) => handleResizePointerDown('e', e)}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
              className="absolute top-2 bottom-2 right-0 w-2 cursor-ew-resize z-30"
            />
            {/* North-West Corner */}
            <div
              onPointerDown={(e) => handleResizePointerDown('nw', e)}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
              className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize z-30"
            />
            {/* North-East Corner */}
            <div
              onPointerDown={(e) => handleResizePointerDown('ne', e)}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
              className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize z-30"
            />
            {/* South-West Corner */}
            <div
              onPointerDown={(e) => handleResizePointerDown('sw', e)}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
              className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize z-30"
            />
            {/* South-East Corner */}
            <div
              onPointerDown={(e) => handleResizePointerDown('se', e)}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
              className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-30 flex items-end justify-end p-0.5"
            >
              {/* Subtle corner indicator lines */}
              <div className="w-1.5 h-1.5 border-r border-b border-slate-400/50" />
            </div>
          </>
        )}
      </div>
    </>
  );
};
