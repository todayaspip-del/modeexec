import type { UserProfile, Mission } from '../types';
import { MISSIONS_30_DAYS } from './seedData';

/**
 * Estado inicial de um usuário NOVO (sem dados de demonstração).
 * Os dados do "Rafael" continuam em seedData.ts e só entram se o usuário
 * escolher explicitamente "Explorar com dados de exemplo".
 */
export const CLEAN_USER_PROFILE: UserProfile = {
  name: 'Você',
  business: '',
  teamSize: '1 pessoa',
  currentMode: 'Normal',
  dailyMinutes: 20,
  isDemo: false,
  onboardingCompleted: false,
  createdAt: new Date().toISOString()
};

/** As 30 missões do programa, todas pendentes. */
export const CLEAN_MISSIONS: Mission[] = MISSIONS_30_DAYS.map((m) => ({
  ...m,
  completed: false,
  userEvidence: undefined,
  userReflection: undefined,
  completionDate: undefined,
  blockedReason: undefined
}));
