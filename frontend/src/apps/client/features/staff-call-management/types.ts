/**
 * @fileoverview 직원호출 관리 feature 전용 화면 모델 타입
 *
 * @description
 * - 실제 DB 컬럼(sys_id, call_cd, call_nm, single_yn, description, sys_plant_cd)에 맞춰
 *   필드명을 정했다 — 아직 API가 없어 mock이지만, 나중에 API가 붙을 때 타입을 그대로 재사용하기 위함.
 * - useYn(사용여부)과 ordNo(표시 순서)는 DB에 대응 컬럼이 없는 화면 전용(mock) 필드다.
 */

/** 화면에 보여줄 선택방식 라벨 — DB의 single_yn('Y'|'N')과 1:1 대응한다. */
export type StaffCallSelectionType = '단건' | '다건';

export type StaffCallItemRow = {
  id: string;
  /** DB: call_cd. 아직 공통코드 연동 전이라 신규 행은 빈 문자열로 둔다. */
  callCd: string;
  /** DB: call_nm — 호출명 */
  callNm: string;
  /** DB: single_yn — 화면에는 단건/다건으로 보여준다 */
  singleYn: 'Y' | 'N';
  /** DB: description */
  description: string;
  /** mock 전용 — DB에 대응 컬럼 없음(ADR 참고) */
  useYn: 'Y' | 'N';
  /** mock 전용 — 표시 순서, 배열 순서와 동일 */
  ordNo: number;
  isNew?: boolean;
};
