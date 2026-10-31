import { useMemo, useCallback } from 'react';
import { Mission, BlockerReason } from '../../types';
import { CLEAN_MISSIONS } from '../../data/cleanState';
import { usePersistentState } from '../../hooks/usePersistentState';
import { ShowToastFn } from './useToasts';

export function useMissionsDomain(showToast: ShowToastFn) {
  const [missions, setMissions] = usePersistentState<Mission[]>(
    'missions',
    CLEAN_MISSIONS
  );

  const activeTodayMission = useMemo(() => {
    return missions.find((m) => !m.completed) || missions[0];
  }, [missions]);

  const completeMission = useCallback(
    (id: number, evidence: string, reflection?: string) => {
      setMissions((prev) =>
        prev.map((m) => {
          if (m.id === id) {
            return {
              ...m,
              completed: true,
              userEvidence: evidence,
              userReflection: reflection || m.userReflection,
              completionDate: new Date().toISOString(),
              blockedReason: undefined
            };
          }
          return m;
        })
      );
      showToast(
        'Missão Concluída!',
        'Evidência registrada com sucesso. Uma intenção foi transformada em entrega física.',
        'success'
      );
    },
    [setMissions, showToast]
  );

  const blockMission = useCallback(
    (id: number, reason: BlockerReason, notes?: string) => {
      setMissions((prev) =>
        prev.map((m) => {
          if (m.id === id) {
            return {
              ...m,
              blockedReason: reason,
              blockedNotes: notes
            };
          }
          return m;
        })
      );
      showToast(
        'Bloqueio acolhido',
        'Identificamos a origem do obstáculo. Você recebeu uma alternativa reduzida sem cobrança.',
        'info'
      );
    },
    [setMissions, showToast]
  );

  return {
    missions,
    setMissions,
    activeTodayMission,
    completeMission,
    blockMission
  };
}
