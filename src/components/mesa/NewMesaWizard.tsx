import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Priority, ProjectStatus, CreateProjectWithMesaInput, ProcessDoc } from '../../types';
import { PROJECT_TEMPLATES, ProjectTemplate } from '../../data/projectTemplates';
import { getBoardRules } from '../../lib/boardRules';
import { mapStepToCardData } from '../../lib/processImport';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Rocket,
  Briefcase,
  UserPlus,
  Coins,
  Sparkles,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Star,
  AlertTriangle,
  Layers,
  FileCheck2,
  CheckCircle2,
  Workflow,
  RotateCcw,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { getAIStatus, postAI, AIError } from '../../services/aiClient';

interface NewMesaWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSimpleModal?: () => void;
}

interface EditableStage {
  id: string;
  title: string;
  doneCriteria: string;
  cards: {
    id: string;
    title: string;
    durationMinutes: number;
    expectedEvidence: string;
    isNextPhysicalAction?: boolean;
  }[];
}

const TEMPLATE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket,
  Briefcase,
  UserPlus,
  Coins
};

export const NewMesaWizard: React.FC<NewMesaWizardProps> = ({
  isOpen,
  onClose,
  onOpenSimpleModal
}) => {
  const { userProfile, projects, processes, createProjectWithMesa, navigateTo } = useApp();
  const rules = getBoardRules(userProfile);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 State
  const [name, setName] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<Priority>('Alta');
  const [status, setStatus] = useState<ProjectStatus>('ativo');

  // Step 2 State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Step 3 & 4 State
  const [stages, setStages] = useState<EditableStage[]>([]);
  const [selectedNextActionCardId, setSelectedNextActionCardId] = useState<string | null>(null);

  // AI Generation State
  const [isAiAvailable, setIsAiAvailable] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiGenerationsCount, setAiGenerationsCount] = useState<number>(0);
  const [aiError, setAiError] = useState<{ code: string; message: string } | null>(null);
  const aiAbortControllerRef = useRef<AbortController | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  const activeProjectsCount = projects.filter((p) => p.status === 'ativo').length;
  const isOverProjectLimit = activeProjectsCount >= rules.maxActiveProjects;

  const isDirty = useMemo(() => {
    return Boolean(name.trim() || desiredOutcome.trim() || selectedTemplateId || stages.length > 0);
  }, [name, desiredOutcome, selectedTemplateId, stages]);

  // Check AI availability from server
  useEffect(() => {
    let isMounted = true;
    getAIStatus()
      .then((avail) => {
        if (isMounted) setIsAiAvailable(avail);
      })
      .catch(() => {
        if (isMounted) setIsAiAvailable(false);
      });
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Reset state when opening or closing
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setName('');
      setDesiredOutcome('');
      setDeadline('');
      setPriority('Alta');
      setStatus('ativo');
      setSelectedTemplateId(null);
      setStages([]);
      setSelectedNextActionCardId(null);
      setIsAiLoading(false);
      setAiError(null);
      setAiGenerationsCount(0);
    } else {
      if (aiAbortControllerRef.current) {
        aiAbortControllerRef.current.abort();
        aiAbortControllerRef.current = null;
      }
    }
  }, [isOpen]);

  // Esc key with confirmation if dirty
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSafeClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDirty]);

  const handleSafeClose = () => {
    if (isDirty) {
      const confirmDiscard = window.confirm('Deseja descartar a criação desta mesa?');
      if (!confirmDiscard) return;
    }
    onClose();
  };

  // Template selection
  const handleSelectTemplate = (template: ProjectTemplate) => {
    setSelectedTemplateId(template.id);
    if (!name.trim()) {
      setName(template.name);
    }
    if (!desiredOutcome.trim()) {
      setDesiredOutcome(template.description);
    }

    const newStages: EditableStage[] = template.stages.map((stg, sIdx) => ({
      id: `stg-${sIdx}-${Date.now()}`,
      title: stg.title,
      doneCriteria: stg.doneCriteria,
      cards: stg.cards.map((c, cIdx) => ({
        id: `card-${sIdx}-${cIdx}-${Date.now()}`,
        title: c.title,
        durationMinutes: c.durationMinutes,
        expectedEvidence: c.expectedEvidence,
        isNextPhysicalAction: sIdx === 0 && cIdx === 0
      }))
    }));

    setStages(newStages);
    if (newStages[0]?.cards[0]) {
      setSelectedNextActionCardId(newStages[0].cards[0].id);
    }
  };

  // Process as source
  const handleSelectProcess = (proc: ProcessDoc) => {
    setSelectedTemplateId(`process-${proc.id}`);
    if (!name.trim()) {
      setName(proc.title);
    }
    if (!desiredOutcome.trim()) {
      setDesiredOutcome(
        proc.expectedResult || proc.minimumStandard || 'Etapa do processo concluída com padrão mínimo'
      );
    }

    const maxCards = rules.maxOpenCardsCurrentStage;
    const cappedSteps = proc.steps.slice(0, maxCards);

    const singleStage: EditableStage = {
      id: `stg-proc-${Date.now()}`,
      title: proc.title,
      doneCriteria:
        proc.minimumStandard ||
        proc.expectedResult ||
        'Passos do processo executados com padrão mínimo',
      cards: cappedSteps.map((step, idx) => {
        const cardData = mapStepToCardData(step, proc);
        return {
          id: `card-proc-${idx}-${Date.now()}`,
          title: cardData.title,
          durationMinutes: cardData.durationMinutes,
          expectedEvidence: cardData.expectedEvidence,
          isNextPhysicalAction: idx === 0
        };
      })
    };

    setStages([singleStage]);
    if (singleStage.cards[0]) {
      setSelectedNextActionCardId(singleStage.cards[0].id);
    }
  };

  const handleSelectFromScratch = () => {
    setSelectedTemplateId('scratch');
    const defaultStages: EditableStage[] = [
      {
        id: `stg-0-${Date.now()}`,
        title: 'Diagnóstico e primeiro passo',
        doneCriteria: 'Primeira entrega concluída e documentada',
        cards: [
          {
            id: `card-0-${Date.now()}`,
            title: 'Definir o arquivo inicial e a primeira ação de 15 minutos',
            durationMinutes: 15,
            expectedEvidence: 'Arquivo aberto e primeiros parágrafos salvos',
            isNextPhysicalAction: true
          }
        ]
      },
      {
        id: `stg-1-${Date.now()}`,
        title: 'Execução e entregas intermediárias',
        doneCriteria: 'Protótipo concluído',
        cards: []
      },
      {
        id: `stg-2-${Date.now()}`,
        title: 'Revisão final e entrega',
        doneCriteria: 'Resultado entregue ao destinatário final',
        cards: []
      }
    ];

    setStages(defaultStages);
    setSelectedNextActionCardId(defaultStages[0].cards[0].id);
  };

  // AI Generation Handler
  const handleGenerateWithAI = async () => {
    if (!name.trim() || !desiredOutcome.trim()) {
      setStep(1);
      return;
    }
    if (aiGenerationsCount >= 3) {
      return;
    }

    setAiError(null);
    setIsAiLoading(true);

    const controller = new AbortController();
    aiAbortControllerRef.current = controller;

    const businessContextParts = [
      userProfile.business ? `Negócio: ${userProfile.business}` : null,
      userProfile.teamSize ? `Equipe: ${userProfile.teamSize}` : null
    ].filter(Boolean);
    const businessContext = businessContextParts.length > 0 ? businessContextParts.join(' | ') : undefined;

    try {
      const res = await postAI<
        {
          name: string;
          desiredOutcome: string;
          deadline?: string;
          mode: string;
          executionPattern?: string;
          businessContext?: string;
        },
        {
          stages: Array<{
            title: string;
            doneCriteria: string;
            cards: Array<{
              title: string;
              durationMinutes: number;
              expectedEvidence: string;
            }>;
          }>;
        }
      >(
        '/api/ai/stages',
        {
          name: name.trim(),
          desiredOutcome: desiredOutcome.trim(),
          deadline: deadline || undefined,
          mode: userProfile.currentMode || 'Normal',
          executionPattern: userProfile.executionPattern,
          businessContext
        },
        controller.signal
      );

      if (!res || !Array.isArray(res.stages) || res.stages.length === 0) {
        throw new AIError('bad_output', 'A IA não retornou etapas válidas. Tente novamente.');
      }

      const defaultCardDuration =
        userProfile.currentMode === 'Recuperação' ? 10 : userProfile.currentMode === 'Reduzido' ? 15 : 20;

      const newStages: EditableStage[] = res.stages.map((stg, sIdx) => ({
        id: `stg-ai-${sIdx}-${Date.now()}`,
        title: stg.title,
        doneCriteria: stg.doneCriteria,
        cards: (stg.cards || []).map((c, cIdx) => ({
          id: `card-ai-${sIdx}-${cIdx}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          title: c.title,
          durationMinutes: c.durationMinutes || defaultCardDuration,
          expectedEvidence: c.expectedEvidence || 'Evidência produzida',
          isNextPhysicalAction: sIdx === 0 && cIdx === 0
        }))
      }));

      setSelectedTemplateId('ai');
      setStages(newStages);
      if (newStages[0]?.cards[0]) {
        setSelectedNextActionCardId(newStages[0].cards[0].id);
      } else {
        setSelectedNextActionCardId(null);
      }
      setAiGenerationsCount((prev) => prev + 1);
      setStep(3);
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        return;
      }

      let friendlyMessage = 'Não foi possível gerar as etapas com IA no momento.';
      let code = 'upstream';

      if (err instanceof AIError) {
        code = err.code;
        switch (err.code) {
          case 'no_api_key':
            friendlyMessage = 'A inteligência artificial não está configurada no servidor (chave de API ausente).';
            break;
          case 'unauthorized':
            friendlyMessage = 'Sua sessão expirou. Entre novamente para usar a inteligência artificial.';
            break;
          case 'timeout':
            friendlyMessage = 'O assistente de IA demorou para responder. Verifique sua conexão e tente novamente.';
            break;
          case 'rate_limited':
            friendlyMessage = 'Muitas requisições em pouco tempo. Aguarde um instante antes de tentar novamente.';
            break;
          case 'bad_output':
            friendlyMessage = 'A IA gerou uma resposta incompleta ou fora do formato esperado. Tente reformular seu objetivo.';
            break;
          case 'upstream':
            friendlyMessage = 'Não foi possível conectar ao serviço de IA no momento. Tente novamente ou use um modelo pronto.';
            break;
          default:
            friendlyMessage = err.message || friendlyMessage;
        }
      } else if (err instanceof Error) {
        friendlyMessage = err.message;
      }

      setAiError({ code, message: friendlyMessage });
    } finally {
      setIsAiLoading(false);
      aiAbortControllerRef.current = null;
    }
  };

  const handleCancelAI = () => {
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
      aiAbortControllerRef.current = null;
    }
    setIsAiLoading(false);
  };

  // Stage Manipulation in Step 3
  const handleAddStage = () => {
    if (stages.length >= rules.maxStagesPerProject) return;
    const newIdx = stages.length + 1;
    setStages((prev) => [
      ...prev,
      {
        id: `stg-${Date.now()}`,
        title: `Etapa ${newIdx}`,
        doneCriteria: '',
        cards: []
      }
    ]);
  };

  const handleRemoveStage = (index: number) => {
    if (stages.length <= 1) return;
    setStages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMoveStage = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= stages.length) return;
    const copy = [...stages];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setStages(copy);
  };

  // Cards Manipulation for any stage (allows deleting every card and adding cards)
  const handleRemoveCard = (stageIndex: number, cardId: string) => {
    setStages((prev) =>
      prev.map((s, idx) =>
        idx === stageIndex ? { ...s, cards: s.cards.filter((c) => c.id !== cardId) } : s
      )
    );

    if (selectedNextActionCardId === cardId) {
      const remainingInFirst = stageIndex === 0
        ? (stages[0]?.cards.filter((c) => c.id !== cardId) || [])
        : (stages[0]?.cards || []);
      if (remainingInFirst.length > 0) {
        setSelectedNextActionCardId(remainingInFirst[0].id);
      } else {
        setSelectedNextActionCardId(null);
      }
    }
  };

  const handleAddCardToStage = (stageIndex: number) => {
    const defaultDuration =
      userProfile.currentMode === 'Recuperação' ? 10 : userProfile.currentMode === 'Reduzido' ? 15 : 20;

    const newCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      title: '',
      durationMinutes: defaultDuration,
      expectedEvidence: '',
      isNextPhysicalAction: false
    };

    setStages((prev) =>
      prev.map((s, idx) =>
        idx === stageIndex ? { ...s, cards: [...s.cards, newCard] } : s
      )
    );

    if (!selectedNextActionCardId && stageIndex === 0) {
      setSelectedNextActionCardId(newCard.id);
    }
  };

  const handleUpdateCardInStage = (
    stageIndex: number,
    cardId: string,
    updates: Partial<{ title: string; durationMinutes: number; expectedEvidence: string }>
  ) => {
    setStages((prev) =>
      prev.map((s, idx) =>
        idx === stageIndex
          ? {
              ...s,
              cards: s.cards.map((c) => (c.id === cardId ? { ...c, ...updates } : c))
            }
          : s
      )
    );
  };

  // Cards Manipulation in Step 4
  const firstStage = stages[0];
  const firstStageCards = firstStage ? firstStage.cards : [];

  const handleAddCardToFirstStage = () => handleAddCardToStage(0);
  const handleRemoveCardFromFirstStage = (cardId: string) => handleRemoveCard(0, cardId);
  const handleUpdateCardInFirstStage = (
    cardId: string,
    updates: Partial<{ title: string; durationMinutes: number; expectedEvidence: string }>
  ) => handleUpdateCardInStage(0, cardId, updates);

  // Final Submit
  const handleFinalSubmit = () => {
    if (!name.trim() || !desiredOutcome.trim() || stages.length === 0) return;

    // Build creation input
    const input: CreateProjectWithMesaInput = {
      name: name.trim(),
      desiredOutcome: desiredOutcome.trim(),
      deadline: deadline || undefined,
      priority,
      status,
      templateId: selectedTemplateId && selectedTemplateId !== 'scratch' ? selectedTemplateId : undefined,
      stages: stages.map((stg, sIdx) => ({
        title: stg.title.trim() || `Etapa ${sIdx + 1}`,
        doneCriteria: stg.doneCriteria.trim() || 'Critério de entrega da etapa',
        cards: stg.cards.map((c) => ({
          title: c.title.trim() || 'Primeira ação física',
          durationMinutes: c.durationMinutes || 20,
          expectedEvidence: c.expectedEvidence.trim() || 'Evidência concluída',
          isNextPhysicalAction: c.id === selectedNextActionCardId
        }))
      }))
    };

    const newProjectId = createProjectWithMesa(input);
    onClose();
    navigateTo(`/app/projetos/${newProjectId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Montar Mesa de Criação"
        className="bg-[#16181D] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/10 text-white animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Wizard Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#101114]">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#D7FF3F]" />
              <h2 className="text-base sm:text-lg font-display font-bold text-white tracking-tight">
                Montar Mesa de Criação
              </h2>
            </div>
            <p className="text-xs text-[#8D9298] mt-0.5">
              Passo {step} de 4 —{' '}
              {step === 1 && 'Qual resultado você quer?'}
              {step === 2 && 'Como começar?'}
              {step === 3 && 'Etapas do Roadmap'}
              {step === 4 && 'Primeiro passo físico'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSafeClose}
            className="p-1.5 text-[#8D9298] hover:text-white hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-white/10 w-full overflow-hidden">
          <div
            className="h-full bg-[#D7FF3F] transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Wizard Step Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          {isAiLoading ? (
            /* AI Thinking / Loading State with Skeleton */
            <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-200">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-[#D7FF3F]/10 flex items-center justify-center text-[#D7FF3F] shadow-inner">
                  <Sparkles className="w-7 h-7 animate-pulse text-[#D7FF3F]" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#16181D] rounded-full p-0.5 shadow-xs border border-white/10">
                  <Loader2 className="w-4 h-4 animate-spin text-[#D7FF3F]" />
                </div>
              </div>

              <div className="space-y-1.5 max-w-md">
                <h3 className="text-base font-display font-bold text-white tracking-tight">
                  Pensando nas etapas…
                </h3>
                <p className="text-xs text-[#8D9298] leading-relaxed">
                  Desdobrando seu objetivo em 3 a 6 etapas sequenciais e gerando ações físicas imediatas sem sobrecarga.
                </p>
              </div>

              {/* Skeleton Stages Preview */}
              <div className="w-full max-w-md space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-3 bg-[#101114] border border-white/10 rounded-xl space-y-2 text-left animate-pulse"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-white/10" />
                      <div className="h-3 bg-white/10 rounded-md w-1/3" />
                    </div>
                    <div className="h-2.5 bg-white/5 rounded-md w-3/4 ml-6" />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCancelAI}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#8D9298] hover:text-white bg-white/10 hover:bg-white/15 rounded-xl cursor-pointer transition-colors border border-white/10"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </button>
            </div>
          ) : (
            <>
              {/* STEP 1: Qual resultado você quer? */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {isOverProjectLimit && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-white">
                            Você já tem {activeProjectsCount} de {rules.maxActiveProjects} projetos ativos.
                          </p>
                          <p className="text-amber-200 text-[11px] mt-0.5">
                            Poucos projetos ativos garantem mais velocidade. Você pode criá-lo como pausado para focar no que já começou.
                          </p>
                        </div>
                      </div>
                      {status === 'ativo' && (
                        <button
                          type="button"
                          onClick={() => setStatus('pausado')}
                          className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold rounded-lg cursor-pointer text-xs transition-colors"
                        >
                          Criar como pausado
                        </button>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#F3F0EB] mb-1">
                      Nome do Projeto *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      autoFocus
                      placeholder="Ex: Nova oferta de consultoria"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-white/15 rounded-xl focus:outline-none focus:border-[#D7FF3F] bg-[#101114] text-white"
                    />
                    <div className="flex justify-between text-[11px] text-[#8D9298] mt-1">
                      <span>Dê um nome direto e fácil de reconhecer.</span>
                      <span>{name.length}/80</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#F3F0EB] mb-1">
                      Resultado Desejado (Critério de Conclusão) *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Complete: 'Quando isso estiver pronto, eu terei...'"
                      value={desiredOutcome}
                      onChange={(e) => setDesiredOutcome(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-white/15 rounded-xl focus:outline-none focus:border-[#D7FF3F] bg-[#101114] text-white leading-relaxed"
                    />
                    <p className="text-[11px] text-[#8D9298] mt-1">
                      Ex: Três clientes pagantes com propostas assinadas e primeiro ciclo entregue.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-[#F3F0EB] mb-1">
                        Prioridade
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as Priority)}
                        className="w-full px-3 py-2 text-sm border border-white/15 rounded-xl bg-[#101114] text-white focus:outline-none focus:border-[#D7FF3F]"
                      >
                        <option value="Alta" className="bg-[#101114] text-white">Alta</option>
                        <option value="Média" className="bg-[#101114] text-white">Média</option>
                        <option value="Baixa" className="bg-[#101114] text-white">Baixa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#F3F0EB] mb-1">
                        Prazo Opcional
                      </label>
                      <input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-white/15 rounded-xl bg-[#101114] text-white focus:outline-none focus:border-[#D7FF3F]"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    {onOpenSimpleModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSimpleModal();
                        }}
                        className="text-xs text-[#8D9298] hover:text-white underline cursor-pointer"
                      >
                        Criar projeto simples
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: Como começar? (Templates & IA) */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <p className="text-xs text-[#8D9298]">
                    Escolha uma estrutura testada para economizar tempo ou comece com um plano em branco.
                  </p>

                  {/* AI Error Alert */}
                  {aiError && (
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-rose-300">
                            Não foi possível sugerir etapas com IA
                          </h4>
                          <p className="text-xs text-rose-200 mt-0.5 leading-relaxed">
                            {aiError.message}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1 pl-6">
                        {aiGenerationsCount < 3 && (
                          <button
                            type="button"
                            onClick={handleGenerateWithAI}
                            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold rounded-lg cursor-pointer text-xs transition-colors"
                          >
                            Tentar novamente
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setAiError(null);
                            setSelectedTemplateId(null);
                          }}
                          className="px-3 py-1 bg-white/10 hover:bg-white/15 text-white border border-white/15 font-semibold rounded-lg cursor-pointer text-xs transition-colors"
                        >
                          Escolher um modelo pronto
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3">
                    {/* Sugerir etapas com IA (Shown only if getAIStatus() is true) */}
                    {isAiAvailable && (
                      <button
                        type="button"
                        onClick={handleGenerateWithAI}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                          selectedTemplateId === 'ai'
                            ? 'border-[#D7FF3F] bg-[#D7FF3F]/10 ring-2 ring-[#D7FF3F]/20 shadow-lg'
                            : 'border-white/10 hover:border-[#D7FF3F]/50 bg-[#101114]'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="w-8 h-8 rounded-lg bg-[#D7FF3F]/10 flex items-center justify-center text-[#D7FF3F]">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#101114] bg-[#D7FF3F] px-2 py-0.5 rounded-full">
                              Inteligente
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white leading-snug font-display">
                            Sugerir etapas com IA
                          </h4>
                          <p className="text-xs text-[#8D9298] leading-relaxed">
                            Gera de 3 a 6 etapas e primeiros cartões de ação adaptados ao seu modo e perfil.
                          </p>
                        </div>
                        <div className="text-[11px] font-semibold text-[#D7FF3F] flex items-center gap-1">
                          <span>Plano anti-procrastinação</span>
                        </div>
                      </button>
                    )}

                    {PROJECT_TEMPLATES.map((tpl) => {
                      const IconComp = TEMPLATE_ICONS[tpl.icon] || Rocket;
                      const isSelected = selectedTemplateId === tpl.id;

                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleSelectTemplate(tpl)}
                          className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                            isSelected
                              ? 'border-[#D7FF3F] bg-[#D7FF3F]/10 ring-2 ring-[#D7FF3F]/20 shadow-lg'
                              : 'border-white/10 hover:border-white/20 bg-[#101114]'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#D7FF3F]">
                              <IconComp className="w-4 h-4" />
                            </div>
                            <h4 className="text-sm font-bold text-white leading-snug font-display">
                              {tpl.name}
                            </h4>
                            <p className="text-xs text-[#8D9298] leading-relaxed">
                              {tpl.description}
                            </p>
                          </div>

                          <div className="text-[11px] font-semibold text-[#8D9298]">
                            4 etapas · 3 a 5 ações estruturadas
                          </div>
                        </button>
                      );
                    })}

                    {/* Usar um processo meu */}
                    <div
                      className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                        selectedTemplateId?.startsWith('process-')
                          ? 'border-[#D7FF3F] bg-[#D7FF3F]/10 ring-2 ring-[#D7FF3F]/20 shadow-lg'
                          : 'border-white/10 bg-[#101114] hover:border-white/20'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#D7FF3F]">
                          <Workflow className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold text-white leading-snug font-display">
                          Usar um processo meu
                        </h4>
                        <p className="text-xs text-[#8D9298] leading-relaxed">
                          Transforme os passos de um processo documentado na etapa inicial desta mesa.
                        </p>
                      </div>

                      {processes.length === 0 ? (
                        <div className="text-[11px] text-[#8D9298] italic">
                          Nenhum processo documentado ainda.
                        </div>
                      ) : (
                        <div className="space-y-1.5 pt-1">
                          <select
                            aria-label="Selecionar processo"
                            value={
                              selectedTemplateId?.startsWith('process-')
                                ? selectedTemplateId.replace('process-', '')
                                : ''
                            }
                            onChange={(e) => {
                              const proc = processes.find((p) => p.id === e.target.value);
                              if (proc) handleSelectProcess(proc);
                            }}
                            className="w-full text-xs px-2.5 py-1.5 bg-[#16181D] border border-white/15 rounded-lg focus:outline-none focus:border-[#D7FF3F] font-medium text-white"
                          >
                            <option value="" className="bg-[#16181D] text-white">Escolha um processo ({processes.length})...</option>
                            {processes.map((proc) => (
                              <option key={proc.id} value={proc.id} className="bg-[#16181D] text-white">
                                {proc.title} ({proc.steps.length} {proc.steps.length === 1 ? 'passo' : 'passos'})
                              </option>
                            ))}
                          </select>
                          <div className="text-[11px] font-semibold text-[#8D9298]">
                            Cria 1 etapa com cartões mapeados
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Começar do zero */}
                    <button
                      type="button"
                      onClick={handleSelectFromScratch}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                        selectedTemplateId === 'scratch'
                          ? 'border-[#D7FF3F] bg-[#D7FF3F]/10 ring-2 ring-[#D7FF3F]/20 shadow-lg'
                          : 'border-white/10 hover:border-white/20 bg-[#101114]'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#D7FF3F]">
                          <Layers className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold text-white leading-snug font-display">
                          Começar do zero
                        </h4>
                        <p className="text-xs text-[#8D9298] leading-relaxed">
                          Defina suas próprias etapas e passos conforme sua necessidade.
                        </p>
                      </div>
                      <div className="text-[11px] font-semibold text-[#8D9298]">
                        Roadmap flexível
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Etapas do Roadmap */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* AI Banner if generated via AI */}
                  {selectedTemplateId === 'ai' && (
                    <div className="p-3.5 bg-[#D7FF3F]/10 border border-[#D7FF3F]/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#D7FF3F]/20 text-[#D7FF3F] flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="w-4 h-4 text-[#D7FF3F]" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">
                            Sugestão da IA — revise antes de criar
                          </h4>
                          <p className="text-[11px] text-[#8D9298] leading-relaxed">
                            Rascunho editável. Nada foi salvo ainda. Você pode alterar textos, adicionar ou remover qualquer etapa e cartão.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={aiGenerationsCount >= 3 || isAiLoading}
                        onClick={handleGenerateWithAI}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg cursor-pointer disabled:opacity-40 transition-colors shadow-2xs shrink-0 self-end sm:self-auto"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#D7FF3F]" />
                        <span>
                          {aiGenerationsCount >= 3
                            ? 'Limite de 3 tentativas atingido'
                            : `Gerar de novo (${3 - aiGenerationsCount} restantes)`}
                        </span>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white font-display">
                        Revise as etapas do seu projeto
                      </h3>
                      <p className="text-xs text-[#8D9298]">
                        Poucas etapas facilitam manter a tração. Máximo de {rules.maxStagesPerProject} etapas.
                      </p>
                    </div>
                    {stages.length < rules.maxStagesPerProject && (
                      <button
                        type="button"
                        onClick={handleAddStage}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-[#c2ef26] rounded-lg cursor-pointer transition-colors shadow-lg"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar etapa</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {stages.map((stg, index) => (
                      <div
                        key={stg.id}
                        className="p-4 bg-[#101114] border border-white/10 rounded-xl space-y-3 relative"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-white/10 text-white font-bold text-xs flex items-center justify-center">
                              {index + 1}
                            </span>
                            {index === 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-[#D7FF3F] text-[#101114] text-[10px] font-extrabold uppercase tracking-wider">
                                Etapa atual
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveStage(index, 'up')}
                              className="p-1 text-[#8D9298] hover:text-white disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === stages.length - 1}
                              onClick={() => handleMoveStage(index, 'down')}
                              className="p-1 text-[#8D9298] hover:text-white disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            {stages.length > 1 && (
                              <button
                                type="button"
                                title="Remover etapa"
                                onClick={() => handleRemoveStage(index)}
                                className="p-1 text-[#8D9298] hover:text-rose-400 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <input
                            type="text"
                            required
                            placeholder="Nome da etapa"
                            value={stg.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStages((prev) =>
                                prev.map((s, idx) => (idx === index ? { ...s, title: val } : s))
                              );
                            }}
                            className="w-full px-3 py-1.5 text-xs font-semibold bg-[#16181D] text-white border border-white/15 rounded-lg focus:outline-none focus:border-[#D7FF3F]"
                          />

                          <textarea
                            rows={2}
                            required
                            placeholder="Critério de entrega: o que comprova que a etapa terminou?"
                            value={stg.doneCriteria}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStages((prev) =>
                                prev.map((s, idx) => (idx === index ? { ...s, doneCriteria: val } : s))
                              );
                            }}
                            className="w-full px-3 py-1.5 text-xs bg-[#16181D] text-white border border-white/15 rounded-lg focus:outline-none focus:border-[#D7FF3F] leading-relaxed"
                          />
                        </div>

                        {/* Cartões da etapa (editáveis e removíveis) */}
                        <div className="pt-2 border-t border-white/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-[#8D9298] flex items-center gap-1.5">
                              <Check className="w-3 h-3 text-[#D7FF3F]" />
                              <span>Cartões de ação desta etapa ({stg.cards.length})</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddCardToStage(index)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D7FF3F] hover:underline cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Adicionar cartão</span>
                            </button>
                          </div>

                          {stg.cards.length === 0 ? (
                            <p className="text-[11px] text-[#8D9298] italic">
                              Nenhum cartão nesta etapa.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {stg.cards.map((c) => (
                                <div
                                  key={c.id}
                                  className="p-2.5 bg-[#16181D] border border-white/10 rounded-lg space-y-1.5 shadow-2xs"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <input
                                      type="text"
                                      value={c.title}
                                      placeholder="Ação física (comece com um verbo)"
                                      onChange={(e) =>
                                        handleUpdateCardInStage(index, c.id, { title: e.target.value })
                                      }
                                      className="w-full text-xs font-semibold text-white bg-transparent border-0 border-b border-white/10 focus:border-[#D7FF3F] focus:outline-none py-0.5"
                                    />
                                    <button
                                      type="button"
                                      title="Remover cartão"
                                      onClick={() => handleRemoveCard(index, c.id)}
                                      className="text-[#8D9298] hover:text-rose-400 p-1 cursor-pointer shrink-0 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-1">
                                      <input
                                        type="number"
                                        min={5}
                                        max={30}
                                        step={5}
                                        value={c.durationMinutes}
                                        onChange={(e) =>
                                          handleUpdateCardInStage(index, c.id, {
                                            durationMinutes: Number(e.target.value) || 15
                                          })
                                        }
                                        className="w-full px-2 py-0.5 text-[11px] border border-white/15 rounded-md bg-[#101114] text-white focus:outline-none focus:border-[#D7FF3F]"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <input
                                        type="text"
                                        placeholder="Evidência observável..."
                                        value={c.expectedEvidence}
                                        onChange={(e) =>
                                          handleUpdateCardInStage(index, c.id, {
                                            expectedEvidence: e.target.value
                                          })
                                        }
                                        className="w-full px-2 py-0.5 text-[11px] border border-white/15 rounded-md bg-[#101114] text-white focus:outline-none focus:border-[#D7FF3F]"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 4: Primeiro passo (Faça agora) */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white font-display">
                  Defina o primeiro passo físico
                </h3>
                <p className="text-xs text-[#8D9298]">
                  Cartões de até 25 minutos para você começar agora mesmo. Selecione exatamente <strong>um</strong> cartão como &quot;Faça agora&quot;.
                </p>
              </div>

              {firstStageCards.length === 0 ? (
                <div className="p-6 bg-[#101114] border border-white/10 rounded-xl text-center space-y-3">
                  <p className="text-xs text-[#8D9298]">
                    Nenhum cartão cadastrado para a primeira etapa.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddCardToFirstStage}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-[#c2ef26] rounded-xl cursor-pointer shadow-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar primeiro cartão</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {firstStageCards.map((card) => {
                    const isSelectedNext = card.id === selectedNextActionCardId;

                    return (
                      <div
                        key={card.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isSelectedNext
                            ? 'bg-[#D7FF3F]/10 border-[#D7FF3F] ring-2 ring-[#D7FF3F]/20 shadow-lg'
                            : 'bg-[#101114] border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
                          <button
                            type="button"
                            onClick={() => setSelectedNextActionCardId(card.id)}
                            className="inline-flex items-center gap-2 cursor-pointer text-left"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                isSelectedNext
                                  ? 'fill-[#D7FF3F] text-[#D7FF3F]'
                                  : 'text-[#8D9298] hover:text-white'
                              }`}
                            />
                            <span
                              className={`text-xs font-bold ${
                                isSelectedNext ? 'text-[#D7FF3F]' : 'text-[#8D9298]'
                              }`}
                            >
                              {isSelectedNext
                                ? 'Faça agora (Próximo passo físico)'
                                : 'Definir como "Faça agora"'}
                            </span>
                          </button>

                          {firstStageCards.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCardFromFirstStage(card.id)}
                              className="text-[#8D9298] hover:text-rose-400 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="mt-2.5 space-y-2">
                          <div>
                            <input
                              type="text"
                              required
                              placeholder="Ação física (Ex: Escrever a promessa em 3 linhas)"
                              value={card.title}
                              onChange={(e) =>
                                handleUpdateCardInFirstStage(card.id, { title: e.target.value })
                              }
                              className="w-full px-3 py-1.5 text-xs font-semibold bg-[#16181D] text-white border border-white/15 rounded-lg focus:outline-none focus:border-[#D7FF3F]"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-1">
                              <label className="block text-[10px] font-bold text-[#8D9298] mb-0.5">
                                Duração (min)
                              </label>
                              <input
                                type="number"
                                min={5}
                                max={45}
                                step={5}
                                value={card.durationMinutes}
                                onChange={(e) =>
                                  handleUpdateCardInFirstStage(card.id, {
                                    durationMinutes: Number(e.target.value) || 15
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-white/15 rounded-lg bg-[#16181D] text-white focus:outline-none focus:border-[#D7FF3F]"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-[10px] font-bold text-[#8D9298] mb-0.5">
                                Evidência observável
                              </label>
                              <input
                                type="text"
                                placeholder="Termina quando..."
                                value={card.expectedEvidence}
                                onChange={(e) =>
                                  handleUpdateCardInFirstStage(card.id, {
                                    expectedEvidence: e.target.value
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-white/15 rounded-lg bg-[#16181D] text-white focus:outline-none focus:border-[#D7FF3F]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={handleAddCardToFirstStage}
                    className="w-full py-2.5 border-2 border-dashed border-white/15 hover:border-white/30 text-[#8D9298] hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar outro cartão na etapa atual</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        {!isAiLoading && (
          <div className="p-4 sm:p-5 border-t border-white/10 bg-[#101114] flex items-center justify-between">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
                  className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-[#8D9298] hover:text-white border border-white/15 rounded-xl cursor-pointer bg-transparent transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {step < 4 ? (
                <button
                  type="button"
                  disabled={
                    (step === 1 && (!name.trim() || !desiredOutcome.trim())) ||
                    (step === 2 && !selectedTemplateId) ||
                    (step === 3 && (stages.length === 0 || stages.some((s) => !s.title.trim())))
                  }
                  onClick={() => setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-[#c2ef26] rounded-xl cursor-pointer disabled:opacity-40 transition-colors shadow-lg"
                >
                  <span>Avançar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={
                    firstStageCards.length === 0 ||
                    firstStageCards.some((c) => !c.title.trim())
                  }
                  onClick={handleFinalSubmit}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-[#c2ef26] rounded-xl cursor-pointer disabled:opacity-40 transition-colors shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Criar mesa</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
