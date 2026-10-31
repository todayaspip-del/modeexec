import { useCallback } from 'react';
import { Stage } from '../../types';
import { usePersistentState } from '../../hooks/usePersistentState';
import { ShowToastFn } from './useToasts';

export function useStagesDomain(showToast: ShowToastFn) {
  const [stages, setStages] = usePersistentState<Stage[]>('stages', []);

  const addStage = useCallback(
    (stageData: Omit<Stage, 'id' | 'createdAt'>) => {
      const newStage: Stage = {
        ...stageData,
        id: `stage-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      setStages((prev) => [...prev, newStage]);
      showToast('Etapa Criada', `A etapa "${newStage.title}" foi adicionada.`);
    },
    [setStages, showToast]
  );

  const updateStage = useCallback(
    (id: string, updates: Partial<Stage>) => {
      setStages((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
      showToast('Etapa Atualizada', 'As alterações foram salvas.');
    },
    [setStages, showToast]
  );

  const deleteStage = useCallback(
    (id: string) => {
      setStages((prev) => prev.filter((s) => s.id !== id));
      showToast('Etapa Removida', 'A etapa foi excluída da mesa.', 'info');
    },
    [setStages, showToast]
  );

  return {
    stages,
    setStages,
    addStage,
    updateStage,
    deleteStage
  };
}
