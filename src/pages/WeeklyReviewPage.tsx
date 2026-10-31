import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { buildWeeklySummary } from '../lib/weeklySummary';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  CalendarCheck,
  FileCheck,
  RotateCcw,
  AlertCircle,
  X
} from 'lucide-react';

export const WeeklyReviewPage: React.FC = () => {
  const {
    projects,
    stages,
    tasks,
    ideas,
    decisions,
    weeklyReviews,
    saveWeeklyReview,
    navigateTo,
    showToast
  } = useApp();
  const [currentStep, setCurrentStep] = useState(1);

  const [form, setForm] = useState({
    completedWork: '',
    highImpactWork: '',
    openItems: '',
    canceledItems: '',
    decisionsMade: '',
    delegatedItems: '',
    nextPriority: '',
    firstPhysicalAction: ''
  });

  const [reviewSummary, setReviewSummary] = useState<any | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [fieldsToOverwrite, setFieldsToOverwrite] = useState<{ key: string; label: string; currentValue: string }[]>([]);

  const summary = useMemo(() => {
    return buildWeeklySummary({ projects, stages, tasks, ideas, decisions });
  }, [projects, stages, tasks, ideas, decisions]);

  const steps = [
    {
      num: 1,
      title: 'O que foi concluído de fato?',
      subtitle: 'Liste entregas reais, propostas enviadas ou itens finalizados com evidência.',
      field: 'completedWork',
      placeholder: 'Ex: Concluí a oferta de consultoria, cobrei o cliente Alfa e fiz o backup da ferramenta antiga...'
    },
    {
      num: 2,
      title: 'O que gerou impacto mensurável?',
      subtitle: 'Dentre tudo o que você fez, o que de fato moveu o ponteiro do caixa ou da tranquilidade operacional?',
      field: 'highImpactWork',
      placeholder: 'Ex: O envio das propostas gerou 2 reuniões qualificadas e a cobrança recuperou R$ 3.200...'
    },
    {
      num: 3,
      title: 'O que ficou aberto ou travado?',
      subtitle: 'Sem se culpar. Olhe com serenidade para o que não andou e anote o motivo.',
      field: 'openItems',
      placeholder: 'Ex: A conversa de reajuste com o fornecedor ainda não aconteceu por falta de agenda...'
    },
    {
      num: 4,
      title: 'O que deve ser cancelado conscientemente?',
      subtitle: 'Qual compromisso zumbi ou projeto que você já sabe que não vai fazer deve ser cancelado agora?',
      field: 'canceledItems',
      placeholder: 'Ex: Cancelei a ideia de criar um novo produto no Instagram este mês...'
    },
    {
      num: 5,
      title: 'Qual decisão foi tomada?',
      subtitle: 'Decisões tomadas libertam energia psíquica. Qual nó você desatou esta semana?',
      field: 'decisionsMade',
      placeholder: 'Ex: Decidi pelo modelo trimestral de consultoria e cancelei a ferramenta legada...'
    },
    {
      num: 6,
      title: 'O que precisa ser delegado ou padronizado?',
      subtitle: 'Qual tarefa repetitiva você fez esta semana que alguém da equipe poderia ter feito?',
      field: 'delegatedItems',
      placeholder: 'Ex: A emissão de relatórios de desempenho precisa de um checklist e ir para a Mariana...'
    },
    {
      num: 7,
      title: 'Qual prioridade única vem agora?',
      subtitle: 'Se você pudesse escolher apenas UMA batalha para vencer na próxima semana, qual seria?',
      field: 'nextPriority',
      placeholder: 'Ex: Fechar 2 novos clientes de consultoria e rodar o primeiro processo de onboarding...'
    },
    {
      num: 8,
      title: 'Qual será a primeira ação física de segunda-feira?',
      subtitle: 'O movimento mecânico exato dos primeiros 15 minutos: qual arquivo abrir e o que redigir?',
      field: 'firstPhysicalAction',
      placeholder: 'Ex: Abrir o WhatsApp às 09h e enviar mensagem de confirmação para os dois interessados...'
    }
  ];

  const handlePreFillClick = () => {
    const summaryFields = summary.fields;
    const overwritten: { key: string; label: string; currentValue: string }[] = [];

    (Object.keys(summaryFields) as (keyof typeof summaryFields)[]).forEach((key) => {
      const currentVal = form[key]?.trim() || '';
      const newVal = summaryFields[key]?.trim() || '';
      if (currentVal.length > 0 && newVal !== currentVal) {
        const step = steps.find((s) => s.field === key);
        overwritten.push({
          key,
          label: step ? step.title : key,
          currentValue: form[key]
        });
      }
    });

    if (overwritten.length > 0) {
      setFieldsToOverwrite(overwritten);
      setConfirmDialogOpen(true);
    } else {
      applyPreFill();
    }
  };

  const applyPreFill = () => {
    setForm((prev) => ({
      ...prev,
      ...summary.fields
    }));
    setConfirmDialogOpen(false);
    setFieldsToOverwrite([]);
    showToast('Resumo Automático Aplicado', 'Seus dados da semana foram carregados nos campos. Tudo continua editável.');
  };

  const handleNext = () => {
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save review and generate summary
      const reviewPayload = {
        weekNumber: weeklyReviews.length + 1,
        date: new Date().toISOString().split('T')[0],
        completedWork: form.completedWork || 'Atividades regulares da semana',
        highImpactWork: form.highImpactWork || 'Foco nas entregas essenciais',
        openItems: form.openItems || 'Nenhuma pendência crítica',
        canceledItems: form.canceledItems || 'Nenhum cancelamento recente',
        decisionsMade: form.decisionsMade || 'Decisões operacionais mantidas',
        delegatedItems: form.delegatedItems || 'Rotina estabilizada',
        nextPriority: form.nextPriority || 'Manter consistência do ciclo',
        firstPhysicalAction: form.firstPhysicalAction || 'Abrir o painel e checar prioridade do dia',
        completed: true
      };

      saveWeeklyReview(reviewPayload);
      setReviewSummary(reviewPayload);
      setCurrentStep(9); // Summary view
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const activeStepConfig = steps[currentStep - 1];

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D7FF3F] uppercase tracking-wide">
            <span>Ritual Semanal</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#8D9298] font-mono">
              {currentStep <= 8 ? `Etapa ${currentStep} de 8` : 'Resumo Concluído'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-display mt-1">
            Revisão Semanal em 8 Etapas
          </h1>
          <p className="text-xs text-[#8D9298] mt-1">
            Sem revisão, a culpa do que ficou aberto contamina a semana seguinte. Zere a mente agora.
          </p>
        </div>
      </div>

      {/* Confirmation Modal for Overwriting Filled Fields */}
      {confirmDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#16181D] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-white/10 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 text-white font-bold text-lg font-display">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Substituir campos já preenchidos?</span>
              </div>
              <button
                type="button"
                onClick={() => setConfirmDialogOpen(false)}
                className="p-1 rounded-lg text-[#8D9298] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#8D9298] leading-relaxed">
              Você já escreveu anotações em alguns campos desta revisão. Ao preencher com os dados automáticos da semana, os seguintes campos serão substituídos:
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {fieldsToOverwrite.map((item) => (
                <div key={item.key} className="p-3 bg-black/40 rounded-xl border border-white/10 text-xs">
                  <div className="font-semibold text-white">{item.label}</div>
                  <div className="text-[#8D9298] mt-1 line-clamp-2 italic bg-black/60 p-2 rounded-lg border border-white/10">
                    "{item.currentValue}"
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setConfirmDialogOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#8D9298] hover:text-white border border-white/20 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={applyPreFill}
                className="px-4 py-2 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                Substituir e Preencher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card: Resumo automático da semana */}
      {currentStep <= 8 && (
        <div className="bg-[#16181D] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl text-white">
          {/* Card Header & Pre-fill Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D7FF3F]" />
                <h2 className="text-base font-bold text-white font-display">
                  Resumo automático da semana
                </h2>
              </div>
              <p className="text-xs text-[#8D9298]">
                Dados consolidados dos últimos 7 dias ({summary.window.startFormatted} a {summary.window.endFormatted}).
              </p>
            </div>

            <button
              type="button"
              onClick={handlePreFillClick}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#101114]" />
              <span>Preencher com meus dados</span>
            </button>
          </div>

          {/* Compact Row: O que aconteceu nesta semana */}
          <div className="pt-3 border-t border-white/10">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8D9298] font-mono mb-2.5">
              O que aconteceu nesta semana
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-center">
                <div className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums">
                  {summary.metrics.completedCardsCount}
                </div>
                <div className="text-[11px] text-[#8D9298] mt-0.5">
                  {summary.metrics.completedCardsCount === 1 ? 'cartão concluído' : 'cartões concluídos'}
                </div>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-center">
                <div className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums">
                  {summary.metrics.completedStagesCount}
                </div>
                <div className="text-[11px] text-[#8D9298] mt-0.5">
                  {summary.metrics.completedStagesCount === 1 ? 'etapa concluída' : 'etapas concluídas'}
                </div>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-center">
                <div className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums">
                  {summary.metrics.decisionsMadeCount}
                </div>
                <div className="text-[11px] text-[#8D9298] mt-0.5">
                  {summary.metrics.decisionsMadeCount === 1 ? 'decisão tomada' : 'decisões tomadas'}
                </div>
              </div>
            </div>
          </div>

          {/* List: Projetos sem movimento há 7 dias ou mais */}
          {summary.staleProjects.length > 0 && (
            <div className="pt-3 border-t border-white/10 space-y-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8D9298] font-mono">
                Projetos sem movimento há 7 dias ou mais
              </div>
              <p className="text-xs text-[#8D9298] leading-relaxed italic">
                Esses projetos estão esperando por você. Sem pressa, mas com carinho.
              </p>
              <div className="space-y-2 pt-1">
                {summary.staleProjects.map(({ project, idleDays, currentStageTitle }) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between gap-3 p-3 bg-black/40 rounded-xl border border-white/10 text-xs text-white"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">
                        {project.name}
                      </div>
                      <div className="text-[11px] text-[#8D9298] flex items-center gap-2 mt-0.5">
                        <span className="tabular-nums font-mono text-[#D7FF3F]">
                          {idleDays} {idleDays === 1 ? 'dia sem atividade' : 'dias sem atividade'}
                        </span>
                        {currentStageTitle && (
                          <>
                            <span className="text-white/20">·</span>
                            <span className="truncate">Etapa: {currentStageTitle}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateTo(`/app/projetos/${project.id}`)}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors cursor-pointer"
                    >
                      <span>Abrir Mesa</span>
                      <ArrowRight className="w-3 h-3 text-[#D7FF3F]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Steps Flow */}
      {currentStep <= 8 && activeStepConfig && (
        <div className="bg-[#16181D] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6 text-white">
          {/* Progress bar */}
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#D7FF3F] h-full transition-all duration-300"
              style={{ width: `${(currentStep / 8) * 100}%` }}
            />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-[#D7FF3F] uppercase">
              ETAPA {activeStepConfig.num} DE 8
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
              {activeStepConfig.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#8D9298] leading-relaxed">
              {activeStepConfig.subtitle}
            </p>
          </div>

          <div>
            <textarea
              rows={4}
              required
              placeholder={activeStepConfig.placeholder}
              value={(form as any)[activeStepConfig.field]}
              onChange={(e) =>
                setForm({ ...form, [activeStepConfig.field]: e.target.value })
              }
              className="w-full p-3.5 text-xs sm:text-sm border border-white/20 rounded-xl bg-black/40 text-white placeholder-white/40 focus:outline-none focus:border-[#D7FF3F]"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8D9298] hover:text-white border border-white/20 rounded-xl px-4 py-2 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <span>{currentStep === 8 ? 'Gerar Resumo da Semana' : 'Próxima Etapa'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 9: Visual Weekly Summary */}
      {currentStep === 9 && reviewSummary && (
        <div className="bg-[#16181D] p-6 sm:p-8 rounded-2xl border border-[#D7FF3F]/40 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 text-white">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-4 h-4 text-[#D7FF3F]" />
                <span>Revisão Semanal Finalizada com Sucesso</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                Resumo Executivo da Semana #{reviewSummary.weekNumber}
              </h2>
            </div>
            <span className="text-xs font-mono text-[#8D9298]">{reviewSummary.date}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <span className="font-bold text-[#D7FF3F] uppercase text-[11px] font-mono">
                O que foi concluído:
              </span>
              <p className="text-[#F3F0EB] leading-relaxed">{reviewSummary.completedWork}</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
              <span className="font-bold text-emerald-400 uppercase text-[11px] font-mono">
                O que gerou impacto real:
              </span>
              <p className="text-[#F3F0EB] leading-relaxed">{reviewSummary.highImpactWork}</p>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <span className="font-bold text-[#D7FF3F] uppercase text-[11px] font-mono">
                Cancelamentos e Limpeza:
              </span>
              <p className="text-[#F3F0EB] leading-relaxed">{reviewSummary.canceledItems}</p>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <span className="font-bold text-[#D7FF3F] uppercase text-[11px] font-mono">
                Decisão Tomada:
              </span>
              <p className="text-[#F3F0EB] leading-relaxed">{reviewSummary.decisionsMade}</p>
            </div>
          </div>

          {/* Next Week's Dominant Battle */}
          <div className="p-5 rounded-xl bg-black/60 border border-white/15 text-white space-y-2">
            <span className="text-[11px] font-mono font-bold text-[#D7FF3F] uppercase tracking-wider">
              Prioridade Número 1 da Próxima Semana:
            </span>
            <div className="text-base font-bold leading-snug font-display text-white">
              {reviewSummary.nextPriority}
            </div>
            <div className="text-xs text-[#8D9298] pt-2 border-t border-white/10">
              <strong className="text-white">Primeiro passo físico de segunda-feira: </strong>
              <span className="text-[#F3F0EB]">{reviewSummary.firstPhysicalAction}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => {
                setCurrentStep(1);
                setReviewSummary(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-[#8D9298] hover:text-white cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Fazer nova revisão</span>
            </button>
            <button
              onClick={() => navigateTo('/app')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <span>Voltar ao Painel Pronto</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
