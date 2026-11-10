import { describe, expect, it } from 'vitest';
import type { Plant } from '@/generated/types/plant';
import { mapToPlantSearchModel } from './plantSearchApi';

const plant: Plant = {
  plantCd: 'PC003',
  plantNm: '테스트 사업장',
  emailUrl: 'plant@example.com',
  empNm: '대표자',
};

describe('사업장 조회 응답 매핑', () => {
  it('API 대표자명을 표시하고 계약에 없는 담당자와 URL은 생성하지 않는다', () => {
    expect(mapToPlantSearchModel(plant)).toMatchObject({
      ownerName: '대표자',
      email: 'plant@example.com',
      managerName: '-',
      clientUrl: '-',
    });
  });

  it('대표자명이 없는 기존 응답에는 빈 값 표시를 사용한다', () => {
    expect(mapToPlantSearchModel({ ...plant, empNm: undefined }).ownerName).toBe('-');
  });
});
