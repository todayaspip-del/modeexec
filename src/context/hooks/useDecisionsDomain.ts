import { useCallback } from 'react';
import { Decision, Task } from '../../types';
import { usePersistentState } from '../../hooks/usePersistentState';
import { ShowToastFn } from './useToasts';

export function useDecisionsDomain(
  showToast: ShowToastFn,
  setTasks?: React.Dispatch<React.SetStateAction<Task[]>>
) {
  const [decisions, setDecisions] = usePersistentState<Decision[]>(
    'decisions',
    []
  );

  const addDecision = useCallback(
    (decisionData: Omit<Decision, 'id'>): string => {
      const newDecision: Decision = {
        ...decisionData,
        id: `dec-${Date.now()}`
      };
      setDecisions((prev) => [newDecision, ...prev]);
      showToast('Decisão Mapeada', 'O custo de adiar foi documentado com clareza.');
      return newDecision.id;
    },
    [setDecisions, showToast]
  );

  const resolveDecision = useCallback(
    (id: string, chosenOption: string, rationale: string) => {
      setDecisions((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                status: 'decidida',
                chosenOption,
                rationale,
                decidedAt: new Date().toISOString()
              }
            : d
        )
      );

      // Auto-unblock: for every task whose decisionId equals the resolved decision
      // and whose status is 'bloqueada', set status 'pronta', clear blockedReason and blockedReasonKey
      if (setTasks) {
        setTasks((prev) => {
          const unblockedTasks: Task[] = [];
          const nextTasks = prev.map((t) => {
            if (t.decisionId === id && t.status === 'bloqueada') {
              unblockedTasks.push(t);
              return {
                ...t,
                status: 'pronta' as const,
                blockedReason: undefined,
                blockedReasonKey: undefined
              };
            }
            return t;
          });

          unblockedTasks.forEach((t) => {
            showToast(
              'Decisão tomada',
              `O cartão "${t.title}" foi destravado e voltou para "A fazer".`,
              'success'
            );
          });

          return nextTasks;
        });
      }

      showToast(
        'Decisão Tomada!',
        'Menos um ciclo aberto na sua mente. O próximo passo foi destravado.',
        'success'
      );
    },
    [setDecisions, setTasks, showToast]
  );

  return {
    decisions,
    setDecisions,
    addDecision,
    resolveDecision
  };
}
