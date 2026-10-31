import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DIAGNOSTIC_PATTERNS } from '../data/seedData';
import { ExecutionPatternKey } from '../types';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Compass,
  AlertCircle
} from 'lucide-react';

interface DiagnosticAnswer {
  mainDifficulty: string;
  mostPostponedTask: string;
  oldestDecision: string;
  dailyAvailability: number;
  teamSize: string;
  coreBottleneck: 'comecar' | 'decidir' | 'sustentar' | 'finalizar';
}

export const DiagnosticPage: React.FC = () => {
  const { navigateTo, updateUserProfile } = useApp();
  const [step, setStep] = useState<number>(1);
  const [answers, setAnswers] = useState<DiagnosticAnswer>({
    mainDifficulty: 'excesso_planejamento',
    mostPostponedTask: '',
    oldestDecision: '',
    dailyAvailability: 20,
    teamSize: '2 a 5 pessoas',
    coreBottleneck: 'comecar'
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [detectedPattern, setDetectedPattern] = useState<ExecutionPatternKey | null>(null);

  // Compute pattern based on answers
  const computePattern = (): ExecutionPatternKey => {
    if (answers.coreBottleneck === 'decidir') return 'dificuldade_decisao';
    if (answers.mainDifficulty === 'conversas') return 'conversa_evitada';
    if (answers.mainDifficulty === 'vendas') return 'medo_vender';
    if (answers.mainDifficulty === 'delegacao') return 'dificuldade_delegacao';
    if (answers.mainDifficulty === 'ideias') return 'excesso_ideias';
    if (answers.mainDifficulty === 'energia') return 'baixa_energia';
    if (answers.coreBottleneck === 'finalizar') return 'perfeccionismo';
    if (answers.coreBottleneck === 'comecar') return 'excesso_planejamento';
    return 'falta_clareza';
  };

  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1);
    } else {
      setAnalyzing(true);
      setTimeout(() => {
        const pattern = computePattern();
        setDetectedPattern(pattern);
        updateUserProfile({
          executionPattern: pattern,
          dailyMinutes: answers.dailyAvailability,
          teamSize: answers.teamSize
        });
        setAnalyzing(false);
        setStep(7); // Result screen
      }, 700);
    }
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const patternData = detectedPattern ? DIAGNOSTIC_PATTERNS[detectedPattern] : null;

  return (
    <div className="min-h-screen bg-[#101114] py-12 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-2xl mx-auto">
        {/* Step indicator */}
        {step <= 6 && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs text-[#8D9298] mb-2 font-mono">
              <span className="font-semibold text-white uppercase tracking-wide">
                Diagnóstico de Execução · Etapa {step} de 6
              </span>
              <span>{Math.round((step / 6) * 100)}%</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#D7FF3F] h-full transition-all duration-300"
                style={{ width: `${(step / 6) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Loading state during pattern computation */}
        {analyzing && (
          <div className="p-12 text-center bg-[#16181D] rounded-2xl border border-white/10 shadow-2xl space-y-4 text-white">
            <div className="w-10 h-10 border-3 border-white/20 border-t-[#D7FF3F] rounded-full animate-spin mx-auto" />
            <h3 className="text-base font-bold text-white font-display">
              Analisando seu padrão operacional...
            </h3>
            <p className="text-xs text-[#8D9298] max-w-sm mx-auto">
              Cruzando tempo de inércia, gargalo primário e resistência de fechamento.
            </p>
          </div>
        )}

        {/* Step 1: Principal dificuldade */}
        {!analyzing && step === 1 && (
          <div className="bg-[#16181D] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6 text-white">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-[#D7FF3F] uppercase tracking-wide">
                Pergunta 1
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                Qual é a sua principal dificuldade prática hoje?
              </h2>
              <p className="text-xs text-[#8D9298]">
                Selecione o cenário que mais consome sua paz e produtividade.
              </p>
            </div>

            <div className="space-y-2">
              {[
                { id: 'excesso_planejamento', label: 'Passo muito tempo planejando, pesquisando e organizando antes de agir.' },
                { id: 'perfeccionismo', label: 'Travo na hora de publicar ou enviar; fico refinando até a exaustão.' },
                { id: 'conversas', label: 'Adio conversas desconfortáveis (cobrar clientes, reajustar valores, dar feedbacks).' },
                { id: 'delegacao', label: 'Centralizo tudo porque acho que se eu fizer é mais rápido e bem feito.' },
                { id: 'vendas', label: 'Preparo tudo, mas travo na hora de abordar contatos e pedir o fechamento.' },
                { id: 'ideias', label: 'Tenho ideias novas toda semana e acabo não concluindo os projetos antigos.' },
                { id: 'energia', label: 'Sinto cansaço mental constante e não tenho foco para tarefas densas.' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAnswers({ ...answers, mainDifficulty: opt.id })}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
                    answers.mainDifficulty === opt.id
                      ? 'border-[#D7FF3F] bg-[#D7FF3F]/15 text-white font-medium ring-1 ring-[#D7FF3F]'
                      : 'border-white/10 hover:border-white/25 text-[#F3F0EB] bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                <span>Próxima pergunta</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Tarefa mais adiada */}
        {!analyzing && step === 2 && (
          <div className="bg-[#16181D] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6 text-white">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-[#D7FF3F] uppercase tracking-wide">
                Pergunta 2
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                Qual tarefa específica você vem empurrando há mais tempo?
              </h2>
              <p className="text-xs text-[#8D9298]">
                Seja concreto. Não precisa ser perfeito, apenas coloque o peso para fora.
              </p>
            </div>

            <div>
              <textarea
                rows={3}
                placeholder="Ex: Mandar a proposta revisada para os clientes antigos, cancelar uma ferramenta sem uso, organizar as notas de setembro..."
                value={answers.mostPostponedTask}
                onChange={(e) => setAnswers({ ...answers, mostPostponedTask: e.target.value })}
                className="w-full p-3 text-xs border border-white/20 rounded-xl bg-black/40 text-white placeholder-white/40 focus:outline-none focus:border-[#D7FF3F]"
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <button
                onClick={handlePrevious}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#8D9298] hover:text-white border border-white/20 rounded-xl cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                <span>Avançar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Decisão mais antiga */}
        {!analyzing && step === 3 && (
          <div className="bg-[#16181D] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6 text-white">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-[#D7FF3F] uppercase tracking-wide">
                Pergunta 3
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                Qual decisão estratégica ou operacional está aberta na sua mente?
              </h2>
              <p className="text-xs text-[#8D9298]">
                Toda decisão não tomada gera um custo invisível de indecisão contínua.
              </p>
            </div>

            <div>
              <input
                type="text"
                placeholder="Ex: Mudar o preço da consultoria, demitir prestador, trocar de software..."
                value={answers.oldestDecision}
                onChange={(e) => setAnswers({ ...answers, oldestDecision: e.target.value })}
                className="w-full p-3 text-xs border border-white/20 rounded-xl bg-black/40 text-white placeholder-white/40 focus:outline-none focus:border-[#D7FF3F]"
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <button
                onClick={handlePrevious}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#8D9298] hover:text-white border border-white/20 rounded-xl cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                <span>Avançar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Disponibilidade diária */}
        {!analyzing && step === 4 && (
          <div className="bg-[#16181D] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6 text-white">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-[#D7FF3F] uppercase tracking-wide">
                Pergunta 4
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                Quanto tempo real você pode dedicar à execução guiada por dia?
              </h2>
              <p className="text-xs text-[#8D9298]">
                Não escolha o cenário utópico. Escolha o tempo que você consegue sustentar até em dias difíceis.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { val: 10, label: '10 minutos/dia', note: 'Para rotinas ultra apertadas (Modo Reduzido)' },
                { val: 20, label: '20 minutos/dia', note: 'Ritmo ideal recomendado (Modo Normal)' },
                { val: 40, label: '40 minutos/dia', note: 'Para quem busca aceleração profunda' }
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setAnswers({ ...answers, dailyAvailability: opt.val })}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    answers.dailyAvailability === opt.val
                      ? 'border-[#D7FF3F] bg-[#D7FF3F]/15 ring-1 ring-[#D7FF3F] text-white'
                      : 'border-white/10 hover:border-white/25 bg-white/5 text-[#F3F0EB]'
                  }`}
                >
                  <div className="text-xs font-bold text-white font-display">{opt.label}</div>
                  <div className="text-[11px] text-[#8D9298] mt-1">{opt.note}</div>
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <button
                onClick={handlePrevious}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#8D9298] hover:text-white border border-white/20 rounded-xl cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                <span>Avançar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Tamanho da equipe */}
        {!analyzing && step === 5 && (
          <div className="bg-[#16181D] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6 text-white">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-[#D7FF3F] uppercase tracking-wide">
                Pergunta 5
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                Qual é a estrutura atual da sua operação?
              </h2>
              <p className="text-xs text-[#8D9298]">
                Para calibrarmos as orientações de delegação e processos.
              </p>
            </div>

            <div className="space-y-2">
              {[
                { id: '1 pessoa', label: 'Apenas eu (Eu-preendedor / autônomo)' },
                { id: '2 a 5 pessoas', label: 'Equipe pequena (2 a 5 pessoas entre sócios e prestadores)' },
                { id: '6 a 15 pessoas', label: 'Equipe em crescimento (6 a 15 colaboradores)' },
                { id: '15+ pessoas', label: 'Operação estabelecida (+15 pessoas com lideranças)' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAnswers({ ...answers, teamSize: opt.id })}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
                    answers.teamSize === opt.id
                      ? 'border-[#D7FF3F] bg-[#D7FF3F]/15 text-white font-medium ring-1 ring-[#D7FF3F]'
                      : 'border-white/10 hover:border-white/25 text-[#F3F0EB] bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <button
                onClick={handlePrevious}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#8D9298] hover:text-white border border-white/20 rounded-xl cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                <span>Avançar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Dificuldade predominante */}
        {!analyzing && step === 6 && (
          <div className="bg-[#16181D] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6 text-white">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-[#D7FF3F] uppercase tracking-wide">
                Pergunta 6 · O Gargalo Principal
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                Onde a sua energia mais se esvai?
              </h2>
              <p className="text-xs text-[#8D9298]">
                Identifique a fase do ciclo de execução onde ocorre a maior perda de tração.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'comecar', title: 'Começar', desc: 'Dificuldade de sentar na cadeira e dar a primeira martelada na tarefa.' },
                { id: 'decidir', title: 'Decidir', desc: 'Paralisia por excesso de opções ou medo de escolher o caminho errado.' },
                { id: 'sustentar', title: 'Sustentar', desc: 'Falta de constância; animação nos primeiros 3 dias e abandono depois.' },
                { id: 'finalizar', title: 'Finalizar', desc: 'O rascunho eterno; dificuldade de dar a tarefa por concluída e entregar.' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAnswers({ ...answers, coreBottleneck: opt.id as any })}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    answers.coreBottleneck === opt.id
                      ? 'border-[#D7FF3F] bg-[#D7FF3F]/15 ring-1 ring-[#D7FF3F] text-white'
                      : 'border-white/10 hover:border-white/25 bg-white/5 text-[#F3F0EB]'
                  }`}
                >
                  <div className="text-xs font-bold text-white font-display">{opt.title}</div>
                  <div className="text-[11px] text-[#8D9298] mt-1 leading-snug">{opt.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <button
                onClick={handlePrevious}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#8D9298] hover:text-white border border-white/20 rounded-xl cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                <span>Ver Meu Padrão de Execução</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Resultado do Diagnóstico */}
        {!analyzing && step === 7 && patternData && (
          <div className="bg-[#16181D] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 text-white">
            <div className="border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#D7FF3F] uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Padrão de Execução Observado</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
                {patternData.title}
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-[#F3F0EB] leading-relaxed">
              {patternData.description}
            </p>

            {/* Sinais percebidos */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
              <span className="text-xs font-mono font-bold text-[#D7FF3F] uppercase tracking-wide">
                Sinais Típicos do Seu Padrão:
              </span>
              <ul className="space-y-1.5 text-xs text-[#8D9298]">
                {patternData.perceivedSigns.map((sign, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#D7FF3F] font-bold">·</span>
                    <span className="text-[#F3F0EB]">{sign}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Primeira recomendação */}
            <div className="p-4 rounded-xl bg-[#D7FF3F]/10 border border-[#D7FF3F]/30 space-y-1.5">
              <span className="text-xs font-mono font-bold text-[#D7FF3F] uppercase tracking-wide">
                Primeira Recomendação Cirúrgica:
              </span>
              <p className="text-xs text-white leading-relaxed font-medium">
                {patternData.firstRecommendation}
              </p>
              <p className="text-[11px] text-[#8D9298] italic pt-1">
                {patternData.secondaryAdvice}
              </p>
            </div>

            {/* Non-clinical warning */}
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-start gap-2 text-[11px] text-[#8D9298]">
              <ShieldCheck className="w-4 h-4 text-[#8D9298] shrink-0 mt-0.5" />
              <span>
                <strong>Aviso Importante:</strong> Este resultado é uma análise gerencial e comportamental de produtividade para fins educacionais. Não constitui diagnóstico médico ou psicológico.
              </span>
            </div>

            {/* Call to action to start the first mission */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => navigateTo('/onboarding')}
                className="text-xs font-semibold text-[#8D9298] hover:text-white"
              >
                Ajustar dados do perfil
              </button>
              <button
                onClick={() => navigateTo('/app/missao/1')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                <span>Iniciar Minha Primeira Missão Prática</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
