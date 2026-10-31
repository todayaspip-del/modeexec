import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, CheckSquare } from 'lucide-react';

interface NewCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageId: string;
  projectId: string;
  projectName: string;
}

export const NewCardModal: React.FC<NewCardModalProps> = ({
  isOpen,
  onClose,
  stageId,
  projectId,
  projectName
}) => {
  const { addCard } = useApp();
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [expectedEvidence, setExpectedEvidence] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addCard(stageId, {
      title: title.trim(),
      durationMinutes: Number(durationMinutes) || 20,
      expectedEvidence:
        expectedEvidence.trim() || 'Ação executada e evidência gerada',
      projectId,
      projectName
    });

    setTitle('');
    setDurationMinutes(20);
    setExpectedEvidence('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="bg-[#16181D] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-150 text-white">
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <CheckSquare className="w-5 h-5 text-[#D7FF3F]" />
            <h3 className="text-base font-bold text-white font-display">Novo Cartão na Etapa</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#8D9298] hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#8D9298] mb-1.5">
              Ação Física Concreta *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Escrever os 3 parágrafos da promessa da consultoria"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-white/10 rounded-xl bg-[#101114] text-white placeholder-[#8D9298] focus:outline-none focus:border-[#D7FF3F] transition-colors"
            />
            <p className="text-[11px] text-[#8D9298] mt-1.5">
              Comece com um verbo de ação física visível.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#8D9298] mb-1.5">
                Duração Estimada (min)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                step="5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-white/10 rounded-xl bg-[#101114] text-white focus:outline-none focus:border-[#D7FF3F] transition-colors tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#8D9298] mb-1.5">
                Evidência Observável
              </label>
              <input
                type="text"
                placeholder="Ex: Arquivo salvo na pasta"
                value={expectedEvidence}
                onChange={(e) => setExpectedEvidence(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-white/10 rounded-xl bg-[#101114] text-white placeholder-[#8D9298] focus:outline-none focus:border-[#D7FF3F] transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#8D9298] hover:text-white border border-white/15 rounded-xl cursor-pointer hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl cursor-pointer transition-colors shadow-sm"
            >
              Adicionar Cartão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
