/**
 * @fileoverview usePlantSearchPage 훅 테스트
 *
 * @description
 * - 검색어 draft/applied 분리와 서버 데이터 -> 화면 모델 변환 결과를 검증한다.
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlantSearchPage } from './usePlantSearchPage';
import { usePlantSearchQuery } from '../api/plantSearchApi';

vi.mock('../api/plantSearchApi', () => ({
  usePlantSearchQuery: vi.fn(),
  mapToPlantSearchModel: vi.fn((plant) => ({
    id: plant.sysId ?? plant.plantCd,
    plantCode: plant.plantCd,
    plantName: plant.plantNm,
    storeName: plant.storeNm ?? '-',
    email: plant.emailUrl,
    postalCode: plant.zipCode ?? '-',
    address: plant.address ?? '-',
    phoneNumber: plant.phoneNumber ?? '-',
    useYn: plant.useYn === 'N' ? 'N' : 'Y',
  })),
}));

const mockedUsePlantSearchQuery = vi.mocked(usePlantSearchQuery);

describe('usePlantSearchPage', () => {
  beforeEach(() => {
    mockedUsePlantSearchQuery.mockReset();
  });

  it('keeps draftKeyword separate from appliedKeyword until search runs', () => {
    mockedUsePlantSearchQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
    } as never);

    const { result } = renderHook(() => usePlantSearchPage());

    act(() => {
      result.current.actions.handleKeywordChange('판교');
    });

    expect(result.current.uiProps.draftKeyword).toBe('판교');
    expect(result.current.uiProps.appliedKeyword).toBe('');

    act(() => {
      result.current.actions.handleSearch();
    });

    expect(result.current.uiProps.appliedKeyword).toBe('판교');
  });

  it('maps query data into plant search rows', () => {
    mockedUsePlantSearchQuery.mockReturnValue({
      data: [
        {
          sysId: 'plant-1',
          plantCd: 'PLANT-001',
          plantNm: '강남점',
          emailUrl: 'gangnam@example.com',
          storeNm: '강남 매장',
          zipCode: '06123',
          address: '서울 강남구',
          phoneNumber: '02-1234-5678',
          useYn: 'Y',
        },
      ],
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
    } as never);

    const { result } = renderHook(() => usePlantSearchPage());

    expect(result.current.data.rows).toEqual([
      {
        id: 'plant-1',
        plantCode: 'PLANT-001',
        plantName: '강남점',
        storeName: '강남 매장',
        email: 'gangnam@example.com',
        postalCode: '06123',
        address: '서울 강남구',
        phoneNumber: '02-1234-5678',
        useYn: 'Y',
      },
    ]);
  });

  it('resets both draftKeyword and appliedKeyword when reset runs', () => {
    mockedUsePlantSearchQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
    } as never);

    const { result } = renderHook(() => usePlantSearchPage());

    act(() => {
      result.current.actions.handleKeywordChange('판교');
      result.current.actions.handleSearch();
    });

    act(() => {
      result.current.actions.handleReset();
    });

    // reset은 입력 중 값과 적용된 검색 조건을 함께 지워야 한다.
    expect(result.current.uiProps.draftKeyword).toBe('');
    expect(result.current.uiProps.appliedKeyword).toBe('');
  });

  it('passes query status values through without mutation', () => {
    const queryError = new Error('network-error');

    mockedUsePlantSearchQuery.mockReturnValue({
      data: [],
      isLoading: true,
      isFetching: true,
      isError: true,
      error: queryError,
    } as never);

    const { result } = renderHook(() => usePlantSearchPage());

    // 화면은 훅의 status 계약을 그대로 신뢰하므로 pass-through를 고정해 둔다.
    expect(result.current.status.isLoading).toBe(true);
    expect(result.current.status.isFetching).toBe(true);
    expect(result.current.status.isError).toBe(true);
    expect(result.current.status.error).toBe(queryError);
  });
});
