import { describe, expect, it } from 'vitest';
import { isLoginPath, resolveLoginPath } from './authRedirect';

describe('authRedirect', () => {
  it('resolves client paths to client login', () => {
    expect(resolveLoginPath('/client/main')).toBe('/client/login');
  });

  it('resolves admin paths to admin login', () => {
    expect(resolveLoginPath('/admin/main')).toBe('/admin/login');
  });

  it('recognizes admin and client login paths', () => {
    expect(isLoginPath('/admin/login')).toBe(true);
    expect(isLoginPath('/client/login')).toBe(true);
  });
});
