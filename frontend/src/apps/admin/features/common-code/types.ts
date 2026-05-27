/**
 * @fileoverview 공통코드 feature 전용 화면 모델 타입
 *
 * @description
 * - generated DTO를 그대로 쓰지 않고, 화면에서 다루기 편한 형태로 정리한 타입이다.
 * - checked, isNew 같은 UI 전용 상태도 함께 포함한다.
 */

/**
 * 공통코드 마스터 테이블 한 행을 나타낸다.
 */
export type MasterCode = {
  id: string;
  sysId?: string;
  code: string;
  name: string;
  useYn: 'Y' | 'N';
};

/**
 * 공통코드 상세 테이블 한 행을 나타낸다.
 *
 * @description
 * - ordNo는 화면 순서이자 저장 payload의 순번이다.
 * - isNew는 화면 전용 상태이며 서버 DTO에는 없다.
 */
export type DetailCode = {
  id: string;
  sysId?: string;
  linkSysId: string;
  code: string;
  name: string;
  useYn: boolean;
  ordNo: number;
  isNew?: boolean;
};
