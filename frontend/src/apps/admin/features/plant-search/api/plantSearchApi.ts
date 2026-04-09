/**
 * @fileoverview 사업장 조회 feature의 서버 연동 계층
 *
 * @description
 * - generated API를 페이지에서 직접 호출하지 않고, feature 전용 wrapper로 감싼다.
 * - 서버 DTO를 화면 모델로 변환하는 책임도 이 계층이 가진다.
 */

import { useSearchPlant } from '@/generated/settings-controller/settings-controller';
import type { Plant } from '@/generated/types/plant';
import { queryKeys } from '@/shared/api/queryKeys';
import type { PlantSearchRow } from '../types';

/**
 * 서버의 사업장 DTO를 화면 목록용 모델로 변환한다.
 *
 * @description
 * - generated Plant 타입은 API 계약 그대로라서, 화면에서 바로 쓰면 컬럼 의미가 흐려질 수 있다.
 * - 조회 화면에서 실제로 쓰는 필드만 PlantSearchRow로 정리하고, 빈 값은 표시용 fallback으로 바꾼다.
 */
export function mapToPlantSearchModel(plant: Plant): PlantSearchRow {
  return {
    id: plant.sysId ?? plant.plantCd,
    plantCode: plant.plantCd,
    plantName: plant.plantNm,
    storeName: plant.storeNm ?? '-',
    email: plant.emailUrl,
    postalCode: plant.zipCode ?? '-',
    address: plant.address ?? '-',
    phoneNumber: plant.phoneNumber ?? '-',
    useYn: plant.useYn === 'N' ? 'N' : 'Y',
  };
}

/**
 * 사업장 목록 조회 wrapper hook
 *
 * @description
 * - 검색어를 query key에 포함해서 동일 조건의 캐시를 재사용한다.
 * - generated hook이 만드는 기본 key 대신 feature 표준 key를 사용한다.
 * - 페이지는 이 wrapper만 알고, generated 구현 세부사항은 이 파일에 숨긴다.
 */
export function usePlantSearchQuery(searchKeyword = '') {
  return useSearchPlant(
    searchKeyword ? { searchKeyword } : undefined,
    {
      query: {
        queryKey: queryKeys.plant.list(searchKeyword),
      },
    },
  );
}
