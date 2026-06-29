import { describe, expect, it } from 'vitest';
import {
  buildMenuDetailFormData,
  buildMenuDetailRequest,
  mapToMenuCategoryPayload,
} from './menuManagementApi';
import type { MenuCategoryRow, MenuDetailRow } from '../types';

describe('menuManagementApi', () => {
  it('maps menu category ordNo into save payload', () => {
    const row: MenuCategoryRow = {
      id: 'category-1',
      sysId: 'category-1',
      name: '햄버거',
      useYn: 'Y',
      ordNo: 4,
    };

    expect(mapToMenuCategoryPayload(row)).toEqual({
      sysId: 'category-1',
      categoryName: '햄버거',
      useYn: 'Y',
      ordNo: 4,
    });
  });

  it('builds indexed form data for menu detail model attribute binding', () => {
    const currentRows: MenuDetailRow[] = [
      {
        id: 'menu-detail-1',
        masterId: 'category-1',
        ordNo: 1,
        isNew: true,
        values: {
          menuName: '치즈버거',
          menuPrice: '7000',
          menuDescription: '기본 치즈버거',
          optionUseYn: 'N',
          useYn: 'Y',
        },
      },
    ];

    const request = buildMenuDetailRequest(currentRows, []);
    const formData = buildMenuDetailFormData(request);

    expect(formData.get('newItems[0].linkSysId')).toBe('category-1');
    expect(formData.get('newItems[0].menuName')).toBe('치즈버거');
    expect(formData.get('newItems[0].menuPrice')).toBe('7000');
    expect(formData.get('newItems[0].menuDescription')).toBe('기본 치즈버거');
    expect(formData.get('newItems[0].optionUseYn')).toBe('N');
    expect(formData.get('newItems[0].useYn')).toBe('Y');
    expect(formData.has('newItems[0].fileUlid')).toBe(false);
    expect(formData.get('newItems[0].ordNo')).toBe('1');
  });
});
