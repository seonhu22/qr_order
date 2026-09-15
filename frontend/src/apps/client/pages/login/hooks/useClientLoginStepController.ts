import { useState } from 'react';
import {
  readPasswordResetState,
} from '@/apps/client/features/password-reset/utils/passwordResetStorage';
import type { PasswordResetState } from '@/apps/client/features/password-reset/types';
import type { Step } from '@/apps/client/features/login/types';
import { getAriaLabel } from '@/apps/client/features/login/utils/getAriaLabel';

export function useClientLoginStepController() {
  const [initialPasswordResetState] = useState<PasswordResetState | null>(() =>
    readPasswordResetState(),
  );
  const [step, setStep] = useState<Step>(initialPasswordResetState?.step ?? 'login');

  const goToStep = (nextStep: Step) => setStep(nextStep);
  const goToLogin = () => setStep('login');

  return {
    step,
    isWide: step !== 'login' && step !== 'change-password',
    ariaLabel: getAriaLabel(step),
    initialPasswordResetState,
    goToStep,
    goToLogin,
  };
}
