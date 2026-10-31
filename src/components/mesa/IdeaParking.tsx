import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Project, Stage, Idea } from '../../types';
import { useApp } from '../../context/AppContext';
import { getBoardRules, canAddCard } from '../../lib/boardRules';
import {
  Lightbulb,
  Plus,
  Trash2,
  ArrowRightCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X,
  CheckCircle2,
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface IdeaParkingProps {
  project: Project;
  stages: Stage[];
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const IdeaParking: React.FC<IdeaParkingProps> = ({
  project,
  stages,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const {
    ideas,
    tasks,
    addIdea,
    discardIdea,
    restoreIdea,
    promoteIdea,
    showToast,
    userProfile
  } = useApp();

  const rules = getBoardRules(userProfile);
  const [inputText, setInputText] = useState('');
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [promotedExpanded, setPromotedExpanded] = useState(false);
  const [promoteMenuIdeaId, setPromoteMenuIdeaId] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mobileInputRef = useRef<HTMLTextAreaElement>(null);

  // Active ideas: for this project, not promoted, not discarded, newest first
  const activeIdeas = useMemo(() => {
    return ideas
      .filter(
        (i) =>
          i.projectId === project.id &&
          !i.promotedTaskId &&
          !i.discardedAt
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [ideas, project.id]);

  // Promoted ideas: for this project, has promotedTaskId, not discarded
  const promotedIdeas = useMemo(() => {
    return ideas
      .filter((i) => i.projectId === project.id && Boolean(i.promotedTaskId))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [ideas, project.id]);

  const currentStage = stages.find((s) => s.status === 'atual');

  // Global "i" keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'i' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const active = document.activeElement;
        const isInputFocused =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          active?.getAttribute('contenteditable') === 'true';

        // Check if any dialog or modal is currently open
        const isDialogOpen = document.querySelector('[role="dialog"]') !== null;

        if (!isInputFocused && !isDialogOpen) {
          e.preventDefault();
          setIsDesktopCollapsed(false);
          // If on mobile/tablet, open sheet
          if (window.innerWidth < 1280 && onCloseMobile) {
            // Signal to open mobile
            const btn = document.getElementById('open-mobile-ideas-btn');
            if (btn) btn.click();
          }
          setTimeout(() => {
            if (window.innerWidth >= 1280) {
              inputRef.current?.focus();
            } else {
              mobileInputRef.current?.focus();
            }
          }, 60);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCloseMobile]);

  // Handle adding an idea
  const handleAddSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    addIdea(project.id, text);
    setInputText('');
  };

  // Handle discarding an idea with undo toast for 5 seconds
  const handleDiscard = (idea: Idea) => {
    discardIdea(idea.id);
    showToast(
      'Ideia descartada',
      `"${idea.text.slice(0, 45)}${idea.text.length > 45 ? '...' : ''}" foi descartada.`,
      'info',
      {
        action: {
          label: 'Desfazer',
          onClick: () => restoreIdea(idea.id)
        },
        duration: 5000
      }
    );
  };

  // Handle promoting an idea to a stage
  const handlePromoteToStage = (idea: Idea, targetStage: Stage) => {
    const violation = canAddCard(tasks, targetStage, rules);
    if (violation) {
      showToast(
        'Etapa com limite atingido',
        `${violation.message} ${violation.hint}`,
        'warning'
      );
      return;
    }

    promoteIdea(idea.id, targetStage.id);
    setPromoteMenuIdeaId(null);
  };

  // Find candidate future stage when current stage is full
  const availableFutureStage = useMemo(() => {
    return stages.find(
      (s) => s.status === 'futura' && !canAddCard(tasks, s, rules)
    );
  }, [stages, tasks, rules]);

  // Reusable Main Ideas Content inside Panel or Bottom Sheet
  const renderPanelContent = (isMobileSheet = false) => {
    const currentInputRef = isMobileSheet ? mobileInputRef : inputRef;

    return (
      <div className="flex flex-col h-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#D7FF3F]/10 flex items-center justify-center text-[#D7FF3F]">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight font-display">
                Estacionamento de Ideias
              </h3>
              <p className="text-[11px] text-[#8D9298]">
                Guarde agora para não desviar a etapa atual.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-[#D7FF3F] text-[#101114] text-xs font-bold tabular-nums">
              {activeIdeas.length}
            </span>
            {isMobileSheet ? (
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1 text-[#8D9298] hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsDesktopCollapsed(true)}
                title="Recolher painel"
                className="p-1 text-[#8D9298] hover:text-white rounded-lg cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Input section: 280 chars max */}
        <div className="space-y-1.5">
          <form onSubmit={handleAddSubmit} className="space-y-1.5">
            <div className="relative">
              <textarea
                ref={currentInputRef}
                rows={2}
                maxLength={280}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddSubmit();
                  }
                }}
                placeholder="Anotar ideia… (Enter para salvar)"
                className="w-full px-3 py-2 text-xs bg-[#101114] text-white border border-white/15 rounded-xl focus:outline-none focus:border-[#D7FF3F] placeholder:text-[#8D9298] leading-relaxed resize-none shadow-inner"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#8D9298]">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] text-[#F3F0EB] font-mono">
                  i
                </kbd>
                <span>para anotar</span>
              </span>

              <div className="flex items-center gap-2">
                <span
                  className={`tabular-nums ${
                    inputText.length > 250
                      ? 'text-[#D7FF3F] font-bold'
                      : 'text-[#8D9298]'
                  }`}
                >
                  {inputText.length}/280
                </span>
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-3 py-1 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-[#c2ef26] rounded-lg cursor-pointer disabled:opacity-30 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Note if more than 8 active ideas */}
        {activeIdeas.length > 8 && (
          <div className="p-3 bg-[#D7FF3F]/10 border border-[#D7FF3F]/30 rounded-xl text-xs text-[#D7FF3F] flex items-start gap-2 animate-in fade-in duration-150">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-snug text-[#F3F0EB]">
              <p className="font-semibold text-[#D7FF3F]">Muitas ideias acumuladas</p>
              <p className="text-[11px] text-[#8D9298]">
                Que tal revisar o estacionamento? Descarte o que não importa mais.
              </p>
            </div>
          </div>
        )}

        {/* Active Ideas List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 custom-scrollbar">
          {activeIdeas.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8D9298] space-y-1">
              <p>Nenhuma ideia estacionada.</p>
              <p className="text-[11px]">
                Teve um insight fora da etapa atual? Anote aqui.
              </p>
            </div>
          ) : (
            activeIdeas.map((idea) => {
              const isMenuOpen = promoteMenuIdeaId === idea.id;
              const currentStageViolation = currentStage
                ? canAddCard(tasks, currentStage, rules)
                : null;

              return (
                <div
                  key={idea.id}
                  className="bg-[#101114] border border-white/10 rounded-xl p-3 space-y-2 shadow-xs hover:border-white/20 transition-colors relative"
                >
                  <p className="text-xs text-[#F3F0EB] leading-relaxed font-medium break-words">
                    {idea.text}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                    <span className="text-[#8D9298]">
                      {new Date(idea.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Virar cartão menu toggle */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setPromoteMenuIdeaId(isMenuOpen ? null : idea.id)
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold text-[#101114] bg-[#D7FF3F] hover:bg-[#c2ef26] rounded-md cursor-pointer transition-colors"
                        >
                          <span>Virar cartão</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>

                        {/* Stage selection popover */}
                        {isMenuOpen && (
                          <div className="absolute right-0 bottom-full mb-1 w-64 bg-[#16181D] border border-white/15 rounded-xl shadow-2xl p-2 z-40 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8D9298] px-1">
                              Promover para etapa:
                            </div>

                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {stages.map((stg) => {
                                const violation = canAddCard(tasks, stg, rules);
                                const isAtual = stg.status === 'atual';

                                return (
                                  <button
                                    key={stg.id}
                                    type="button"
                                    onClick={() => handlePromoteToStage(idea, stg)}
                                    className={`w-full p-2 text-left rounded-lg text-xs transition-colors cursor-pointer flex flex-col gap-0.5 ${
                                      violation
                                        ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                                        : isAtual
                                        ? 'bg-[#D7FF3F]/10 border border-[#D7FF3F]/30 hover:bg-[#D7FF3F]/20 text-white font-semibold'
                                        : 'hover:bg-white/5 text-[#F3F0EB]'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="truncate">{stg.title}</span>
                                      <span
                                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                                          isAtual
                                            ? 'bg-[#D7FF3F] text-[#101114]'
                                            : 'bg-white/10 text-[#8D9298]'
                                        }`}
                                      >
                                        {isAtual ? 'Atual' : 'Futura'}
                                      </span>
                                    </div>

                                    {violation && (
                                      <span className="text-[10px] text-rose-400">
                                        {violation.message}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Suggestion when current stage is blocked */}
                            {currentStageViolation && availableFutureStage && (
                              <div className="pt-1 border-t border-white/10">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handlePromoteToStage(idea, availableFutureStage)
                                  }
                                  className="w-full p-1.5 text-left text-[11px] font-semibold text-[#D7FF3F] bg-[#D7FF3F]/10 hover:bg-[#D7FF3F]/20 rounded-lg cursor-pointer flex items-center gap-1"
                                >
                                  <Sparkles className="w-3 h-3 text-[#D7FF3F] shrink-0" />
                                  <span className="truncate">
                                    Promover para &quot;{availableFutureStage.title}&quot;
                                  </span>
                                </button>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => setPromoteMenuIdeaId(null)}
                              className="w-full text-center py-1 text-[10px] text-[#8D9298] hover:text-white cursor-pointer"
                            >
                              Fechar
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Descartar */}
                      <button
                        type="button"
                        onClick={() => handleDiscard(idea)}
                        title="Descartar ideia"
                        className="p-1 text-[#8D9298] hover:text-rose-400 rounded cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Promoted Ideas (Já viraram cartão) Collapsible Section */}
          {promotedIdeas.length > 0 && (
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setPromotedExpanded(!promotedExpanded)}
                className="w-full flex items-center justify-between text-xs font-semibold text-[#8D9298] hover:text-white py-1.5 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#D7FF3F]" />
                  <span>Já viraram cartão ({promotedIdeas.length})</span>
                </span>
                {promotedExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#8D9298]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#8D9298]" />
                )}
              </button>

              {promotedExpanded && (
                <div className="mt-2 space-y-1.5 animate-in fade-in duration-150">
                  {promotedIdeas.map((idea) => (
                    <div
                      key={idea.id}
                      className="p-2 bg-[#101114]/60 border border-white/5 rounded-lg text-xs text-[#8D9298] flex items-start gap-1.5 opacity-80"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#D7FF3F] shrink-0 mt-0.5" />
                      <span className="line-through flex-1">{idea.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer text: "Ideias esperam. A etapa atual não." */}
        <div className="pt-2 border-t border-white/10 text-center">
          <p className="text-[11px] text-[#8D9298] italic">
            Ideias esperam. A etapa atual não.
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 1. Desktop Panel (>= 1280px) */}
      <div className="hidden xl:block shrink-0">
        {isDesktopCollapsed ? (
          /* Collapsed strip on desktop */
          <div className="sticky top-24 self-start bg-[#16181D] border border-white/10 rounded-2xl p-2.5 shadow-xl flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDesktopCollapsed(false)}
              title="Expandir Estacionamento de Ideias"
              className="p-2 text-[#8D9298] hover:text-white hover:bg-white/5 rounded-xl cursor-pointer transition-colors flex flex-col items-center gap-1.5"
            >
              <Lightbulb className="w-5 h-5 text-[#D7FF3F]" />
              <span className="text-[10px] font-bold text-white writing-mode-vertical">
                Ideias
              </span>
              <span className="w-5 h-5 rounded-full bg-[#D7FF3F] text-[#101114] text-[10px] font-bold flex items-center justify-center">
                {activeIdeas.length}
              </span>
            </button>
          </div>
        ) : (
          /* Full Sticky Panel on desktop */
          <aside
            aria-label="Estacionamento de ideias"
            className="w-80 sticky top-24 self-start bg-[#16181D] border border-white/10 rounded-2xl p-4 shadow-xl max-h-[calc(100vh-7rem)] flex flex-col"
          >
            {renderPanelContent(false)}
          </aside>
        )}
      </div>

      {/* 2. Mobile / Tablet Floating Trigger Button (< 1280px) */}
      <div className="xl:hidden fixed bottom-5 right-5 z-40">
        <button
          id="open-mobile-ideas-btn"
          type="button"
          onClick={() => {
            if (onCloseMobile) {
              // Trigger mobile open
              const customEv = new CustomEvent('open-ideas-mobile');
              window.dispatchEvent(customEv);
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#16181D] text-white font-bold text-xs shadow-2xl hover:bg-[#1f2229] transition-colors cursor-pointer border border-white/15"
        >
          <Lightbulb className="w-4 h-4 text-[#D7FF3F]" />
          <span>Estacionamento ({activeIdeas.length})</span>
        </button>
      </div>

      {/* 3. Mobile Bottom Sheet (< 1280px) */}
      {isMobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Estacionamento de Ideias"
          className="xl:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={onCloseMobile}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[85vh] h-[78vh] bg-[#16181D] border-t border-white/10 rounded-t-2xl p-5 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
          >
            {renderPanelContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
