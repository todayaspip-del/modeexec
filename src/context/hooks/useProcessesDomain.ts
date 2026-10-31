import { useCallback } from 'react';
import { ProcessDoc } from '../../types';
import { usePersistentState } from '../../hooks/usePersistentState';
import { ShowToastFn } from './useToasts';

export function useProcessesDomain(showToast: ShowToastFn) {
  const [processes, setProcesses] = usePersistentState<ProcessDoc[]>(
    'processes',
    []
  );

  const addProcess = useCallback(
    (
      processData: Omit<ProcessDoc, 'id' | 'createdAt'>,
      options?: {
        action?: { label: string; onClick: () => void };
        toastTitle?: string;
        toastMessage?: string;
      }
    ): ProcessDoc => {
      const newProc: ProcessDoc = {
        ...processData,
        id: `proc-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setProcesses((prev) => [newProc, ...prev]);

      if (options?.action) {
        showToast(
          options.toastTitle || 'Processo Criado',
          options.toastMessage || 'Padrão mínimo estabelecido para a equipe.',
          'success',
          { action: options.action }
        );
      } else {
        showToast(
          options?.toastTitle || 'Processo Documentado',
          options?.toastMessage || 'Padrão mínimo estabelecido para a equipe.'
        );
      }
      return newProc;
    },
    [setProcesses, showToast]
  );

  return {
    processes,
    setProcesses,
    addProcess
  };
}
