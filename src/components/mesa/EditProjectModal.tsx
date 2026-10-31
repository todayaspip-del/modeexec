import React, { useState, useEffect } from 'react';
import { Project, Priority } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Edit3 } from 'lucide-react';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const { updateProject } = useApp();
  const [name, setName] = useState(project.name);
  const [desiredOutcome, setDesiredOutcome] = useState(project.desiredOutcome);
  const [deadline, setDeadline] = useState(project.deadline || '');
  const [priority, setPriority] = useState<Priority>(project.priority);

  useEffect(() => {
    if (isOpen) {
      setName(project.name);
      setDesiredOutcome(project.desiredOutcome);
      setDeadline(project.deadline || '');
      setPriority(project.priority);
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateProject(project.id, {
      name: name.trim(),
      desiredOutcome: desiredOutcome.trim() || 'Resultado em definição',
      deadline: deadline || undefined,
      priority
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#16181D] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-white/10 text-white animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-[#D7FF3F]" />
            <h3 className="text-base font-display font-bold text-white">Editar Projeto</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#8D9298] hover:text-white p-1 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#F3F0EB] mb-1">
              Nome do Projeto *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#101114] text-white border border-white/15 rounded-xl focus:outline-none focus:border-[#D7FF3F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F3F0EB] mb-1">
              Resultado Desejado (Critério de Conclusão) *
            </label>
            <textarea
              required
              rows={3}
              value={desiredOutcome}
              onChange={(e) => setDesiredOutcome(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#101114] text-white border border-white/15 rounded-xl focus:outline-none focus:border-[#D7FF3F] leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#F3F0EB] mb-1">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 text-sm bg-[#101114] text-white border border-white/15 rounded-xl focus:outline-none focus:border-[#D7FF3F]"
              >
                <option value="Alta" className="bg-[#101114] text-white">Alta</option>
                <option value="Média" className="bg-[#101114] text-white">Média</option>
                <option value="Baixa" className="bg-[#101114] text-white">Baixa</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#F3F0EB] mb-1">
                Prazo Opcional
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#101114] text-white border border-white/15 rounded-xl focus:outline-none focus:border-[#D7FF3F]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#8D9298] hover:text-white border border-white/15 rounded-xl cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-[#c2ef26] rounded-xl cursor-pointer transition-colors shadow-lg"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
