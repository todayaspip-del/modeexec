import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, CheckCircle2, LifeBuoy, ArrowRight, ChevronUp, ShieldAlert } from 'lucide-react';
import { LiquidGlassButton } from '../common/LiquidGlassButton';
import { SwatchAccordion, SwatchItem } from './SwatchAccordion';
import { Mission, Task } from '../../types';

interface PrioritiesCardProps {
  mission: Mission;
  mode: string;
  nextTask?: Task;
  onNavigate: (route: string) => void;
  onOpenBlocker: () => void;
  onCompleteMission: (evidence: string) => void;
  onSwitchMobileTab?: (tab: 'seguir' | 'ciclo') => void;
  isMobile?: boolean;
}

export const PrioritiesCard: React.FC<PrioritiesCardProps> = ({
  mission: m,
  mode,
  nextTask,
  onNavigate,
  onOpenBlocker,
  onCompleteMission,
  onSwitchMobileTab,
  isMobile = false,
}) => {
  const startedKey = `modo_started_${m.id}`;

  // Inicia expandido no foco principal com o acordeão verde animado visível
  const [isExpanded, setIsExpanded] = useState(true);

  const [started, setStarted] = useState(() => {
    try {
      return localStorage.getItem(startedKey) === '1';
    } catch {
      return false;
    }
  });

  const [evidence, setEvidence] = useState('');

  const reduced = mode === 'Reduzido';
  const recovery = mode === 'Recuperação';
  const blocked = !!m.blockedReason && !m.completed;
  const minutes = reduced || blocked ? Math.min(m.estimatedMinutes, 15) : m.estimatedMinutes;
  const action = reduced || blocked ? m.minimalAction : m.practicalAction;

  const handleStart = () => {
    setStarted(true);
    try {
      localStorage.setItem(startedKey, '1');
    } catch {
      /* ignore */
    }
  };

  const handleFinish = () => {
    if (evidence.trim()) {
      onCompleteMission(evidence.trim());
      setEvidence('');
      setIsExpanded(false);
    }
  };

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  // 1. ESTADO CONCLUÍDO
  if (m.completed) {
    return (
      <div className="w-full text-center flex flex-col items-center py-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono mb-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Missão Concluída</span>
          <span className="text-white/30">·</span>
          <span className="text-emerald-300/80">Evidência Registrada</span>
        </div>

        <h2 className="text-base sm:text-lg font-bold tracking-tight text-white mb-3 max-w-xl truncate">
          {nextTask ? nextTask.title : 'Ciclo de hoje fechado com evidência.'}
        </h2>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <LiquidGlassButton
            label={nextTask ? 'Ver Próxima Ação' : 'Ver Todas as Tarefas'}
            icon="arrow"
            variant="frosted"
            size={isMobile ? 'sm' : 'md'}
            onClick={() => {
              if (nextTask?.projectId) {
                onNavigate(`/app/projetos/${nextTask.projectId}?cartao=${nextTask.id}`);
              } else {
                onNavigate('/app/tarefas');
              }
            }}
          />
          <button
            onClick={() => onNavigate(`/app/missao/${m.id}`)}
            className="text-xs text-white/60 hover:text-white underline underline-offset-4 cursor-pointer transition-colors"
          >
            Rever evidência da missão #{m.id}
          </button>
        </div>
      </div>
    );
  }

  // 2. ESTADO RECUPERAÇÃO
  if (recovery) {
    return (
      <div className="w-full text-center flex flex-col items-center py-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono mb-2">
          <LifeBuoy className="w-4 h-4 shrink-0" />
          <span>Modo Recuperação</span>
        </div>
        <h2 className="text-base sm:text-lg font-bold tracking-tight mb-3 truncate max-w-xl text-white">
          Retomar o movimento sem tentar compensar tudo
        </h2>
        <div className="pt-1">
          <LiquidGlassButton
            label="Ver Ação Simples"
            icon="arrow"
            variant="tinted"
            size={isMobile ? 'sm' : 'md'}
            onClick={() => onNavigate('/app/recuperacao')}
          />
        </div>
      </div>
    );
  }

  // Definição dos itens do SwatchAccordion com a identidade verde Modo eXec e alto contraste
  const swatchItems: SwatchItem[] = [
    {
      id: 'step-action',
      title: 'Ação Física',
      description: action,
      tags: [`${minutes} MIN`, 'BANCADA'],
      button: !started ? (reduced || blocked ? 'Começar Essencial' : 'Iniciar Foco') : 'Timer Ativo',
      onButtonClick: () => {
        if (!started) handleStart();
      },
      content: (
        <div className="flex items-center gap-2.5 bg-[#101114]/10 rounded-xl p-2.5 border border-[#101114]/20 mb-2">
          <div className="w-7 h-7 rounded-lg bg-[#101114] flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-[#D7FF3F]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-mono text-[#101114] font-extrabold uppercase tracking-wide">
              {started ? 'Bancada em execução' : `Timer de ${minutes} minutos`}
            </span>
            <p className="text-xs text-[#101114]/85 font-semibold truncate">
              {started
                ? 'Foque apenas nesta tela até obter o resultado.'
                : 'Vença a resistência dos primeiros 60 segundos.'}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'step-evidence',
      title: 'Critério de Saída',
      description:
        m.expectedEvidence ||
        'Defina a evidência concreta necessária para comprovar a conclusão deste passo.',
      tags: ['EVIDÊNCIA', 'FECHAMENTO'],
      button: 'Concluir Passo',
      onButtonClick: handleFinish,
      content: (
        <div className="mb-2">
          <textarea
            id={`evidence-quick-${m.id}`}
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            rows={2}
            placeholder="Digite a evidência tangível (link, print, texto)..."
            className="w-full rounded-xl bg-[#101114]/10 text-[#101114] placeholder:text-[#101114]/60 border border-[#101114]/25 px-3 py-2 text-xs outline-none focus:border-[#101114] focus:bg-[#101114]/15 font-medium transition-all resize-none"
          />
        </div>
      ),
    },
    {
      id: 'step-unblock',
      title: 'Antitravamento',
      description:
        'Sentiu hesitação ou bloqueio? Não abandone a tarefa; reduza para a versão de 5 minutos ou relate a trava.',
      tags: ['5 MIN', 'SUPORTE'],
      button: 'Relatar Trava',
      onButtonClick: onOpenBlocker,
      content: (
        <div className="flex items-center gap-2 bg-[#101114]/10 rounded-xl p-2.5 border border-[#101114]/20 mb-2">
          <ShieldAlert className="w-4 h-4 text-[#101114] shrink-0" />
          <span className="text-xs text-[#101114]/90 font-semibold">
            Ative a versão essencial de 5 minutos sem culpa.
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* ESTADO RECOLHIDO:
             A frase "PRIMEIRO PASSO FÍSICO" fica dentro de uma caixa cinza estilo vidro (gray glass box),
             com o botão LiquidGlass "Ver Agora" posicionado logo abaixo.
             Essa caixa desaparece completamente ao clicar em "Ver Agora". */
          <motion.div
            key="collapsed-box"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center justify-center text-center w-full py-4 sm:py-6"
          >
            {/* Caixa verde estilo vidro da identidade visual (Green Glass Box) */}
            <div className="relative inline-flex items-center justify-center gap-2.5 px-6 py-2.5 mb-3.5 rounded-2xl bg-[#D7FF3F]/10 hover:bg-[#D7FF3F]/15 border border-[#D7FF3F]/30 backdrop-blur-xl shadow-lg shadow-black/40 transition-all duration-300">
              {/* Efeito de brilho especular sutil na borda superior */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D7FF3F]/40 to-transparent pointer-events-none rounded-t-2xl" />

              <span className="w-2 h-2 rounded-full bg-[#D7FF3F] shadow-[0_0_10px_rgba(215,255,63,0.9)] shrink-0 animate-pulse" />
              <h2 className="text-xs sm:text-sm font-bold tracking-widest text-[#D7FF3F] uppercase font-mono truncate whitespace-nowrap">
                PRIMEIRO PASSO FÍSICO
              </h2>
            </div>

            {/* Botão de vidro logo abaixo */}
            <div className="flex flex-col items-center">
              <LiquidGlassButton
                label="Ver Agora"
                icon="arrow"
                iconPosition="right"
                variant="signal"
                size={isMobile ? 'sm' : 'md'}
                onClick={handleToggleExpand}
                ariaLabel="Ver Agora - Expandir prioridade"
              />
            </div>
          </motion.div>
        ) : (
          /* ESTADO EXPANDIDO: A caixa cinza desaparece completamente, dando lugar diretamente ao SwatchAccordion */
          <motion.div
            key="expanded-accordion"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full space-y-3"
          >
            {/* Barra de controle no topo do acordeão */}
            <div className="flex items-center justify-between pb-1 w-full">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-[#D7FF3F] shrink-0 shadow-[0_0_8px_rgba(215,255,63,0.8)]" />
                <span className="text-xs font-mono tracking-wider text-[#D7FF3F] font-bold uppercase truncate">
                  PRIMEIRO PASSO FÍSICO
                </span>
                <span className="text-white/20">·</span>
                <span className="text-xs text-white/60 truncate font-medium">
                  {action}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleExpand}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors cursor-pointer shrink-0"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Recolher</span>
              </button>
            </div>

            {/* CLONE EXATO DO SWATCH ACCORDION DO FRAMER - MODO EXEC ACID LIME */}
            <SwatchAccordion
              items={swatchItems}
              openItem={1}
              trigger="hover"
              direction="auto"
              stripWidth={80}
              barHeight={54}
              numbers={true}
              padding="20px"
              gap="8px"
              radius="20px"
              textColor="#101114"
              buttonColor="#101114"
              buttonTextColor="#D7FF3F"
            />

          {/* Rodapé limpo de navegação */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
            <button
              type="button"
              onClick={() => onNavigate(`/app/missao/${m.id}`)}
              className="hover:text-white underline underline-offset-4 cursor-pointer transition-colors"
            >
              Ver fundamentação detalhada da missão #{m.id} →
            </button>

            {isMobile && onSwitchMobileTab && (
              <button
                type="button"
                onClick={() => onSwitchMobileTab('seguir')}
                className="text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1 cursor-pointer"
              >
                Ver fila de tarefas <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
};
