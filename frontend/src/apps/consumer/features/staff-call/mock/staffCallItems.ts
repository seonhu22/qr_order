/**
 * 참고 저장소(Qrorder) `CustomerMenuPage`의 STAFF_CALL_ITEMS를 그대로 옮겼다.
 * Client(관리자) 쪽 `ClientStaffCallSettings`는 다른 아이콘·라벨 체계로 항목을 커스터마이즈할 수
 * 있게 해두었지만, 아직 이 시트와 연동되지 않은 별도 설계라 지금은 고정값으로 둔다.
 */
export type StaffCallItem = {
  id: string;
  label: string;
  /** true면 칩에 +아이콘·수량 뱃지가 붙고 리스트에서 수량 조절이 가능하다. false면 체크 아이콘만 쓰고 on/off만 표현한다. */
  showQty: boolean;
};

export const STAFF_CALL_ITEMS: StaffCallItem[] = [
  { id: 'water', label: '물', showQty: true },
  { id: 'plate', label: '앞접시', showQty: true },
  { id: 'cup', label: '컵', showQty: true },
  { id: 'napkin', label: '냅킨', showQty: true },
  { id: 'wetTowel', label: '물티슈', showQty: true },
  { id: 'spoon', label: '수저', showQty: true },
  { id: 'fork', label: '젓가락', showQty: true },
  { id: 'banchan', label: '반찬추가', showQty: false },
  { id: 'sauce', label: '소스추가', showQty: false },
];
