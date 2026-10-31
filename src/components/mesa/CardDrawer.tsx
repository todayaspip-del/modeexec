import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Task, Stage, TaskStatus, ChecklistItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { getBoardRules, canMoveToDoing } from '../../lib/boardRules';
import {
  X,
  Clock,
  CheckSquare,
  Star,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Scissors,
  Check,
  Flag,
  FileCheck2,
  Calendar
} from 'lucide-react';
import { UnblockDialog } from './UnblockDialog';

interface CardDrawerProps {
  task: Task | null;
  stage: Stage | undefined;
  isOpen: boolean;
  onClose: () => void;
  initialFocusField?: 'evidence';
}

const STATUS_OPTIONS: { status: TaskStatus; label: string }[] = [
  { status: 'pronta', label: 'A fazer' },
  { status: 'em_andamento', label: 'Fazendo' },
  { status: 'bloqueada', label: 'Travado' },
  { status: 'concluida', label: 'Feito' }
];

const QUICK_MINUTES = [5, 10, 15, 25, 45];

export const CardDrawer: React.FC<CardDrawerProps> = ({
  task,
  stage,
  isOpen,
  onClose,
  initialFocusField
}) => {
  const {
    tasks,
    updateTask,
    deleteTask,
    moveCard,
    setNextPhysicalAction,
    splitCard,
    showToast,
    userProfile
  } = useApp();

  // Local state for all fields
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<TaskStatus>('pronta');
  const [expectedEvidence, setExpectedEvidence] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [minimumVersion, setMinimumVersion] = useState('');
  const [description, setDescription] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');

  // UI state
  const [savedIndicator, setSavedIndicator] = useState(false);
  const [inlineViolation, setInlineViolation] = useState<string | null>(null);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  // Blocker flow state
  const [blockingOpen, setBlockingOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  // Split card flow state
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitParts, setSplitParts] = useState<
    { title: string; durationMinutes: number; expectedEvidence: string }[]
  >([
    { title: '', durationMinutes: 15, expectedEvidence: '' },
    { title: '', durationMinutes: 15, expectedEvidence: '' }
  ]);

  const drawerRef = useRef<HTMLDivElement>(null);
  const evidenceRef = useRef<HTMLTextAreaElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const rules = getBoardRules(userProfile);

  // Sync state whenever task changes or drawer opens
  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title || '');
      setStatus(task.status || 'pronta');
      setExpectedEvidence(task.expectedEvidence || '');
      setDurationMinutes(task.durationMinutes || 25);
      setMinimumVersion(task.minimumVersion || '');
      setDescription(task.description || '');
      setChecklist(task.checklist || []);
      setEvidenceNote(task.evidenceNote || '');
      setInlineViolation(null);
      setEvidenceError(null);
      setBlockingOpen(false);
      setBlockReason(task.blockedReason || '');
      setSplitOpen(false);
    }
  }, [task, isOpen]);

  // Flash "Salvo" indicator
  const triggerSaved = useCallback(() => {
    setSavedIndicator(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setSavedIndicator(false);
    }, 1800);
  }, []);

  // Generic field save on blur
  const handleSaveField = useCallback(
    (field: keyof Task, value: unknown) => {
      if (!task) return;
      updateTask(task.id, { [field]: value });
      triggerSaved();
    },
    [task, updateTask, triggerSaved]
  );

  // Focus trap, Escape key, Cmd/Ctrl+Enter, body scroll lock, focus restoration
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement | null;

    // Body scroll lock
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Initial focus
    if (initialFocusField === 'evidence' && evidenceRef.current) {
      setTimeout(() => evidenceRef.current?.focus(), 80);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Cmd/Ctrl+Enter completes the card
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCompleteDirectly();
        return;
      }

      // Trap focus inside drawer
      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, initialFocusField, onClose]);

  // Complete card handler with evidence rule check
  const handleCompleteDirectly = () => {
    if (!task) return;
    if (!expectedEvidence.trim()) {
      setEvidenceError('Defina como você vai provar que terminou.');
      evidenceRef.current?.focus();
      return;
    }
    setEvidenceError(null);
    moveCard(task.id, { status: 'concluida' });
    setStatus('concluida');
    triggerSaved();
    showToast('Cartão Concluído!', `"${task.title}" foi concluído.`, 'success');
  };

  // Status change via segmented control
  const handleStatusChange = (newStatus: TaskStatus) => {
    if (!task || !stage) return;
    setInlineViolation(null);
    setEvidenceError(null);

    // Rule 1: completing requires expectedEvidence
    if (newStatus === 'concluida') {
      if (!expectedEvidence.trim()) {
        setEvidenceError('Defina como você vai provar que terminou.');
        evidenceRef.current?.focus();
        return;
      }
    }

    // Rule 2: moving to 'em_andamento' respects WIP limit
    if (newStatus === 'em_andamento' && task.status !== 'em_andamento') {
      const violation = canMoveToDoing(tasks, stage, rules, task.id);
      if (violation) {
        setInlineViolation(`${violation.message} ${violation.hint}`);
        return;
      }
    }

    // Rule 3: moving to 'bloqueada' prompts inline blocker
    if (newStatus === 'bloqueada') {
      setBlockingOpen(true);
      return;
    }

    moveCard(task.id, { status: newStatus });
    setStatus(newStatus);
    triggerSaved();
  };

  // Confirming blocked status
  const handleConfirmBlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!task || !blockReason.trim()) return;

    moveCard(task.id, { status: 'bloqueada' });
    updateTask(task.id, { blockedReason: blockReason.trim() });
    setStatus('bloqueada');
    setBlockingOpen(false);
    triggerSaved();
    showToast('Ação travada registrada', 'Impedimento anotado.', 'info');
  };

  // Checklist methods
  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim() || !task) return;

    const newItem: ChecklistItem = {
      id: `check-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: newChecklistText.trim(),
      done: false
    };
    const updated = [...checklist, newItem];
    setChecklist(updated);
    setNewChecklistText('');
    handleSaveField('checklist', updated);
  };

  const handleToggleChecklist = (id: string) => {
    if (!task) return;
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    );
    setChecklist(updated);
    handleSaveField('checklist', updated);
  };

  const handleDeleteChecklistItem = (id: string) => {
    if (!task) return;
    const updated = checklist.filter((item) => item.id !== id);
    setChecklist(updated);
    handleSaveField('checklist', updated);
  };

  const handleMoveChecklistItem = (index: number, direction: 'up' | 'down') => {
    if (!task) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= checklist.length) return;

    const updated = [...checklist];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setChecklist(updated);
    handleSaveField('checklist', updated);
  };

  // Split Card Submission
  const handleConfirmSplit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    const validParts = splitParts.filter((p) => p.title.trim().length > 0);
    if (validParts.length < 2) {
      showToast('Dividir Cartão', 'Preencha pelo menos duas partes com títulos.', 'warning');
      return;
    }

    const ok = splitCard(task.id, validParts);
    if (ok) {
      onClose();
    }
  };

  // Delete Card
  const handleDeleteCard = () => {
    if (!task) return;
    if (window.confirm(`Tem certeza que deseja excluir o cartão "${task.title}"?`)) {
      deleteTask(task.id);
      showToast('Cartão Excluído', 'O cartão foi removido.', 'info');
      onClose();
    }
  };

  if (!isOpen || !task) return null;

  const allChecklistDone =
    checklist.length > 0 && checklist.every((item) => item.done);
  const checklistDoneCount = checklist.filter((c) => c.done).length;

  const formattedCompletedAt = task.completedAt
    ? new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short'
      }).format(new Date(task.completedAt))
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes do cartão: ${task.title}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl h-full lg:max-w-lg bg-[#16181D] text-white shadow-2xl border-l border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200 sm:rounded-l-2xl"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-black/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8D9298]">
              Cartão da Etapa
            </span>
            {savedIndicator && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#101114] bg-[#D7FF3F] px-2 py-0.5 rounded-full animate-in fade-in duration-150">
                <Check className="w-3 h-3 text-[#101114]" />
                <span>Salvo</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="Fechar gaveta (Esc)"
              className="p-1.5 text-[#8D9298] hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 1. Title (required, inline editable) */}
          <div className="space-y-1.5">
            <label
              htmlFor="card-title-input"
              className="block text-xs font-bold text-[#8D9298] uppercase tracking-wider"
            >
              Ação física imediata *
            </label>
            <input
              id="card-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (title.trim()) {
                  handleSaveField('title', title.trim());
                } else {
                  setTitle(task.title);
                }
              }}
              placeholder="Ex.: Redigir a promessa em três linhas"
              className="w-full text-lg sm:text-xl font-display font-bold text-white border-b border-transparent hover:border-white/20 focus:border-[#D7FF3F] focus:outline-none py-1 transition-colors bg-transparent"
            />
          </div>

          {/* 2. Status Segmented Control */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#8D9298] uppercase tracking-wider">
              Status da ação
            </label>
            <div
              role="group"
              aria-label="Alterar status"
              className="grid grid-cols-4 p-1 bg-black/40 border border-white/10 rounded-xl gap-1 text-xs"
            >
              {STATUS_OPTIONS.map((opt) => {
                const isActive = status === opt.status;
                return (
                  <button
                    key={opt.status}
                    type="button"
                    onClick={() => handleStatusChange(opt.status)}
                    className={`py-2 px-1 text-center font-bold rounded-lg cursor-pointer transition-all truncate ${
                      isActive
                        ? 'bg-[#D7FF3F] text-[#101114] shadow-xs'
                        : 'text-[#8D9298] hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Inline Violation (e.g. WIP limit) */}
            {inlineViolation && (
              <div className="p-2.5 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{inlineViolation}</span>
              </div>
            )}
          </div>

          {/* 3. "Termina quando" (expectedEvidence) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="expected-evidence-textarea"
                className="block text-xs font-bold text-white flex items-center gap-1"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-[#D7FF3F]" />
                <span>Termina quando (Evidência Observável) *</span>
              </label>
              <span className="text-[11px] text-[#8D9298]">Obrigatório para concluir</span>
            </div>
            <textarea
              id="expected-evidence-textarea"
              ref={evidenceRef}
              rows={2}
              value={expectedEvidence}
              onChange={(e) => {
                setExpectedEvidence(e.target.value);
                if (evidenceError) setEvidenceError(null);
              }}
              onBlur={() => handleSaveField('expectedEvidence', expectedEvidence.trim())}
              placeholder="Ex.: Arquivo PDF salvo na pasta com os 3 parágrafos revisados..."
              className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-xl focus:outline-none focus:border-[#D7FF3F] transition-colors ${
                evidenceError
                  ? 'border-amber-400 bg-amber-950/30 text-white'
                  : 'border-white/15 bg-black/40 text-white placeholder:text-[#8D9298]/50'
              }`}
            />
            <p className="text-[11px] text-[#8D9298]">
              Algo que você consegue mostrar: um arquivo, uma mensagem enviada, um link.
            </p>
            {evidenceError && (
              <div className="text-xs text-amber-300 font-medium flex items-center gap-1.5 bg-amber-950/40 p-2 rounded-lg border border-amber-800/40">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{evidenceError}</span>
              </div>
            )}
          </div>

          {/* 4. Duration in minutes + Quick chips + Split hint */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#8D9298] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D7FF3F]" />
              <span>Duração Estimada (minutos)</span>
            </label>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min="5"
                max="180"
                step="5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                onBlur={() => handleSaveField('durationMinutes', Number(durationMinutes) || 20)}
                className="w-20 px-3 py-2 text-sm border border-white/15 rounded-lg text-center font-bold text-white bg-black/40 focus:border-[#D7FF3F] outline-none"
              />

              {/* Quick Chips */}
              <div className="flex flex-wrap gap-1.5">
                {QUICK_MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setDurationMinutes(m);
                      handleSaveField('durationMinutes', m);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg font-bold cursor-pointer transition-colors ${
                      durationMinutes === m
                        ? 'bg-[#D7FF3F] text-[#101114]'
                        : 'bg-black/30 border border-white/10 text-[#8D9298] hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {m} min
                  </button>
                ))}
              </div>
            </div>

            {/* Hint if over 45 minutes */}
            {durationMinutes > 45 && (
              <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Cartões longos travam. Que tal dividir?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSplitOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-lg cursor-pointer transition-colors"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Dividir em partes</span>
                </button>
              </div>
            )}

            {/* Mini form to split card into 2 to 4 parts */}
            {splitOpen && (
              <form
                onSubmit={handleConfirmSplit}
                className="p-4 bg-black/50 border border-white/15 rounded-xl space-y-3 animate-in fade-in zoom-in-98 duration-150"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-[#D7FF3F]" />
                    <span>Dividir &quot;{task.title}&quot; em partes</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSplitOpen(false)}
                    className="text-[#8D9298] hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-[#8D9298]">
                  O cartão atual será arquivado e as novas ações irão para o topo de &quot;A fazer&quot;.
                </p>

                <div className="space-y-2">
                  {splitParts.map((part, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#8D9298]">
                        <span>Parte {index + 1} {index === 0 ? '(Próximo passo físico)' : ''}</span>
                        {splitParts.length > 2 && (
                          <button
                            type="button"
                            onClick={() =>
                              setSplitParts((prev) => prev.filter((_, i) => i !== index))
                            }
                            className="text-rose-400 hover:underline cursor-pointer"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        placeholder={`Ação mecânica da parte ${index + 1}`}
                        value={part.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSplitParts((prev) =>
                            prev.map((p, i) => (i === index ? { ...p, title: val } : p))
                          );
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-black/40 border border-white/15 rounded-lg text-white focus:outline-none focus:border-[#D7FF3F]"
                      />
                    </div>
                  ))}
                </div>

                {splitParts.length < 4 && (
                  <button
                    type="button"
                    onClick={() =>
                      setSplitParts((prev) => [
                        ...prev,
                        { title: '', durationMinutes: 15, expectedEvidence: '' }
                      ])
                    }
                    className="text-xs text-[#D7FF3F] font-semibold hover:underline cursor-pointer"
                  >
                    + Adicionar outra parte (máx. 4)
                  </button>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setSplitOpen(false)}
                    className="px-3 py-1.5 text-xs text-[#8D9298] border border-white/15 rounded-lg cursor-pointer hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-lg cursor-pointer transition-colors"
                  >
                    Confirmar divisão
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 5. "Versão mínima aceitável" (minimumVersion) */}
          <div className="space-y-1">
            <label
              htmlFor="min-version-input"
              className="block text-xs font-bold text-[#8D9298] uppercase tracking-wider"
            >
              Versão mínima aceitável (opcional)
            </label>
            <input
              id="min-version-input"
              type="text"
              value={minimumVersion}
              onChange={(e) => setMinimumVersion(e.target.value)}
              onBlur={() => handleSaveField('minimumVersion', minimumVersion.trim())}
              placeholder="Ex.: Apenas tópicos principais em bullet points"
              className="w-full px-3 py-2 text-xs sm:text-sm border border-white/15 rounded-xl focus:outline-none focus:border-[#D7FF3F] bg-black/40 text-white placeholder:text-[#8D9298]/50"
            />
            <p className="text-[11px] text-[#8D9298]">O mínimo que já conta como feito.</p>
          </div>

          {/* 6. Description */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="description-textarea"
                className="block text-xs font-bold text-[#8D9298] uppercase tracking-wider"
              >
                Descrição e anotações
              </label>
              <span className="text-[11px] text-[#8D9298] tabular-nums">
                {description.length} / 2000
              </span>
            </div>
            <textarea
              id="description-textarea"
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => handleSaveField('description', description.trim())}
              placeholder="Contexto mecânico, links ou referências para executar sem atrito..."
              className="w-full px-3 py-2 text-xs sm:text-sm border border-white/15 rounded-xl focus:outline-none focus:border-[#D7FF3F] bg-black/40 text-white placeholder:text-[#8D9298]/50 leading-relaxed"
            />
          </div>

          {/* 7. Checklist */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#8D9298] uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-[#D7FF3F]" />
                <span>Checklist de sub-passos</span>
              </label>
              {checklist.length > 0 && (
                <span className="text-xs text-[#8D9298] font-semibold tabular-nums">
                  {checklistDoneCount} de {checklist.length} concluídos
                </span>
              )}
            </div>

            {/* Checklist items list */}
            {checklist.length > 0 && (
              <div className="bg-black/30 border border-white/10 rounded-xl divide-y divide-white/10 overflow-hidden">
                {checklist.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-2.5 sm:p-3 flex items-center gap-2.5 hover:bg-white/5 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => handleToggleChecklist(item.id)}
                      className="w-4 h-4 rounded text-[#D7FF3F] border-white/20 cursor-pointer accent-[#D7FF3F]"
                    />
                    <span
                      className={`text-xs sm:text-sm flex-1 break-words ${
                        item.done ? 'line-through text-[#8D9298]' : 'text-white'
                      }`}
                    >
                      {item.text}
                    </span>

                    {/* Order controls */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveChecklistItem(idx, 'up')}
                        aria-label="Mover para cima"
                        className="p-1 text-[#8D9298] hover:text-white disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === checklist.length - 1}
                        onClick={() => handleMoveChecklistItem(idx, 'down')}
                        aria-label="Mover para baixo"
                        className="p-1 text-[#8D9298] hover:text-white disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteChecklistItem(item.id)}
                        aria-label="Excluir item"
                        className="p-1 text-[#8D9298] hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* If all checklist items are checked and card is not 'concluida' */}
            {allChecklistDone && status !== 'concluida' && (
              <div className="p-3 bg-[#D7FF3F]/10 border border-[#D7FF3F]/30 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="text-xs text-white font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#D7FF3F] shrink-0" />
                  <span>Todos os itens foram marcados!</span>
                </div>
                <button
                  type="button"
                  onClick={handleCompleteDirectly}
                  className="px-3 py-1.5 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-lg cursor-pointer transition-colors shadow-2xs shrink-0"
                >
                  Concluir cartão
                </button>
              </div>
            )}

            {/* Add checklist item inline */}
            <form onSubmit={handleAddChecklistItem} className="flex gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder="Adicionar item ao checklist..."
                className="flex-1 px-3 py-1.5 text-xs bg-black/40 border border-white/15 rounded-lg text-white placeholder:text-[#8D9298]/50 focus:outline-none focus:border-[#D7FF3F]"
              />
              <button
                type="submit"
                disabled={!newChecklistText.trim()}
                className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-40 cursor-pointer"
              >
                Adicionar
              </button>
            </form>
          </div>

          {/* 8. "Marcar como próximo passo" toggle */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setNextPhysicalAction(task.id)}
              className={`w-full p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                task.isNextPhysicalAction
                  ? 'bg-[#D7FF3F]/15 border-[#D7FF3F] text-white'
                  : 'bg-black/30 border-white/10 text-[#8D9298] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <Star
                  className={`w-4 h-4 ${
                    task.isNextPhysicalAction
                      ? 'fill-[#D7FF3F] text-[#D7FF3F]'
                      : 'text-[#8D9298]'
                  }`}
                />
                <span className="text-xs sm:text-sm font-semibold">
                  {task.isNextPhysicalAction
                    ? 'Próximo passo físico do projeto'
                    : 'Marcar como próximo passo físico'}
                </span>
              </div>
              <span className="text-xs font-bold underline text-[#D7FF3F]">
                {task.isNextPhysicalAction ? 'Ativo' : 'Definir'}
              </span>
            </button>
          </div>

          {/* 9. Completed Card Info & evidenceNote */}
          {status === 'concluida' && (
            <div className="p-4 bg-[#D7FF3F]/10 border border-[#D7FF3F]/30 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs text-white font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#D7FF3F]" />
                <span>
                  Concluído em: {formattedCompletedAt || 'Data registrada'}
                </span>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="evidence-note-textarea"
                  className="block text-xs font-bold text-white"
                >
                  O que você entregou? (opcional)
                </label>
                <textarea
                  id="evidence-note-textarea"
                  rows={2}
                  value={evidenceNote}
                  onChange={(e) => setEvidenceNote(e.target.value)}
                  onBlur={() => handleSaveField('evidenceNote', evidenceNote.trim())}
                  placeholder="Ex.: Proposta enviada para os clientes por e-mail."
                  className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg focus:outline-none focus:border-[#D7FF3F] text-white"
                />
              </div>
            </div>
          )}

          {/* Unblock Dialog if blockingOpen */}
          {blockingOpen && task && (
            <UnblockDialog
              isOpen={blockingOpen}
              onClose={() => setBlockingOpen(false)}
              task={task}
              stage={stage}
              onSuccess={() => {
                setBlockingOpen(false);
                setStatus('bloqueada');
              }}
            />
          )}

          {/* 10. Danger zone */}
          <div className="pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleDeleteCard}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir este cartão</span>
            </button>
          </div>
        </div>

        {/* 11. Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {status !== 'bloqueada' && !blockingOpen && (
              <button
                type="button"
                onClick={() => setBlockingOpen(true)}
                className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold border border-white/15 hover:bg-white/10 rounded-xl cursor-pointer transition-colors text-[#8D9298] hover:text-white text-center"
              >
                Estou travado nesta
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {status !== 'concluida' && (
              <button
                type="button"
                onClick={handleCompleteDirectly}
                title="Atalho: Cmd+Enter / Ctrl+Enter"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl cursor-pointer transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Concluir cartão</span>
                <span className="hidden sm:inline text-[10px] opacity-70 font-normal">
                  (⌘+Enter)
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
