import { describe, expect, it } from 'vitest';
import { buildStaffCallSettingRequest, mapStaffCallSetting } from './staffCallManagementApi';
import type { StaffCallItemRow } from '../types';

const original: StaffCallItemRow = {
  id: 'setting-1', callCd: 'WATER', callNm: '물', singleYn: 'N', description: '',
  useYn: 'Y', ordNo: 1, isNew: false,
};

describe('staffCallManagementApi', () => {
  it('서버 설정을 최초 조회 순서 그대로 화면 행으로 변환한다', () => {
    expect(mapStaffCallSetting({
      sysId: 'setting-1', callCd: 'WATER', callNm: '물', singleYn: 'N', description: null,
    }, 0)).toEqual(original);
  });

  it('신규/수정/삭제 항목만 저장 요청에 포함하고 화면 전용 값은 제외한다', () => {
    const updated = { ...original, callNm: '생수' };
    const added: StaffCallItemRow = {
      id: 'new-1', callCd: 'CUP', callNm: '컵', singleYn: 'Y', description: '',
      useYn: 'N', ordNo: 99, isNew: true,
    };
    const request = buildStaffCallSettingRequest([updated, added], [original, {
      ...original, id: 'setting-2', callCd: 'NAPKIN', callNm: '냅킨', ordNo: 2,
    }]);

    expect(request.newItems).toEqual([{
      sysId: '', callCd: 'CUP', callNm: '컵', singleYn: 'Y', description: null,
    }]);
    expect(request.updateItems).toEqual([{
      sysId: 'setting-1', callCd: 'WATER', callNm: '생수', singleYn: 'N', description: null,
    }]);
    expect(request.delItems).toHaveLength(1);
    expect(request).not.toHaveProperty('useYn');
    expect(JSON.stringify(request)).not.toContain('ordNo');
  });
});
