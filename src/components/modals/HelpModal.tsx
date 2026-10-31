import React from 'react';
import { X, HelpCircle, Target, Footprints, CheckSquare, Sparkles } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#16181D] rounded-xl max-w-lg w-full p-6 shadow-2xl border border-white/10">
        <div className="flex items-start justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#D7FF3F]" />
            <h3 className="text-base font-display font-bold text-white">
              Guia Rápido de Execução Imediata
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#8D9298] hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <p className="text-xs text-[#8D9298] leading-relaxed">
            Sempre que você sentir hesitação ou confusão mental diante de qualquer tarefa ou projeto, faça a si mesmo estas três perguntas fundamentais:
          </p>

          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-white/10 bg-black/30">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Target className="w-4 h-4 text-[#D7FF3F]" />
                <span>1. O que importa agora?</span>
              </div>
              <p className="text-[11px] text-[#8D9298] mt-1 leading-snug">
                Isole a prioridade dominante. Não tente resolver a semana toda em uma tarde. O que move o ponteiro hoje?
              </p>
            </div>

            <div className="p-3 rounded-lg border border-white/10 bg-black/30">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Footprints className="w-4 h-4 text-[#D7FF3F]" />
                <span>2. Qual é a próxima ação física?</span>
              </div>
              <p className="text-[11px] text-[#8D9298] mt-1 leading-snug">
                Substitua termos vagos como &quot;planejar marketing&quot; por ações mecânicas: &quot;Abrir o documento de texto e escrever 3 parágrafos&quot;.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-white/10 bg-black/30">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <CheckSquare className="w-4 h-4 text-[#D7FF3F]" />
                <span>3. Como saberei que concluí?</span>
              </div>
              <p className="text-[11px] text-[#8D9298] mt-1 leading-snug">
                Defina a <strong className="text-white">evidência visível</strong>: um e-mail enviado, um PDF exportado, um print salvo, um áudio gravado. Sem evidência, a tarefa nunca parece terminada.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#D7FF3F]/10 border border-[#D7FF3F]/20 text-[#F3F0EB] text-xs">
            <div className="font-bold text-[#D7FF3F] flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#D7FF3F]" />
              <span>Dica de Ouro: A Regra dos 120 Segundos</span>
            </div>
            <p className="text-[11px] text-[#F3F0EB]/90 leading-relaxed">
              Você não precisa concluir o projeto todo agora. Apenas posicione as mãos no teclado e comprometa-se a executar os primeiros 2 minutos. A inércia inicial é a parte mais pesada da jornada.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              Entendi, voltar à execução
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
