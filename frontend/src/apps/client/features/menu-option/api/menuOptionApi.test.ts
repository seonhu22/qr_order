import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildMenuOptionDetailFormData,
  getMenuOptionMasterList,
  mapToMenuOptionDetailRow,
  mapToMenuOptionDetailPayload,
} from './menuOptionApi';

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

describe('buildMenuOptionDetailFormData', () => {
  it('flattens option detail changes for @ModelAttribute binding', () => {
    const formData = buildMenuOptionDetailFormData({
      newItems: [
        {
          linkSysId: 'group-1',
          menuOptionName: '토마토 추가',
          menuOptionPrice: '0',
          maximumNum: '0',
          menuDescription: '',
          useYn: 'Y',
          ordNo: 1,
        },
      ],
      updateItems: [
        {
          sysId: 'detail-1',
          linkSysId: 'group-1',
          menuOptionName: '치즈 추가',
          menuOptionPrice: '1000',
          maximumNum: '2',
          menuDescription: '고소한 치즈',
          useYn: 'N',
          fileUlid: 'file-1',
          ordNo: 2,
        },
      ],
      delItems: [{ sysId: 'detail-2', linkSysId: 'group-1' }],
    });

    expect(formData.get('newItems[0].linkSysId')).toBe('group-1');
    expect(formData.get('newItems[0].menuOptionName')).toBe('토마토 추가');
    expect(formData.get('newItems[0].menuOptionPrice')).toBe('0');
    expect(formData.get('newItems[0].maximumNum')).toBe('0');
    expect(formData.get('newItems[0].menuDescription')).toBe('');
    expect(formData.get('newItems[0].useYn')).toBe('Y');
    expect(formData.get('newItems[0].ordNo')).toBe('1');

    expect(formData.get('updateItems[0].sysId')).toBe('detail-1');
    expect(formData.get('updateItems[0].fileUlid')).toBe('file-1');
    expect(formData.get('updateItems[0].maximumNum')).toBe('2');
    expect(formData.get('delItems[0].sysId')).toBe('detail-2');
    expect(formData.has('menuOptionDetailRequest')).toBe(false);
    expect(formData.has('fileRequest')).toBe(false);
  });
});

describe('mapToMenuOptionDetailPayload', () => {
  it('uses 0 for blank maximumNum because the backend column is not nullable', () => {
    expect(
      mapToMenuOptionDetailPayload({
        id: 'new-row',
        groupId: 'group-1',
        ordNo: 1,
        values: {
          menuOptionName: '패티 추가',
          menuOptionPrice: '5555',
          maximumNum: '',
          menuDescription: '',
          useYn: 'Y',
          defaultYn: false,
        },
      }).maximumNum,
    ).toBe('0');
  });
});

describe('mapToMenuOptionDetailRow', () => {
  it('normalizes numeric API values to strings for editable table inputs', () => {
    const row = mapToMenuOptionDetailRow({
      sysId: 'detail-1',
      linkSysId: 'group-1',
      menuOptionName: '패티 추가',
      menuOptionPrice: 5555 as never,
      maximumNum: 0 as never,
      menuDescription: '',
      useYn: 'Y',
      fileUlid: 'file-1',
      ordNo: 1,
    });

    expect(row.values.menuOptionPrice).toBe('5555');
    expect(row.values.maximumNum).toBe('0');
  });
});
