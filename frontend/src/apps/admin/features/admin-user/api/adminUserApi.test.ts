import { describe, expect, it } from 'vitest';
import { buildAdminUserRequest, getPlantSelectOptionsWithFallback } from './adminUserApi';

describe('getPlantSelectOptionsWithFallback', () => {
  it('returns fallback options when combo data is empty', () => {
    expect(getPlantSelectOptionsWithFallback([])).toEqual([
      { value: 'ADMIN', label: '관리자' },
      { value: 'PLANT-001', label: '강남점' },
      { value: 'PLANT-002', label: '판교점' },
      { value: 'PLANT-003', label: '성수점' },
    ]);
  });

  it('returns mapped combo options when API data exists', () => {
    expect(
      getPlantSelectOptionsWithFallback([
        { code: 'A001', name: '본점' },
        { code: 'A002', name: '서브점' },
      ]),
    ).toEqual([
      { value: 'A001', label: '본점' },
      { value: 'A002', label: '서브점' },
    ]);
  });
});

describe('buildAdminUserRequest', () => {
  it('returns empty arrays instead of undefined when there are no changes', () => {
    expect(buildAdminUserRequest([], [])).toEqual({
      newItems: [],
      updateItems: [],
      delItems: [],
    });
  });

  it('splits rows into new, update and delete payloads', () => {
    const originalRows = [
      {
        id: 'row-1',
        sysId: 'row-1',
        userId: 'admin01',
        userName: '관리자1',
        plantCd: 'ADMIN',
        plantName: '관리자',
        isNew: false,
      },
      {
        id: 'row-2',
        sysId: 'row-2',
        userId: 'admin02',
        userName: '관리자2',
        plantCd: 'PLANT-001',
        plantName: '강남점',
        isNew: false,
      },
    ];

    const currentRows = [
      {
        id: 'row-1',
        sysId: 'row-1',
        userId: 'admin01',
        userName: '관리자수정',
        plantCd: 'ADMIN',
        plantName: '관리자',
        isNew: false,
      },
      {
        id: 'temp-1',
        userId: 'admin03',
        userName: '관리자3',
        plantCd: 'PLANT-002',
        plantName: '판교점',
        isNew: true,
      },
    ];

    expect(buildAdminUserRequest(currentRows, originalRows)).toEqual({
      newItems: [
        {
          sysId: undefined,
          userId: 'admin03',
          userNm: '관리자3',
          plantCd: 'PLANT-002',
        },
      ],
      updateItems: [
        {
          sysId: 'row-1',
          userId: 'admin01',
          userNm: '관리자수정',
          plantCd: 'ADMIN',
        },
      ],
      delItems: [
        {
          sysId: 'row-2',
          userId: 'admin02',
          userNm: '관리자2',
          plantCd: 'PLANT-001',
        },
      ],
    });
  });
});
