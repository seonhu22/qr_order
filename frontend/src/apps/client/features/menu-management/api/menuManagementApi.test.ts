import { describe, expect, it } from 'vitest';
import {
  buildMenuDetailFormData,
  buildMenuDetailRequest,
  mapToMenuCategoryPayload,
} from './menuManagementApi';
import type { MenuCategoryRow, MenuDetailRow } from '../types';

function readBlobText(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

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

  it('builds the menu detail request as a JSON multipart part', async () => {
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
    const menuRequestPart = formData.get('menuDetailRequest');

    expect(menuRequestPart).toBeInstanceOf(Blob);
    expect(JSON.parse(await readBlobText(menuRequestPart as Blob))).toEqual(request);
    expect(formData.has('newItems[0].menuName')).toBe(false);
  });

  it('separates the menu request JSON part from attachment fields', async () => {
    const request = {
      newItems: [],
      updateItems: [],
      delItems: [],
    };
    const file = new File(['image'], 'menu.png', { type: 'image/png' });

    const formData = buildMenuDetailFormData(request, {
      fileUlid: 'FILE-ULID-1',
      fileChangeState: {
        newFiles: [file],
        deletedFiles: [],
      },
    });
    const menuRequestPart = formData.get('menuDetailRequest');

    expect(menuRequestPart).toBeInstanceOf(Blob);
    const menuRequestJson = await readBlobText(menuRequestPart as Blob);
    expect(JSON.parse(menuRequestJson)).toEqual(request);
    expect(formData.has('newItems[0].menuName')).toBe(false);
    expect(formData.get('newItems[0].file')).toBe(file);
    expect(formData.get('newItems[0].linkSysId')).toBe('FILE-ULID-1');
  });
});
