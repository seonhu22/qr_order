/**
 * @fileoverview 파일 첨부 컴포넌트 타입 정의
 *
 * @description
 * UI 컴포넌트는 변환 없이 원본 데이터만 콜백으로 전달한다.
 * 실제 API 페이로드 구성(base64/multipart, convertFileNm 생성, filePath URL 조립)은
 * 이 컴포넌트를 사용하는 feature hook이 담당한다.
 */

/**
 * GET /api/attach_file 응답 항목 구조
 * POST /api/attach_file/save 의 updateItems / delItems 구조와 동일
 */
export type ServerFile = {
  sysId: string;
  linkSysId: string;
  originalFileNm: string;  // 원본 파일명 (화면 표시용)
  convertFileNm: string;   // 서버 저장 파일명 (식별키로 활용)
  fileExt: string;
  mimeType: string;
  fileSize: string;        // bytes 문자열 (e.g. "2457600")
  filePath: string;        // 다운로드 경로 — URL 조립 방식은 hook에서 결정
  ordNo: number;
  pdfYn: string;           // 'Y' | 'N'
};

/**
 * FileInputGroup onChange 콜백 값
 *
 * - newFiles: 새로 선택한 File 객체 — POST newItems 변환은 hook 담당
 * - deletedFiles: 삭제할 기존 파일 — POST delItems에 그대로 사용
 */
export type FileChangeState = {
  newFiles: File[];
  deletedFiles: ServerFile[];
};

export type FileInputGroupProps = {
  /** dropzone: 드래그 앤 드롭 영역 / button: 인풋 형식 버튼 */
  variant?: 'dropzone' | 'button';
  /** 서버에서 받은 기존 첨부파일 목록 */
  files?: ServerFile[];
  onChange?: (value: FileChangeState) => void;
  maxFiles?: number;          // 기본 5
  maxFileSizeMB?: number;     // 기본 10
  maxTotalSizeMB?: number;    // 기본 50
  /** 허용 확장자 목록 — 미전달 시 내부 기본 정책 사용 */
  allowedExtensions?: readonly string[];
  disabled?: boolean;
  /** true이면 파일 전송 중 — 드롭존 비활성 + 스피너 표시 */
  isUploading?: boolean;
  /** 카운터 왼쪽에 표시할 안내 요소 (FileHint 등) */
  hint?: React.ReactNode;
};

export type FileDownloadListProps = {
  files: ServerFile[];
  /**
   * 개별 파일 다운로드 — filePath를 어떤 URL로 변환할지는 호출 측이 결정
   * (직접 URL / /api prefix 추가 / 별도 다운로드 API 호출 등)
   */
  onDownload?: (file: ServerFile) => void;
  /** 전체 다운로드 — zip 구성 방식(JSZip / 백엔드 API 등)은 호출 측이 결정 */
  onDownloadAll?: (files: ServerFile[]) => void;
  showDownloadAll?: boolean;
  /** 목록 상단에 "첨부파일 N개" 헤더 표시 여부 */
  showHeader?: boolean;
};
