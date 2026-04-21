import type { SelectOption } from '@/shared/components/input';

/**
 * 관리자 관리 페이지 사업장 컬럼의 임시 옵션 목록.
 *
 * @description
 * - 현재 combo 데이터가 비어 있을 때만 fallback으로 사용한다.
 * - 추후 공식 API가 안정화되면 제거 가능하다.
 */
export const ADMIN_USER_PLANT_FALLBACK_OPTIONS: SelectOption[] = [
  { value: 'ADMIN', label: '관리자' },
  { value: 'PLANT-001', label: '강남점' },
  { value: 'PLANT-002', label: '판교점' },
  { value: 'PLANT-003', label: '성수점' },
];
