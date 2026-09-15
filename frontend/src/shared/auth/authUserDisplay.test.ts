import { describe, expect, it } from 'vitest';
import { getAuthUserDisplayName, getAuthUserRoleLabel } from './authUserDisplay';

describe('authUserDisplay', () => {
  it('uses userName as the display name', () => {
    expect(getAuthUserDisplayName({ userId: 'PC002', userName: '테스트 사용자' })).toBe(
      '테스트 사용자',
    );
  });

  it('falls back to userId when userName is missing', () => {
    expect(getAuthUserDisplayName({ userId: 'PC002' })).toBe('PC002');
  });

  it('uses role-like fields before sysPlantCd for the role label', () => {
    expect(getAuthUserRoleLabel({ role: 'SUPER_ADMIN', sysPlantCd: 'ADMIN' })).toBe(
      'SUPER_ADMIN',
    );
    expect(getAuthUserRoleLabel({ userRole: 'CLIENT_ADMIN', sysPlantCd: 'CLIENT' })).toBe(
      'CLIENT_ADMIN',
    );
  });

  it('falls back to sysPlantCd when role fields are missing', () => {
    expect(getAuthUserRoleLabel({ sysPlantCd: 'ADMIN' })).toBe('ADMIN');
  });
});
