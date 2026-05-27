import { DEFAULT_FILE_ALLOWED_EXTENSIONS } from '@/shared/components/file-attachment';

/**
 * 공지사항 첨부파일 정책.
 *
 * 현재는 백엔드 공통 파일 검증 정책과 동일하므로 shared 기본 정책을 재사용한다.
 * 공지사항만 다른 확장자/용량/개수 정책이 생기면 이 파일에서 전용 정책으로 분리한다.
 */
export const NOTICE_FILE_POLICY = {
  maxFiles: 5,
  maxFileSizeMB: 10,
  maxTotalSizeMB: 50,
  allowedExtensions: DEFAULT_FILE_ALLOWED_EXTENSIONS,
} as const;
