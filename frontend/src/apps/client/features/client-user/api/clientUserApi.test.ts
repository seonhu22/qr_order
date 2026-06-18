import { describe, expect, it } from 'vitest';
import { mapToClientUserModel } from './clientUserApi';

describe('mapToClientUserModel', () => {
  it('maps a server DTO to the list model with a known authority label', () => {
    expect(
      mapToClientUserModel({
        sysId: 'sys-1',
        userId: 'admin001',
        userNm: '홍길동',
        userRole: 'ADMIN',
      }),
    ).toEqual({
      id: 'sys-1',
      sysId: 'sys-1',
      userId: 'admin001',
      userName: '홍길동',
      authorityCode: 'ADMIN',
      authorityLabel: '관리자',
    });
  });

  it('maps the STAFF authority code to its label', () => {
    expect(
      mapToClientUserModel({
        sysId: 'sys-2',
        userId: 'staff001',
        userNm: '이철수',
        userRole: 'STAFF',
      }),
    ).toMatchObject({
      authorityCode: 'STAFF',
      authorityLabel: '스태프',
    });
  });

  it('falls back to the raw authority code when no label is registered', () => {
    expect(
      mapToClientUserModel({
        sysId: 'sys-3',
        userId: 'manager001',
        userNm: '김영희',
        userRole: 'MANAGER',
      }),
    ).toMatchObject({
      authorityCode: 'MANAGER',
      authorityLabel: 'MANAGER',
    });
  });

  it('falls back to userId for id when sysId is missing', () => {
    expect(
      mapToClientUserModel({
        userId: 'staff002',
        userNm: '박민수',
        userRole: 'STAFF',
      }),
    ).toMatchObject({
      id: 'staff002',
      sysId: undefined,
    });
  });

  it('falls back to empty strings when fields are missing entirely', () => {
    expect(mapToClientUserModel({})).toEqual({
      id: '',
      sysId: undefined,
      userId: '',
      userName: '',
      authorityCode: '',
      authorityLabel: '',
    });
  });
});
