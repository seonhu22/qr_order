import { describe, expect, it } from 'vitest';
import { buildQrCodeRequest, mapToQrCodeModel } from './qrCodeApi';
import type { QrCodeRow } from '../types';

describe('qrCodeApi', () => {
  it('maps backend QR code fields into screen row fields', () => {
    expect(
      mapToQrCodeModel({
        sysId: 'qr-1',
        linkSysId: 'table-1',
        tableNum: 1,
        description: '메인 1번',
        url: 'qr-url-1',
        useYn: 'Y',
      }),
    ).toEqual({
      id: 'qr-1',
      sysId: 'qr-1',
      linkSysId: 'table-1',
      tableNum: '1',
      remark: '메인 1번',
      url: 'qr-url-1',
      useYn: 'Y',
      isNew: false,
    });
  });

  it('uses sysId as QR url token when backend search response omits url', () => {
    expect(
      mapToQrCodeModel({
        sysId: 'qr-token-1',
        linkSysId: 'table-1',
        tableNum: 1,
        description: '메인 1번',
        useYn: 'Y',
      }).url,
    ).toBe('qr-token-1');
  });

  it('builds save payload with linkSysId and description for backend contract', () => {
    const currentRows: QrCodeRow[] = [
      {
        id: 'new-row',
        linkSysId: 'table-1',
        tableNum: '1',
        remark: '메인 1번',
        useYn: 'Y',
        isNew: true,
      },
    ];

    expect(buildQrCodeRequest(currentRows, [])).toEqual({
      newItems: [
        {
          sysId: undefined,
          linkSysId: 'table-1',
          tableNum: 1,
          description: '메인 1번',
          url: undefined,
          useYn: 'Y',
        },
      ],
      updateItems: [],
      delItems: [],
    });
  });
});
