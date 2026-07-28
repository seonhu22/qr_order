import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMenuOptionMasterList } from './menuOptionApi';

const MENU_ROWS = [
  {
    sysId: 'menu-3',
    linkSysId: 'category-2',
    menuName: '아메리카노',
    menuPrice: 4000,
    optionUseYn: 'Y',
    useYn: 'Y',
    ordNo: 1,
  },
];

describe('getMenuOptionMasterList', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests all store menus once when the keyword is blank', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(MENU_ROWS), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getMenuOptionMasterList('   ')).resolves.toEqual(MENU_ROWS);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/client/menu_manage/menu/detail/search');
  });

  it('trims and sends the menu name as a searchKeyword query parameter', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(MENU_ROWS), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await getMenuOptionMasterList('  아메리카노  ');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      '/api/client/menu_manage/menu/detail/search?searchKeyword=%EC%95%84%EB%A9%94%EB%A6%AC%EC%B9%B4%EB%85%B8',
    );
  });
});
