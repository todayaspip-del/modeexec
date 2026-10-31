import React, { useState, useEffect } from 'react';
import { Stage } from '../../types';
import { useApp } from '../../context/AppContext';
import { getBoardRules, canAddStage, validateDoneCriteria } from '../../lib/boardRules';
import { X, Layers, Edit2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface NewStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const NewStageModal: React.FC<NewStageModalProps> = ({
  isOpen,
  onClose,
  projectId
}) => {
  const { userProfile, stages, addStage, showToast } = useApp();
  const [title, setTitle] = useState('');
  const [doneCriteria, setDoneCriteria] = useState('');
  const [error, setError] = useState<string | null>(null);

  const rules = getBoardRules(userProfile);
  const projectStages = stages.filter((s) => s.projectId === projectId);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDoneCriteria('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const stageLimitCheck = canAddStage(projectStages, rules);
    if (stageLimitCheck) {
      setError(`${stageLimitCheck.message} ${stageLimitCheck.hint}`);
      showToast('Limite de Etapas', stageLimitCheck.message, 'warning');
      return;
    }

    const criteriaCheck = validateDoneCriteria(doneCriteria, rules);
    if (criteriaCheck) {
      setError(`${criteriaCheck.message} ${criteriaCheck.hint}`);
      return;
    }

    const created = addStage(projectId, {
      title: title.trim(),
      doneCriteria: doneCriteria.trim()
    });

    if (created) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#16181D] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-white/10 text-white animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#D7FF3F]" />
            <h3 className="text-base font-display font-bold text-white">Nova Etapa do Projeto</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#8D9298] hover:text-white p-1 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#F3F0EB] mb-1">
              Nome da Etapa *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Prototipagem da oferta e validação inicial"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#101114] text-white border border-white/15 rounded-xl focus:outline-none focus:border-[#D7FF3F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F3F0EB] mb-1">
              Critério de Conclusão (O que torna a etapa terminada?) *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Ex: Três conversas exploratórias realizadas e tabela de preços definida em documento único."
              value={doneCriteria}
              onChange={(e) => setDoneCriteria(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#101114] text-white border border-white/15 rounded-xl focus:outline-none focus:border-[#D7FF3F] leading-relaxed"
            />
            <p className="text-[11px] text-[#8D9298] mt-1">
              Defina uma evidência observável para saber quando a etapa foi cumprida sem ambiguidade.
            </p>
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
              Criar Etapa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EditStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  stage: Stage | null;
}

export const EditStageModal: React.FC<EditStageModalProps> = ({
  isOpen,
  onClose,
  stage
}) => {
  const { updateStage } = useApp();
  const [title, setTitle] = useState('');
  const [doneCriteria, setDoneCriteria] = useState('');

  useEffect(() => {
    if (stage) {
      setTitle(stage.title);
      setDoneCriteria(stage.doneCriteria);
    }
  }, [stage]);

  if (!isOpen || !stage) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !doneCriteria.trim()) return;

    updateStage(stage.id, {
      title: title.trim(),
      doneCriteria: doneCriteria.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#16181D] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-white/10 text-white animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-[#D7FF3F]" />
            <h3 className="text-base font-display font-bold text-white">Editar Etapa</h3>
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
              Nome da Etapa *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#101114] text-white border border-white/15 rounded-xl focus:outline-none focus:border-[#D7FF3F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F3F0EB] mb-1">
              Critério de Conclusão *
            </label>
            <textarea
              required
              rows={3}
              value={doneCriteria}
              onChange={(e) => setDoneCriteria(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#101114] text-white border border-white/15 rounded-xl focus:outline-none focus:border-[#D7FF3F] leading-relaxed"
            />
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

interface CompleteStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  stageTitle: string;
  pendingTasksCount: number;
}

export const CompleteStageModal: React.FC<CompleteStageModalProps> = ({
  isOpen,
  onClose,
  projectId,
  stageTitle,
  pendingTasksCount
}) => {
  const { completeCurrentStage } = useApp();
  const [leftovers, setLeftovers] = useState<'move_next' | 'park' | 'archive'>('move_next');

  if (!isOpen) return null;

  const handleConfirm = () => {
    completeCurrentStage(projectId, { leftovers, ignoreDecisions: true });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#16181D] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-white/10 text-white animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#D7FF3F]" />
            <h3 className="text-base font-display font-bold text-white">Concluir Etapa Atual</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#8D9298] hover:text-white p-1 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <p className="text-sm text-[#F3F0EB]">
            Você está concluindo a etapa <strong className="text-white">&quot;{stageTitle}&quot;</strong>.
          </p>

          {pendingTasksCount > 0 ? (
            <div className="p-4 bg-[#101114] border border-white/10 rounded-xl space-y-3">
              <div className="text-xs font-semibold text-[#D7FF3F]">
                Ainda há {pendingTasksCount} {pendingTasksCount === 1 ? 'cartão aberto' : 'cartões abertos'} nesta etapa. O que deseja fazer?
              </div>
              <div className="space-y-2 text-xs text-[#F3F0EB]">
                <label className="flex items-center gap-2.5 cursor-pointer hover:text-white">
                  <input
                    type="radio"
                    name="leftovers"
                    value="move_next"
                    checked={leftovers === 'move_next'}
                    onChange={() => setLeftovers('move_next')}
                    className="accent-[#D7FF3F]"
                  />
                  <span>Mover cartões abertos para a próxima etapa</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer hover:text-white">
                  <input
                    type="radio"
                    name="leftovers"
                    value="park"
                    checked={leftovers === 'park'}
                    onChange={() => setLeftovers('park')}
                    className="accent-[#D7FF3F]"
                  />
                  <span>Guardar no Estacionamento de ideias</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer hover:text-white">
                  <input
                    type="radio"
                    name="leftovers"
                    value="archive"
                    checked={leftovers === 'archive'}
                    onChange={() => setLeftovers('archive')}
                    className="accent-[#D7FF3F]"
                  />
                  <span>Arquivar cartões não concluídos</span>
                </label>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#8D9298] bg-[#101114] p-3.5 rounded-xl border border-white/10">
              Todos os cartões desta etapa foram concluídos. A próxima etapa será promovida a etapa atual.
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#8D9298] hover:text-white border border-white/15 rounded-xl cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-[#c2ef26] rounded-xl cursor-pointer transition-colors shadow-lg"
            >
              Confirmar Conclusão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
