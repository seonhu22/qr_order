import type { SelectOption } from '@/shared/components/input';
import type { StaffCallItemRow } from '../types';

export const SINGLE_YN_OPTIONS: SelectOption[] = [
  { value: 'N', label: '다건' },
  { value: 'Y', label: '단건' },
];

export const USE_YN_OPTIONS: SelectOption[] = [
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
];

/**
 * 직원호출 항목 저장 API 계약이 확정되면 이 함수 본문을 httpClient 호출로 교체한다.
 * 지금은 백엔드 컨트롤러 자체가 없어(DB 테이블만 존재) 네트워크 호출이 없는 stub이며,
 * 항상 성공으로 처리한다.
 */
export function saveStaffCallItemsStub(_rows: StaffCallItemRow[]): Promise<{ success: true }> {
  return Promise.resolve({ success: true });
}
