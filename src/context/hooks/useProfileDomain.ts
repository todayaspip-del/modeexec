import { useCallback } from 'react';
import { UserProfile, ExecutionMode } from '../../types';
import { CLEAN_USER_PROFILE } from '../../data/cleanState';
import { usePersistentState } from '../../hooks/usePersistentState';
import { ShowToastFn } from './useToasts';

export function useProfileDomain(showToast: ShowToastFn) {
  const [userProfile, setUserProfile] = usePersistentState<UserProfile>(
    'profile',
    CLEAN_USER_PROFILE
  );

  const updateUserProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      setUserProfile((prev) => ({ ...prev, ...updates }));
      showToast('Perfil Atualizado', 'As preferências foram salvas com sucesso.');
    },
    [setUserProfile, showToast]
  );

  const setExecutionMode = useCallback(
    (mode: ExecutionMode) => {
      setUserProfile((prev) => ({ ...prev, currentMode: mode }));
      showToast(
        `Modo alterado para: ${mode}`,
        mode === 'Recuperação'
          ? 'A pressão de prazos foi reduzida. Foco no passo viável.'
          : mode === 'Reduzido'
          ? 'Missões encurtadas para dias de baixa disponibilidade.'
          : 'Modo padrão de 30 dias ativo.'
      );
    },
    [setUserProfile, showToast]
  );

  return {
    userProfile,
    setUserProfile,
    updateUserProfile,
    setExecutionMode
  };
}
