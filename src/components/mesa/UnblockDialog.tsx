import React, { useState } from 'react';
import { Task, BlockerReason, Project, Stage } from '../../types';
import { useApp } from '../../context/AppContext';
import { BLOCKER_OPTIONS } from '../../data/blockerCopy';
import { CONVERSATION_SCENARIOS } from '../../data/seedData';
import {
  X,
  HeartHandshake,
  ArrowRight,
  Scale,
  MessageSquareWarning,
  Scissors,
  Clock,
  BatteryLow,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  FileCheck2
} from 'lucide-react';

interface UnblockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  project?: Project;
  stage?: Stage;
  onSuccess?: () => void;
}

export const UnblockDialog: React.FC<UnblockDialogProps> = ({
  isOpen,
  onClose,
  task,
  project,
  stage,
  onSuccess
}) => {
  const {
    moveCard,
    updateTask,
    addDecision,
    splitCard,
    setExecutionMode,
    navigateTo,
    showToast
  } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedReason, setSelectedReason] = useState<BlockerReason>(
    task.blockedReasonKey || 'falta_clareza'
  );
  const [notes, setNotes] = useState<string>(task.blockedReason || '');

  // Sub-forms inside Step 2
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decisionTitle, setDecisionTitle] = useState(task.title);
  const [decisionMissingInfo, setDecisionMissingInfo] = useState(task.blockedReason || '');
  const [decisionPostponeCost, setDecisionPostponeCost] = useState(
    'Atraso na entrega da etapa e bloqueio do fluxo.'
  );
  const [decisionNextStep, setDecisionNextStep] = useState(
    'Alinhar o critério exato e definir a opção definitiva.'
  );
  const [decisionReviewDate, setDecisionReviewDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });

  // Conversation scenario picker
  const [conversationSlug, setConversationSlug] = useState<string>(() => {
    // Default smart suggestion
    const lower = (task.title + ' ' + (task.blockedReason || '')).toLowerCase();
    if (lower.includes('pagamento') || lower.includes('cobrar') || lower.includes('fatura') || lower.includes('dinheiro')) {
      return 'cobrar-cliente';
    }
    if (lower.includes('preço') || lower.includes('reajuste') || lower.includes('honorário')) {
      return 'reajustar-preco';
    }
    if (lower.includes('escopo') || lower.includes('não') || lower.includes('pedido')) {
      return 'dizer-nao';
    }
    if (lower.includes('prazo') || lower.includes('atraso') || lower.includes('cronograma')) {
      return 'renegociar-prazo';
    }
    return CONVERSATION_SCENARIOS[0]?.slug || 'cobrar-cliente';
  });

  // Split mini-form
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitParts, setSplitParts] = useState([
    { title: `${task.title} - Parte 1`, durationMinutes: 15, expectedEvidence: '' },
    { title: `${task.title} - Parte 2`, durationMinutes: 15, expectedEvidence: '' }
  ]);

  if (!isOpen) return null;

  // STEP 1: Acolher e salvar o motivo
  const handleProceedToStep2 = () => {
    const trimmedNotes = notes.trim();

    // 1. Move to 'bloqueada'
    moveCard(task.id, { status: 'bloqueada', stageId: task.stageId });

    // 2. Save reason key and note
    updateTask(task.id, {
      blockedReasonKey: selectedReason,
      blockedReason: trimmedNotes || undefined
    });

    // Prepopulate decision fields
    setDecisionTitle(task.title);
    setDecisionMissingInfo(trimmedNotes || 'Informações e critérios pendentes de definição.');

    setStep(2);
  };

  // STEP 2 ACTION A: Transformar em decisão
  const handleCreateDecision = () => {
    const newDecisionId = addDecision({
      title: decisionTitle.trim() || task.title,
      openDays: 0,
      postponeCost: decisionPostponeCost.trim() || 'Atraso na etapa atual.',
      missingInformation: decisionMissingInfo.trim() || 'Informações pendentes.',
      nextStep: decisionNextStep.trim() || 'Definir o critério.',
      reviewDate: decisionReviewDate,
      status: 'pendente',
      projectId: task.projectId,
      stageId: task.stageId,
      taskId: task.id
    });

    updateTask(task.id, {
      decisionId: newDecisionId
    });

    showToast('Bloqueio acolhido.', 'Decisão registrada. Você pode resolvê-la em Decisões para destravar este cartão.', 'info');
    onSuccess?.();
    onClose();
    navigateTo('/app/decisoes');
  };

  // STEP 2 ACTION B: Preparar conversa difícil
  const handleGoToConversation = () => {
    updateTask(task.id, {
      conversationSlug
    });

    showToast('Bloqueio acolhido.', 'Roteiro de conversa selecionado para te apoiar.', 'info');
    onSuccess?.();
    onClose();
    navigateTo(`/app/conversas?cenario=${conversationSlug}`);
  };

  // STEP 2 ACTION C: Dividir em partes
  const handleConfirmSplit = () => {
    const valid = splitParts.filter((p) => p.title.trim().length > 0);
    if (valid.length < 2) return;

    const ok = splitCard(task.id, valid);
    if (ok) {
      showToast('Bloqueio acolhido.', 'Cartão dividido com sucesso em ações menores.', 'success');
      onSuccess?.();
      onClose();
    }
  };

  // STEP 2 ACTION D1: Reduzir para 10 minutos (volta para pronta)
  const handleReduceTo10Minutes = () => {
    updateTask(task.id, {
      durationMinutes: Math.min(task.durationMinutes || 20, 10),
      status: 'pronta',
      blockedReason: undefined,
      blockedReasonKey: undefined
    });
    moveCard(task.id, { status: 'pronta', stageId: task.stageId });

    showToast('Bloqueio acolhido.', 'Cartão reduzido para 10 minutos e devolvido para "A fazer".', 'success');
    onSuccess?.();
    onClose();
  };

  // STEP 2 ACTION D2: Deixar para amanhã (vai para o fim de A fazer)
  const handleLeaveForTomorrow = () => {
    moveCard(task.id, { status: 'pronta', stageId: task.stageId, index: 999 });
    updateTask(task.id, {
      status: 'pronta',
      blockedReason: undefined,
      blockedReasonKey: undefined
    });

    showToast('Bloqueio acolhido.', 'Cartão mantido na etapa e movido para o fim da fila de "A fazer".', 'info');
    onSuccess?.();
    onClose();
  };

  // STEP 2 ACTION E1: Fazer só a versão mínima
  const handleMinimumVersion = () => {
    updateTask(task.id, {
      status: 'pronta',
      blockedReason: undefined,
      blockedReasonKey: undefined
    });
    moveCard(task.id, { status: 'pronta', stageId: task.stageId });

    showToast('Bloqueio acolhido.', 'Foco ajustado para a versão mínima essencial.', 'info');
    onSuccess?.();
    onClose();
  };

  // STEP 2 ACTION E2: Ativar Modo Reduzido
  const handleActivateReducedMode = () => {
    setExecutionMode('Reduzido');
    updateTask(task.id, {
      status: 'pronta',
      blockedReason: undefined,
      blockedReasonKey: undefined
    });
    moveCard(task.id, { status: 'pronta', stageId: task.stageId });

    showToast('Bloqueio acolhido.', 'Modo Reduzido ativado para diminuir a pressão do dia.', 'info');
    onSuccess?.();
    onClose();
  };

  // STEP 2 ACTION F: Só registrar por enquanto
  const handleJustRegister = () => {
    showToast('Bloqueio acolhido.', 'Impedimento registrado. Sem cobrança.', 'info');
    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#16181D] rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-white/10 text-white animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D7FF3F]/10 text-[#D7FF3F] flex items-center justify-center font-bold">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-white">
                {step === 1 ? 'O que está travando?' : 'O que podemos fazer agora?'}
              </h3>
              <p className="text-xs text-[#8D9298]">
                Cartão: <span className="font-semibold text-[#F3F0EB]">{task.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-[#8D9298] hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: Escolha do motivo do bloqueio */}
        {step === 1 && (
          <div className="mt-5 space-y-5">
            <p className="text-xs text-[#8D9298] leading-relaxed">
              Travamento não é preguiça. É um atrito claro que podemos nomear e contornar. Escolha o motivo principal:
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {BLOCKER_OPTIONS.map((opt) => {
                const isSelected = selectedReason === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedReason(opt.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#D7FF3F] bg-[#D7FF3F]/10 shadow-xs'
                        : 'border-white/10 bg-[#101114] hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${isSelected ? 'text-white font-bold' : 'text-[#F3F0EB]'}`}>
                        {opt.label}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-[#D7FF3F]" />
                      )}
                    </div>
                    <p className="text-xs text-[#8D9298] mt-1 leading-normal">
                      {opt.explanation}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Optional note input */}
            <div>
              <label htmlFor="unblock-note" className="block text-xs font-semibold text-[#F3F0EB] mb-1">
                Anotação específica ou o que está faltando (opcional)
              </label>
              <input
                id="unblock-note"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex.: aguardando resposta do contador, falta senha do painel..."
                className="w-full px-3.5 py-2.5 text-sm bg-[#101114] text-white border border-white/15 rounded-xl focus:outline-none focus:border-[#D7FF3F]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-[#8D9298] hover:text-white border border-white/15 rounded-xl cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleProceedToStep2}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-[#c2ef26] rounded-xl cursor-pointer transition-colors shadow-lg"
              >
                <span>Avançar para opções</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Opções guiadas de acordo com o motivo */}
        {step === 2 && (
          <div className="mt-5 space-y-5">
            <div className="p-3 bg-[#D7FF3F]/10 border border-[#D7FF3F]/30 rounded-xl text-xs text-white flex items-center justify-between">
              <div>
                <span className="font-bold text-[#D7FF3F]">Motivo: </span>
                {BLOCKER_OPTIONS.find((b) => b.id === selectedReason)?.label}
                {notes && <span className="text-[#8D9298]"> — &quot;{notes}&quot;</span>}
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[11px] font-semibold text-[#D7FF3F] underline cursor-pointer"
              >
                Alterar
              </button>
            </div>

            {/* CASO 1: falta_clareza ou falta_informacao -> Transformar em decisão */}
            {(selectedReason === 'falta_clareza' || selectedReason === 'falta_informacao') && (
              <div className="space-y-3">
                <div className="border border-white/10 rounded-2xl p-4 bg-[#101114] space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/10 rounded-xl text-[#D7FF3F] shrink-0 mt-0.5">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-sm font-bold text-white">
                        Transformar em decisão
                      </h4>
                      <p className="text-xs text-[#8D9298] leading-relaxed">
                        Quando falta informação ou clareza, a execução deve pausar para virar uma escolha documentada com data de revisão.
                      </p>
                    </div>
                  </div>

                  {!decisionOpen ? (
                    <button
                      type="button"
                      onClick={() => setDecisionOpen(true)}
                      className="w-full py-2.5 px-4 text-xs font-bold bg-[#D7FF3F] text-[#101114] hover:bg-[#c2ef26] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Abrir formulário de decisão pré-preenchido</span>
                    </button>
                  ) : (
                    <div className="pt-2 border-t border-white/10 space-y-3 animate-in fade-in duration-150">
                      <div>
                        <label className="block text-[11px] font-bold text-[#F3F0EB] mb-1">
                          Título da decisão
                        </label>
                        <input
                          type="text"
                          value={decisionTitle}
                          onChange={(e) => setDecisionTitle(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-[#16181D] text-white border border-white/15 rounded-lg focus:outline-none focus:border-[#D7FF3F]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#F3F0EB] mb-1">
                          Informação faltante
                        </label>
                        <input
                          type="text"
                          value={decisionMissingInfo}
                          onChange={(e) => setDecisionMissingInfo(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-[#16181D] text-white border border-white/15 rounded-lg focus:outline-none focus:border-[#D7FF3F]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-[#F3F0EB] mb-1">
                            Custo de adiar
                          </label>
                          <input
                            type="text"
                            value={decisionPostponeCost}
                            onChange={(e) => setDecisionPostponeCost(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-[#16181D] text-white border border-white/15 rounded-lg focus:outline-none focus:border-[#D7FF3F]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#F3F0EB] mb-1">
                            Data de revisão
                          </label>
                          <input
                            type="date"
                            value={decisionReviewDate}
                            onChange={(e) => setDecisionReviewDate(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-[#16181D] text-white border border-white/15 rounded-lg focus:outline-none focus:border-[#D7FF3F]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#F3F0EB] mb-1">
                          Próximo passo
                        </label>
                        <input
                          type="text"
                          value={decisionNextStep}
                          onChange={(e) => setDecisionNextStep(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-[#16181D] text-white border border-white/15 rounded-lg focus:outline-none focus:border-[#D7FF3F]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleCreateDecision}
                        className="w-full py-2.5 px-4 text-xs font-bold bg-[#D7FF3F] text-[#101114] hover:bg-[#c2ef26] rounded-xl transition-colors cursor-pointer shadow-lg"
                      >
                        Salvar Decisão e Vincular ao Cartão
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CASO 2: medo_resistencia ou dependencia_terceiro -> Preparar conversa difícil */}
            {(selectedReason === 'medo_resistencia' || selectedReason === 'dependencia_terceiro') && (
              <div className="border border-white/10 rounded-2xl p-4 bg-[#101114] space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/10 rounded-xl text-[#D7FF3F] shrink-0 mt-0.5">
                    <MessageSquareWarning className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="text-sm font-bold text-white">
                      Preparar a conversa difícil
                    </h4>
                    <p className="text-xs text-[#8D9298] leading-relaxed">
                      Alinhe a comunicação com sócio, cliente ou colaborador usando um roteiro objetivo pronto para copiar.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 space-y-2">
                  <label className="block text-[11px] font-bold text-[#F3F0EB]">
                    Escolha a situação correspondente:
                  </label>
                  <select
                    value={conversationSlug}
                    onChange={(e) => setConversationSlug(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-[#16181D] text-white border border-white/15 rounded-xl font-medium focus:outline-none focus:border-[#D7FF3F]"
                  >
                    {CONVERSATION_SCENARIOS.map((c) => (
                      <option key={c.slug} value={c.slug} className="bg-[#16181D] text-white">
                        {c.category}: {c.title}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleGoToConversation}
                    className="w-full py-2.5 px-4 text-xs font-bold bg-[#D7FF3F] text-[#101114] hover:bg-[#c2ef26] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    <MessageSquareWarning className="w-3.5 h-3.5" />
                    <span>Ver roteiro de conversa e vincular</span>
                  </button>
                </div>
              </div>
            )}

            {/* CASO 3: tarefa_grande -> Dividir em partes */}
            {selectedReason === 'tarefa_grande' && (
              <div className="border border-white/10 rounded-2xl p-4 bg-[#101114] space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/10 rounded-xl text-[#D7FF3F] shrink-0 mt-0.5">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="text-sm font-bold text-white">
                      Dividir em partes menores
                    </h4>
                    <p className="text-xs text-[#8D9298] leading-relaxed">
                      Tarefas longas geram atrito cognitivo. Quebre este cartão em 2 a 4 ações independentes de até 20 minutos.
                    </p>
                  </div>
                </div>

                {!splitOpen ? (
                  <button
                    type="button"
                    onClick={() => setSplitOpen(true)}
                    className="w-full py-2.5 px-4 text-xs font-bold bg-[#D7FF3F] text-[#101114] hover:bg-[#c2ef26] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Abrir divisor de cartão</span>
                  </button>
                ) : (
                  <div className="pt-2 border-t border-white/10 space-y-3">
                    {splitParts.map((part, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={part.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSplitParts((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, title: val } : p))
                            );
                          }}
                          placeholder={`Parte ${idx + 1}`}
                          className="flex-1 px-3 py-2 text-xs bg-[#16181D] text-white border border-white/15 rounded-lg focus:outline-none focus:border-[#D7FF3F]"
                        />
                        <input
                          type="number"
                          value={part.durationMinutes}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 15;
                            setSplitParts((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, durationMinutes: val } : p))
                            );
                          }}
                          className="w-16 px-2 py-2 text-xs bg-[#16181D] text-white border border-white/15 rounded-lg text-center focus:outline-none focus:border-[#D7FF3F]"
                        />
                      </div>
                    ))}

                    <div className="flex items-center justify-between">
                      {splitParts.length < 4 && (
                        <button
                          type="button"
                          onClick={() =>
                            setSplitParts((prev) => [
                              ...prev,
                              {
                                title: `${task.title} - Parte ${prev.length + 1}`,
                                durationMinutes: 15,
                                expectedEvidence: ''
                              }
                            ])
                          }
                          className="text-xs font-semibold text-[#8D9298] hover:text-white cursor-pointer"
                        >
                          + Adicionar outra parte
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleConfirmSplit}
                        className="ml-auto py-2 px-4 text-xs font-bold bg-[#D7FF3F] text-[#101114] hover:bg-[#c2ef26] rounded-lg cursor-pointer shadow-lg"
                      >
                        Confirmar divisão
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CASO 4: falta_tempo -> Reduzir para 10 min ou Deixar para amanhã */}
            {selectedReason === 'falta_tempo' && (
              <div className="space-y-3">
                <div className="border border-white/10 rounded-2xl p-4 bg-[#101114] space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/10 rounded-xl text-[#D7FF3F] shrink-0 mt-0.5">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-sm font-bold text-white">
                        Reduzir para 10 minutos
                      </h4>
                      <p className="text-xs text-[#8D9298] leading-relaxed">
                        Ajusta a duração do cartão para 10 minutos e o devolve para &quot;A fazer&quot;. Faça apenas o primeiro parágrafo ou o esboço.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleReduceTo10Minutes}
                    className="w-full py-2.5 px-4 text-xs font-bold bg-[#D7FF3F] text-[#101114] hover:bg-[#c2ef26] rounded-xl transition-colors cursor-pointer shadow-lg"
                  >
                    Reduzir para 10 min e voltar a &quot;A fazer&quot;
                  </button>
                </div>

                <div className="border border-white/10 rounded-2xl p-4 bg-[#101114] space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/10 rounded-xl text-[#8D9298] shrink-0 mt-0.5">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-sm font-bold text-white">
                        Deixar para amanhã
                      </h4>
                      <p className="text-xs text-[#8D9298] leading-relaxed">
                        O cartão permanece na etapa atual, vai para o final da fila de &quot;A fazer&quot; e desocupa seu foco por hoje.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLeaveForTomorrow}
                    className="w-full py-2.5 px-4 text-xs font-bold border border-white/15 hover:bg-white/5 text-white rounded-xl transition-colors cursor-pointer"
                  >
                    Mover para o fim da fila de &quot;A fazer&quot;
                  </button>
                </div>
              </div>
            )}

            {/* CASO 5: baixa_energia -> Fazer versão mínima ou Modo Reduzido */}
            {selectedReason === 'baixa_energia' && (
              <div className="space-y-3">
                <div className="border border-white/10 rounded-2xl p-4 bg-[#101114] space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/10 rounded-xl text-[#D7FF3F] shrink-0 mt-0.5">
                      <BatteryLow className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-sm font-bold text-white">
                        Fazer só a versão mínima
                      </h4>
                      <p className="text-xs text-[#8D9298] leading-relaxed">
                        {task.minimumVersion
                          ? `Versão mínima definida: "${task.minimumVersion}"`
                          : 'Abra apenas o arquivo ou mande uma mensagem de uma linha para manter o movimento.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleMinimumVersion}
                    className="w-full py-2.5 px-4 text-xs font-bold bg-[#D7FF3F] text-[#101114] hover:bg-[#c2ef26] rounded-xl transition-colors cursor-pointer shadow-lg"
                  >
                    Fazer versão mínima e voltar para &quot;A fazer&quot;
                  </button>
                </div>

                <div className="border border-white/10 rounded-2xl p-4 bg-[#101114] space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/10 rounded-xl text-[#8D79FF] shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5 text-[#8D79FF]" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-sm font-bold text-white">
                        Ativar Modo Reduzido
                      </h4>
                      <p className="text-xs text-[#8D9298] leading-relaxed">
                        Reduz a exigência do sistema para o essencial, sem cobrança ou sensação de atraso.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleActivateReducedMode}
                    className="w-full py-2.5 px-4 text-xs font-bold bg-[#8D79FF] text-white hover:bg-[#7b66ff] rounded-xl transition-colors cursor-pointer shadow-lg"
                  >
                    Ativar Modo Reduzido
                  </button>
                </div>
              </div>
            )}

            {/* Opção universal: Só registrar por enquanto */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleJustRegister}
                className="w-full py-2.5 px-4 text-xs font-semibold text-[#8D9298] hover:text-white hover:bg-white/5 border border-white/15 rounded-xl cursor-pointer transition-colors"
              >
                Só registrar por enquanto (sem pressão, manter travado)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
