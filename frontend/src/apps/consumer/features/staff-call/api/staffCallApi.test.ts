import { afterEach, describe, expect, it, vi } from 'vitest';
import { callStaff, fetchStaffCallSettings } from './staffCallApi';

describe('staffCallApi', () => {
  afterEach(() => vi.restoreAllMocks());

  it('설정 조회 결과의 callCd를 그대로 반환한다', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify([
      { sysId: '1', callCd: 'WATER', callNm: '물', singleYn: 'N' },
    ]), { status: 200 }));
    await expect(fetchStaffCallSettings()).resolves.toEqual([
      { sysId: '1', callCd: 'WATER', callNm: '물', singleYn: 'N' },
    ]);
  });

  it('선택 항목들을 한 번의 POST 배열로 전송한다', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    await callStaff([{ callCd: 'WATER', quantity: 2 }]);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      items: [{ callCd: 'WATER', quantity: 2 }],
    });
  });
});
