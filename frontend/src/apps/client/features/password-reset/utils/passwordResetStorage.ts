import type { Step } from '@/apps/client/features/login/types';
import type { PasswordResetState, PasswordResetStep } from '../types';

const PASSWORD_RESET_STATE_KEY = 'client_password_reset_state';

// 왜 set으로 했을까? 숫자가 적어서 배열 방식되 될텐데 -> O(1)의 빠른 조회를 위함, 나중에 코드 확장되면 Set이 더 효율적으로 판단
const PASSWORD_RESET_STEPS = new Set<Step>([
  'find-password',
  'find-password-verify',
  'find-password-reset',
]);

export function isPasswordResetStep(step: string): step is PasswordResetStep {
  return PASSWORD_RESET_STEPS.has(step as Step);
}

export function readPasswordResetState(): PasswordResetState | null {
  try {
    const raw = sessionStorage.getItem(PASSWORD_RESET_STATE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PasswordResetState>;
    if (!parsed.step || !isPasswordResetStep(parsed.step)) return null;

    return {
      step: parsed.step,
      userId: typeof parsed.userId === 'string' ? parsed.userId : '',
      email: typeof parsed.email === 'string' ? parsed.email : '',
    };
  } catch {
    return null;
  }
}

export function writePasswordResetState(state: PasswordResetState) {
  sessionStorage.setItem(PASSWORD_RESET_STATE_KEY, JSON.stringify(state));
}

export function clearPasswordResetState() {
  sessionStorage.removeItem(PASSWORD_RESET_STATE_KEY);
}
