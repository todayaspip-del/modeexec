import { useCallback } from 'react';
import { Idea } from '../../types';
import { usePersistentState } from '../../hooks/usePersistentState';
import { ShowToastFn } from './useToasts';

export function useIdeasDomain(showToast: ShowToastFn) {
  const [ideas, setIdeas] = usePersistentState<Idea[]>('ideas', []);

  const addIdea = useCallback(
    (ideaData: Omit<Idea, 'id' | 'createdAt'>) => {
      const newIdea: Idea = {
        ...ideaData,
        id: `idea-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      setIdeas((prev) => [newIdea, ...prev]);
      showToast('Ideia Anotada', 'Ideia guardada no banco para não gerar dispersão imediata.');
    },
    [setIdeas, showToast]
  );

  const updateIdea = useCallback(
    (id: string, updates: Partial<Idea>) => {
      setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
    },
    [setIdeas]
  );

  const discardIdea = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      setIdeas((prev) =>
        prev.map((i) => (i.id === id ? { ...i, discardedAt: now } : i))
      );
      showToast('Ideia Descartada', 'Item arquivado para manter seu foco limpo.');
    },
    [setIdeas, showToast]
  );

  const deleteIdea = useCallback(
    (id: string) => {
      setIdeas((prev) => prev.filter((i) => i.id !== id));
      showToast('Ideia Excluída', 'Ideia removida do projeto.', 'info');
    },
    [setIdeas, showToast]
  );

  return {
    ideas,
    setIdeas,
    addIdea,
    updateIdea,
    discardIdea,
    deleteIdea
  };
}
