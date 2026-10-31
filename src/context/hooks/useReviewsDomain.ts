import { useCallback } from 'react';
import { WeeklyReview } from '../../types';
import { usePersistentState } from '../../hooks/usePersistentState';
import { ShowToastFn } from './useToasts';

export function useReviewsDomain(showToast: ShowToastFn) {
  const [weeklyReviews, setWeeklyReviews] = usePersistentState<WeeklyReview[]>(
    'reviews',
    []
  );

  const saveWeeklyReview = useCallback(
    (reviewData: Omit<WeeklyReview, 'id'>) => {
      const newRev: WeeklyReview = {
        ...reviewData,
        id: `rev-${Date.now()}`
      };
      setWeeklyReviews((prev) => [newRev, ...prev]);
      showToast('Revisão Semanal Concluída', 'Terreno limpo para a próxima semana!', 'success');
    },
    [setWeeklyReviews, showToast]
  );

  return {
    weeklyReviews,
    setWeeklyReviews,
    saveWeeklyReview
  };
}
