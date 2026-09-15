import type { StaffCallItemRow } from '../types';

/**
 * 초기 시드 데이터 — consumer 쪽 STAFF_CALL_ITEMS(mock/staffCallItems.ts)와 같은 항목·순서로 맞췄다.
 * 다건(수량 조절 가능)인 7종은 single_yn: 'N', 단건(체크만)인 2종은 'Y'.
 * call_cd는 아직 공통코드 데이터가 없어 임시값을 넣어둔다 — 실제 공통코드 연동 시 교체 대상.
 */
export const STAFF_CALL_MANAGEMENT_MOCK: StaffCallItemRow[] = [
  { id: 's1', callCd: 'TMP001', callNm: '물', singleYn: 'N', description: '', useYn: 'Y', ordNo: 1 },
  { id: 's2', callCd: 'TMP002', callNm: '앞접시', singleYn: 'N', description: '', useYn: 'Y', ordNo: 2 },
  { id: 's3', callCd: 'TMP003', callNm: '컵', singleYn: 'N', description: '', useYn: 'Y', ordNo: 3 },
  { id: 's4', callCd: 'TMP004', callNm: '냅킨', singleYn: 'N', description: '', useYn: 'Y', ordNo: 4 },
  { id: 's5', callCd: 'TMP005', callNm: '물티슈', singleYn: 'N', description: '', useYn: 'Y', ordNo: 5 },
  { id: 's6', callCd: 'TMP006', callNm: '수저', singleYn: 'N', description: '', useYn: 'Y', ordNo: 6 },
  { id: 's7', callCd: 'TMP007', callNm: '젓가락', singleYn: 'N', description: '', useYn: 'Y', ordNo: 7 },
  { id: 's8', callCd: 'TMP008', callNm: '반찬추가', singleYn: 'Y', description: '', useYn: 'Y', ordNo: 8 },
  { id: 's9', callCd: 'TMP009', callNm: '소스추가', singleYn: 'Y', description: '', useYn: 'N', ordNo: 9 },
];
