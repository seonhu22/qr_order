import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { shouldBypassBusinessVerificationError } from './signupBusinessVerificationBypass';

describe('shouldBypassBusinessVerificationError', () => {
  beforeEach(() => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_BYPASS_BUSINESS_VERIFICATION', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns true when DEV + flag on + status 400 (axios-style)', () => {
    expect(shouldBypassBusinessVerificationError({ response: { status: 400 } })).toBe(true);
  });

  it('returns true when DEV + flag on + status 400 (flat error)', () => {
    expect(shouldBypassBusinessVerificationError({ status: 400 })).toBe(true);
  });

  it('returns false when DEV gate off', () => {
    vi.stubEnv('DEV', false);
    expect(shouldBypassBusinessVerificationError({ response: { status: 400 } })).toBe(false);
  });

  it('returns false when flag off', () => {
    vi.stubEnv('VITE_BYPASS_BUSINESS_VERIFICATION', 'false');
    expect(shouldBypassBusinessVerificationError({ response: { status: 400 } })).toBe(false);
  });

  it('returns false for status 401 (auth failure, not data invalid)', () => {
    expect(shouldBypassBusinessVerificationError({ response: { status: 401 } })).toBe(false);
  });

  it('returns false for status 500 (server crash, not data invalid)', () => {
    expect(shouldBypassBusinessVerificationError({ response: { status: 500 } })).toBe(false);
  });

  it('returns false when error is not an object (network error string)', () => {
    expect(shouldBypassBusinessVerificationError('Network Error')).toBe(false);
    expect(shouldBypassBusinessVerificationError(null)).toBe(false);
    expect(shouldBypassBusinessVerificationError(undefined)).toBe(false);
  });
});
