import { describe, expect, it } from 'vitest';
import { mapToClientUserModel } from './clientUserApi';

describe('mapToClientUserModel', () => {
  it('maps the 01 authority code to admin label', () => {
    expect(
      mapToClientUserModel({
        sysId: 'sys-1',
        userId: 'admin001',
        userNm: '홍길동',
        userRole: '01',
      }),
    ).toEqual({
      id: 'sys-1',
      sysId: 'sys-1',
      userId: 'admin001',
      userName: '홍길동',
      authorityCode: '01',
      authorityLabel: '관리자',
    });
  });

  it('maps the 02 authority code to staff label', () => {
    expect(
      mapToClientUserModel({
        sysId: 'sys-2',
        userId: 'staff001',
        userNm: '이철수',
        userRole: '02',
      }),
    ).toMatchObject({
      authorityCode: '02',
      authorityLabel: '스태프',
    });
  });

  it('maps every non-01 authority code to the staff label', () => {
    expect(
      mapToClientUserModel({
        sysId: 'sys-4',
        userId: 'manager001',
        userNm: '김영희',
        userRole: '99',
      }),
    ).toMatchObject({
      authorityCode: '99',
      authorityLabel: '스태프',
    });
  });

  it('falls back to userId for id when sysId is missing', () => {
    expect(
      mapToClientUserModel({
        userId: 'staff002',
        userNm: '박민수',
        userRole: '02',
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
      authorityLabel: '스태프',
    });
  });
});
