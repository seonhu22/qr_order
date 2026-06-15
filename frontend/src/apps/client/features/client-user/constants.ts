/**
 * @fileoverview 클라이언트 유저 권한 라벨 fallback 맵
 *
 * @description
 * - 공통 콤보(`USER_ROLE`) 연동 전까지 백엔드 권한 코드를 화면 라벨로 변환하는 데 사용한다.
 */
export const CLIENT_USER_AUTHORITY_LABELS: Record<string, string> = {
  ADMIN: '관리자',
  STAFF: '스태프',
};

/**
 * 권한 선택 콤보박스 옵션 — 등록/수정 모달에서 사용
 */
export const CLIENT_USER_AUTHORITY_OPTIONS = [
  { value: 'ADMIN', label: CLIENT_USER_AUTHORITY_LABELS.ADMIN },
  { value: 'STAFF', label: CLIENT_USER_AUTHORITY_LABELS.STAFF },
];
