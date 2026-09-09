/**
 * 참고 저장소(Qrorder) `CustomerMenuPage`의 STAFF_CALL_ITEMS를 그대로 옮겼다.
 * Client(관리자) 쪽 `ClientStaffCallSettings`는 다른 아이콘·라벨 체계로 항목을 커스터마이즈할 수
 * 있게 해두었지만, 아직 이 시트와 연동되지 않은 별도 설계라 지금은 고정값으로 둔다.
 */
export type StaffCallItem = {
  id: string;
  label: string;
};

export const STAFF_CALL_ITEMS: StaffCallItem[] = [
  { id: 'water', label: '물' },
  { id: 'plate', label: '앞접시' },
  { id: 'cup', label: '컵' },
  { id: 'napkin', label: '냅킨' },
  { id: 'wetTowel', label: '물티슈' },
  { id: 'spoon', label: '수저' },
  { id: 'fork', label: '젓가락' },
  { id: 'banchan', label: '반찬추가' },
  { id: 'sauce', label: '소스추가' },
];
