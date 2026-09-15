import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useClientLoginStepController } from './useClientLoginStepController';

describe('useClientLoginStepController', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('starts from login when no password reset state exists', () => {
    const { result } = renderHook(() => useClientLoginStepController());

    expect(result.current.step).toBe('login');
    expect(result.current.isWide).toBe(false);
  });

  it('restores the password reset step from sessionStorage', () => {
    sessionStorage.setItem(
      'client_password_reset_state',
      JSON.stringify({ step: 'find-password-verify', userId: 'PC001', email: 'user@example.com' }),
    );

    const { result } = renderHook(() => useClientLoginStepController());

    expect(result.current.step).toBe('find-password-verify');
    expect(result.current.initialPasswordResetState).toEqual({
      step: 'find-password-verify',
      userId: 'PC001',
      email: 'user@example.com',
    });
    expect(result.current.isWide).toBe(true);
  });

  it('moves between steps', () => {
    const { result } = renderHook(() => useClientLoginStepController());

    act(() => {
      result.current.goToStep('signup-consent');
    });
    expect(result.current.step).toBe('signup-consent');

    act(() => {
      result.current.goToLogin();
    });
    expect(result.current.step).toBe('login');
  });
});
