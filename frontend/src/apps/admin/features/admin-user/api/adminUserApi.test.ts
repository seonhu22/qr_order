import { describe, expect, it } from 'vitest';
import { getPlantSelectOptionsWithFallback } from './adminUserApi';

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
