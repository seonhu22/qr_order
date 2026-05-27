/**
 * 파일첨부 공통 기본 정책.
 *
 * FileInputGroup의 기본 허용 확장자와, 기본 정책을 그대로 따르는 feature 상수에서 함께 사용한다.
 * 화면별 정책이 달라지면 이 값을 직접 바꾸기보다 해당 feature의 constants에서 별도 정책을 선언한다.
 */
export const DEFAULT_FILE_ALLOWED_EXTENSIONS = [
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'pdf',
  'png',
  'txt',
  'zip',
] as const;
