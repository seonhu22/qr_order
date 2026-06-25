import type { Step } from '@/apps/client/features/login/types';

export type PasswordResetStep = Extract<
  Step,
  'find-password' | 'find-password-verify' | 'find-password-reset'
>;

export type PasswordResetState = {
  step: PasswordResetStep;
  userId: string;
  email: string;
};
