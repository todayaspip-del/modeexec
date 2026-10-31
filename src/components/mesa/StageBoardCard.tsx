import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskStatus } from '../../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, Star, CheckSquare, MoveRight, ChevronDown, Scale, MessageSquareWarning, ExternalLink } from 'lucide-react';
import { BLOCKER_REASON_LABELS } from '../../data/blockerCopy';
import { useApp } from '../../context/AppContext';

export type BoardColumnStatus = 'pronta' | 'em_andamento' | 'bloqueada' | 'concluida';

export const COLUMN_DEFINITIONS: {
  status: BoardColumnStatus;
  title: string;
}[] = [
  { status: 'pronta', title: 'A fazer' },
  { status: 'em_andamento', title: 'Fazendo' },
  { status: 'bloqueada', title: 'Travado' },
  { status: 'concluida', title: 'Feito' }
];

export interface StageBoardCardProps {
  task: Task;
  onOpenCard?: (task: Task, options?: { focus?: string }) => void;
  onMoveToStatus?: (task: Task, targetStatus: TaskStatus) => void;
  isOverlay?: boolean;
}

const StageBoardCardInner: React.FC<StageBoardCardProps> = ({
  task,
  onOpenCard,
  onMoveToStatus,
  isOverlay = false
}) => {
  const { navigateTo } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
      status: task.status
    },
    disabled: isOverlay
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1
  };

  const checklistTotal = task.checklist?.length ?? 0;
  const checklistDone = task.checklist?.filter((c) => c.done).length ?? 0;

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking menu, don't trigger card open
    if (menuRef.current && menuRef.current.contains(e.target as Node)) {
      return;
    }
    // TODO(1.6): open card drawer
    onOpenCard?.(task);
  };

  const handleMoveClick = (targetStatus: TaskStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    onMoveToStatus?.(task, targetStatus);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={`group relative bg-[#16181D] border rounded-xl p-3.5 space-y-2.5 transition-all select-none cursor-grab active:cursor-grabbing shadow-sm ${
        isOverlay
          ? 'shadow-2xl border-[#D7FF3F] ring-2 ring-[#D7FF3F]/30 rotate-1 scale-102 z-50'
          : 'border-white/10 hover:border-white/25 hover:shadow-md'
      }`}
    >
      {/* Top row: tags, star and mover menu */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Duration chip */}
          <span className="inline-flex items-center gap-1 text-[11px] bg-black/40 text-[#8D9298] border border-white/10 px-2 py-0.5 rounded-md font-medium tabular-nums">
            <Clock className="w-3 h-3 text-[#8D9298]" />
            <span>{task.durationMinutes} min</span>
          </span>

          {/* Checklist progress */}
          {checklistTotal > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-black/40 text-[#8D9298] border border-white/10 px-2 py-0.5 rounded-md font-medium tabular-nums">
              <CheckSquare className="w-3 h-3 text-[#8D9298]" />
              <span>
                {checklistDone}/{checklistTotal}
              </span>
            </span>
          )}

          {/* Star for isNextPhysicalAction */}
          {task.isNextPhysicalAction && (
            <span
              title="Próxima ação física imediata"
              aria-label="Próxima ação física imediata"
              className="inline-flex items-center"
            >
              <Star className="w-4 h-4 fill-[#D7FF3F] text-[#D7FF3F] shrink-0" />
            </span>
          )}
        </div>

        {/* Accessibility fallback / "Mover para..." menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            aria-label="Mover cartão"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1 text-[#8D9298] hover:text-white hover:bg-white/10 rounded-md cursor-pointer transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1 w-40 bg-[#16181D] border border-white/15 rounded-xl shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-3 py-1 text-[10px] font-bold text-[#8D9298] uppercase tracking-wider">
                Mover para:
              </div>
              {COLUMN_DEFINITIONS.map((col) => {
                const isCurrent = col.status === task.status;
                return (
                  <button
                    key={col.status}
                    disabled={isCurrent}
                    onClick={(e) => handleMoveClick(col.status, e)}
                    className={`w-full px-3 py-1.5 text-xs text-left flex items-center justify-between cursor-pointer ${
                      isCurrent
                        ? 'text-white/20 cursor-not-allowed bg-white/5'
                        : 'text-[#F3F0EB] hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{col.title}</span>
                    {!isCurrent && <MoveRight className="w-3 h-3 text-[#8D9298]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Card Title (2-line clamp) */}
      <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">
        {task.title}
      </h4>

      {/* Expected evidence (one-line clamp or amber chip) */}
      <div className="pt-0.5">
        {task.expectedEvidence && task.expectedEvidence.trim() ? (
          <p
            className="text-xs text-[#8D9298] truncate leading-relaxed"
            title={`Termina quando: ${task.expectedEvidence}`}
          >
            <span className="font-semibold text-white">Termina quando: </span>
            {task.expectedEvidence}
          </p>
        ) : (
          <span className="inline-block text-[11px] bg-amber-950/40 text-amber-300 border border-amber-800/40 font-medium px-2 py-0.5 rounded-md">
            falta evidência
          </span>
        )}
      </div>

      {/* Blocked state contextual chips */}
      {task.status === 'bloqueada' && (
        <div className="pt-1 flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {task.blockedReasonKey && (
            <span className="inline-flex items-center text-[10px] font-semibold bg-amber-950/40 border border-amber-800/40 text-amber-300 px-2 py-0.5 rounded-md">
              {BLOCKER_REASON_LABELS[task.blockedReasonKey] || task.blockedReasonKey}
            </span>
          )}

          {task.decisionId && (
            <button
              type="button"
              onClick={() => navigateTo('/app/decisoes')}
              className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#D7FF3F] text-[#101114] hover:bg-white px-2 py-0.5 rounded-md cursor-pointer transition-colors shadow-2xs"
            >
              <Scale className="w-2.5 h-2.5 text-[#101114]" />
              <span>Decisão pendente</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </button>
          )}

          {task.conversationSlug && (
            <button
              type="button"
              onClick={() => navigateTo(`/app/conversas?cenario=${task.conversationSlug}`)}
              className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#D7FF3F]/15 border border-[#D7FF3F]/30 text-[#D7FF3F] hover:bg-[#D7FF3F]/25 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
            >
              <MessageSquareWarning className="w-2.5 h-2.5 text-[#D7FF3F]" />
              <span>Conversa</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </button>
          )}

          {task.blockedReason && !task.blockedReasonKey && (
            <span className="text-[10px] text-amber-300 italic truncate max-w-full">
              "{task.blockedReason}"
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const StageBoardCard = React.memo(StageBoardCardInner);
