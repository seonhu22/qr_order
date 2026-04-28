/**
 * @fileoverview 파일 다운로드 목록 컴포넌트 (뷰 모드)
 *
 * @description
 * - 서버에서 받은 파일 목록을 읽기 전용으로 표시한다.
 * - 3개 초과 시 목록에 스크롤이 자동으로 적용된다.
 * - 파일명 클릭 또는 다운로드 버튼으로 개별 다운로드 이벤트를 발생시킨다.
 * - filePath → 실제 다운로드 URL 변환은 호출 측 onDownload 콜백에서 처리한다.
 * - 전체 다운로드(zip 구성)도 onDownloadAll 콜백에 위임한다.
 *
 * @module file-attachment/FileDownloadList
 */

import './FileAttachment.css';
import { Icon } from '@/shared/assets/icons/Icon';
import { getFileTypeInfo } from './fileTypeUtils';
import type { FileDownloadListProps, ServerFile } from './types';


/* =====================================================
 * 유틸
 * ===================================================== */

function formatBytes(bytes: number): string {
  const n = typeof bytes === 'string' ? parseInt(bytes as string, 10) : bytes;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}


/* =====================================================
 * FileDownloadList
 * ===================================================== */

/**
 * 파일 다운로드 목록 컴포넌트
 *
 * @example
 * // 개별 다운로드만
 * <FileDownloadList
 *   files={serverFiles}
 *   onDownload={(file) => window.open(file.filePath)}
 * />
 *
 * @example
 * // 전체 다운로드 버튼 포함
 * <FileDownloadList
 *   files={serverFiles}
 *   onDownload={handleDownload}
 *   onDownloadAll={handleDownloadAll}
 *   showDownloadAll
 * />
 */
export function FileDownloadList({
  files,
  onDownload,
  onDownloadAll,
  showDownloadAll = false,
  showHeader = false,
}: FileDownloadListProps) {
  if (!files.length) {
    return (
      <>
        {showHeader && <DownloadHeader count={0} />}
        <p className="file-attachment__empty">첨부된 파일이 없습니다.</p>
      </>
    );
  }

  return (
    <div className="file-download-list">
      {/* 헤더 — "첨부파일" 레이블 + 개수 뱃지 */}
      {showHeader && <DownloadHeader count={files.length} />}

      {/* 파일 목록 — 3개 초과 시 스크롤 */}
      <ul className="file-attachment__list">
        {files.map((f) => (
          <DownloadRow key={f.convertFileNm} file={f} onDownload={onDownload} />
        ))}
      </ul>

      {/* 전체 다운로드 — 목록 아래 전체 너비 버튼 */}
      {showDownloadAll && onDownloadAll && (
        <button
          type="button"
          className="file-attachment__download-all"
          onClick={() => onDownloadAll(files)}
        >
          <Icon id="i-download" size={14} aria-hidden="true" />
          전체 다운로드
        </button>
      )}
    </div>
  );
}


/* =====================================================
 * DownloadHeader — 헤더 (레이블 + 개수 뱃지)
 * ===================================================== */

function DownloadHeader({ count }: { count: number }) {
  return (
    <div className="file-attachment__dl-header">
      <span className="file-attachment__dl-header-label">첨부파일</span>
      <span className="file-attachment__dl-header-count">{count}개</span>
    </div>
  );
}


/* =====================================================
 * DownloadRow — 다운로드 단일 행 (내부용)
 * ===================================================== */

type DownloadRowProps = {
  file: ServerFile;
  onDownload?: (file: ServerFile) => void;
};

function DownloadRow({ file, onDownload }: DownloadRowProps) {
  function handleTrigger() {
    onDownload?.(file);
  }

  /*
   * 접근성 구조:
   * <li> — 역할 없음 (순수 목록 항목)
   *   <button class="item-row"> — 행 전체 클릭 영역 (파일명 클릭)
   *   <button class="item-action--download"> — 아이콘 버튼 (같은 레벨, 중첩 없음)
   */
  const { iconId, colorClass } = getFileTypeInfo(file.originalFileNm);

  return (
    <li className="file-attachment__item file-attachment__item--download">
      {/* 파일명 영역 — 클릭 시 다운로드 */}
      <button
        type="button"
        className="file-attachment__item-row"
        onClick={handleTrigger}
      >
        <span
          className={['file-attachment__item-icon', colorClass].filter(Boolean).join(' ')}
          aria-hidden="true"
        >
          <Icon id={iconId} size={14} />
        </span>
        <span className="file-attachment__item-name" title={file.originalFileNm}>
          {file.originalFileNm}
        </span>
        <span className="file-attachment__item-size">
          {formatBytes(parseInt(file.fileSize, 10))}
        </span>
      </button>
      {/* 다운로드 아이콘 버튼 — 삭제 버튼과 동일 크기(1.5rem), 호버 색만 다름 */}
      <button
        type="button"
        className="file-attachment__item-action file-attachment__item-action--download"
        aria-label={`${file.originalFileNm} 다운로드`}
        onClick={handleTrigger}
      >
        <Icon id="i-download" size={13} aria-hidden="true" />
      </button>
    </li>
  );
}
