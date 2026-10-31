import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BlockerReason, Mission } from '../../types';
import { X, ArrowRight, HeartHandshake, ShieldCheck } from 'lucide-react';
import { BLOCKER_OPTIONS } from '../../data/blockerCopy';

interface BlockerModalProps {
  mission: Mission;
  isOpen: boolean;
  onClose: () => void;
  onAcceptReduced: () => void;
}

export const BlockerModal: React.FC<BlockerModalProps> = ({
  mission,
  isOpen,
  onClose,
  onAcceptReduced
}) => {
  const { blockMission } = useApp();
  const [selectedReason, setSelectedReason] = useState<BlockerReason | null>(null);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'reason' | 'solution'>('reason');

  if (!isOpen) return null;

  const handleSelectReason = (reason: BlockerReason) => {
    setSelectedReason(reason);
    blockMission(mission.id, reason, notes);
    setStep('solution');
  };

  const handleFinish = () => {
    onClose();
    onAcceptReduced();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#16181D] rounded-xl max-w-lg w-full p-6 shadow-2xl border border-white/10">
        <div className="flex items-start justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-[#D7FF3F]" />
            <h3 className="text-base font-display font-bold text-white">
              {step === 'reason' ? 'Acolhendo o Bloqueio' : 'Plano de Redução'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#8D9298] hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'reason' ? (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-[#8D9298] leading-relaxed">
              Não conseguir executar hoje não é falha nem falta de força de vontade. É apenas um sinal de atrito. Para desarmar a resistência, selecione o motivo que mais se aproxima do seu bloqueio:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {BLOCKER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectReason(opt.id)}
                  className="w-full text-left p-3 rounded-lg border border-white/10 hover:border-[#D7FF3F] bg-black/30 hover:bg-black/50 transition-all cursor-pointer group"
                >
                  <div className="text-xs font-bold text-white group-hover:text-[#D7FF3F]">
                    {opt.label}
                  </div>
                  <div className="text-[11px] text-[#8D9298] mt-0.5 leading-snug">
                    {opt.explanation}
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <label className="block text-[11px] font-medium text-[#8D9298] mb-1">
                Anotação rápida opcional (para seu registro pessoal):
              </label>
              <input
                type="text"
                placeholder="Ex: O cliente não me enviou o arquivo ainda..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white placeholder:text-[#8D9298]/50 focus:outline-none focus:border-[#D7FF3F]"
              />
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="bg-[#D7FF3F]/10 border border-[#D7FF3F]/30 p-4 rounded-lg">
              <span className="text-[11px] font-bold text-[#D7FF3F] uppercase tracking-wide">
                Sem Culpa · Ação Mínima Desenhada
              </span>
              <p className="text-xs text-[#F3F0EB]/90 mt-1.5 leading-relaxed">
                Quando a missão completa encontra fricção, o segredo da execução contínua é recuar um degrau sem abandonar a postura executiva.
              </p>
            </div>

            <div className="border border-white/10 rounded-lg p-4 bg-black/40">
              <div className="text-xs font-medium text-[#8D9298] mb-1">
                Missão Reduzida Sugerida:
              </div>
              <div className="text-sm font-bold text-white leading-snug">
                {mission.minimalAction}
              </div>
              <div className="text-[11px] text-[#8D9298] mt-2">
                Tempo estimado: <strong className="text-white">3 a 5 minutos</strong>.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#8D9298] hover:text-white transition-colors cursor-pointer"
              >
                Retomar mais tarde
              </button>
              <button
                onClick={handleFinish}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                <span>Fazer Versão Mínima Agora</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
