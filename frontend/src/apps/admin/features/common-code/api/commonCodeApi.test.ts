import { describe, expect, it } from 'vitest';
import {
  buildCommonDetailRequest,
  hasCommonDetailChanges,
  mapToCommonMasterPayload,
} from './commonCodeApi';
import type { DetailCode, MasterCode } from '../types';

describe('commonCodeApi', () => {
  it('maps master useYn as-is for save payloads', () => {
    const master: MasterCode = {
      id: 'master-1',
      sysId: 'master-1',
      code: 'cmCode3',
      name: '공통마스터3',
      useYn: 'N',
    };

    expect(mapToCommonMasterPayload(master)).toEqual({
      sysId: 'master-1',
      commonCd: 'cmCode3',
      commonNm: '공통마스터3',
      useYn: 'N',
    });
  });

  it('builds detail requests with empty arrays instead of undefined', () => {
    const request = buildCommonDetailRequest('master-1', [], []);

    expect(request).toEqual({
      linkSysId: 'master-1',
      newItems: [],
      updateItems: [],
      deleteItems: [],
    });
    expect(hasCommonDetailChanges(request)).toBe(false);
  });

  it('keeps linkSysId in detail request for tempLinkSysId param forwarding', () => {
    const request = buildCommonDetailRequest('master-1', [], []);

    expect(request.linkSysId).toBe('master-1');
  });

  it('splits detail rows into new, update, and delete payloads', () => {
    const originalRows: DetailCode[] = [
      {
        id: 'detail-1',
        sysId: 'detail-1',
        linkSysId: 'master-1',
        code: 'READY',
        name: '준비',
        useYn: true,
        ordNo: 1,
      },
      {
        id: 'detail-2',
        sysId: 'detail-2',
        linkSysId: 'master-1',
        code: 'DONE',
        name: '완료',
        useYn: true,
        ordNo: 2,
      },
    ];

    const currentRows: DetailCode[] = [
      {
        id: 'detail-1',
        sysId: 'detail-1',
        linkSysId: 'master-1',
        code: 'READY',
        name: '준비중',
        useYn: false,
        ordNo: 2,
      },
      {
        id: 'new-master-1',
        linkSysId: 'master-1',
        code: 'HOLD',
        name: '보류',
        useYn: true,
        ordNo: 1,
        isNew: true,
      },
    ];

    const request = buildCommonDetailRequest('master-1', currentRows, originalRows);

    expect(request).toEqual({
      linkSysId: 'master-1',
      newItems: [
        {
          sysId: undefined,
          linkSysId: 'master-1',
          commonCd: 'HOLD',
          commonNm: '보류',
          ordNo: 1,
          useYn: 'Y',
        },
      ],
      updateItems: [
        {
          sysId: 'detail-1',
          linkSysId: 'master-1',
          commonCd: 'READY',
          commonNm: '준비중',
          ordNo: 2,
          useYn: 'N',
        },
      ],
      deleteItems: [
        {
          sysId: 'detail-2',
          linkSysId: 'master-1',
          commonCd: 'DONE',
          commonNm: '완료',
          ordNo: 2,
          useYn: 'Y',
        },
      ],
    });
    expect(hasCommonDetailChanges(request)).toBe(true);
  });
});
