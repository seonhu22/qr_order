/**
 * @fileoverview 파일 첨부 업로드 컴포넌트 (편집 모드)
 *
 * @description
 * - variant='dropzone': 드래그 앤 드롭 영역 + 클릭으로 파일 선택 (기본값)
 * - variant='button': 인풋 형식 버튼 + 파일 개수 뱃지 (공간이 좁은 폼에 적합)
 * - 3개 초과 시 파일 목록에 스크롤 자동 적용
 * - onChange 콜백으로 File 객체와 삭제 대상 서버 파일을 원본 그대로 전달한다.
 *   실제 API 전송 방식(base64/multipart)·convertFileNm 생성은 feature hook이 담당한다.
 *
 * @module file-attachment/FileInputGroup
 */

import './FileAttachment.css';
import { useRef, useState } from 'react';
import { Icon } from '@/shared/assets/icons/Icon';
import { getFileTypeInfo } from './fileTypeUtils';
import { buildHintParts } from './buildHintParts';
import { FileHint } from './FileHint';
import { formatFileSize } from './formatFileSize';
import { DEFAULT_FILE_ALLOWED_EXTENSIONS } from './filePolicy';
import type { FileInputGroupProps, ServerFile } from './types';


/* =====================================================
 * 유틸
 * ===================================================== */

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function normalizeExtension(ext: string): string {
  return ext.replace(/^\./, '').toLowerCase();
}

function normalizeFileName(filename: string): string {
  return filename.trim().toLowerCase();
}

function getServerFileName(file: ServerFile): string {
  const ext = file.fileExt ? `.${normalizeExtension(file.fileExt)}` : '';
  const name = file.originalFileNm.trim();
  return name.toLowerCase().endsWith(ext) ? name : `${name}${ext}`;
}

/* =====================================================
 * FileInputGroup
 * ===================================================== */

/**
 * 파일 첨부 편집 컴포넌트
 *
 * @example
 * // 드롭존 형식 — 신규 등록
 * <FileInputGroup onChange={handleChange} />
 *
 * @example
 * // 드롭존 형식 — 기존 파일 있음 (편집)
 * <FileInputGroup files={serverFiles} onChange={handleChange} />
 *
 * @example
 * // 버튼 형식 — 공간이 좁은 폼
 * <FileInputGroup variant="button" onChange={handleChange} />
 *
 * @example
 * // 업로드 진행 중
 * <FileInputGroup isUploading />
 */
export function FileInputGroup({
  variant = 'dropzone',
  files: existingFiles = [],
  onChange,
  maxFiles = 5,
  maxFileSizeMB = 10,
  maxTotalSizeMB = 50,
  allowedExtensions,
  disabled = false,
  isUploading = false,
  hint,
}: FileInputGroupProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [deletedFiles, setDeletedFiles] = useState<ServerFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const allowedExts = (allowedExtensions ?? DEFAULT_FILE_ALLOWED_EXTENSIONS).map(normalizeExtension);
  const acceptAttr = allowedExts.map((ext) => `.${ext}`).join(',');
  const hintText = buildHintParts({
    maxSize: `${maxFileSizeMB}MB`,
    maxTotalSize: `${maxTotalSizeMB}MB`,
    maxCount: maxFiles,
    allowedExts: allowedExts.map((ext) => ext.toUpperCase()),
  }).join(' · ');
  const effectiveHint = hint === undefined
    ? <FileHint variant="simple" message={hintText} />
    : hint;

  const activeExisting = existingFiles.filter(
    (f) => !deletedFiles.some((d) => d.convertFileNm === f.convertFileNm),
  );

  const totalCount = activeExisting.length + newFiles.length;
  const totalBytes =
    // 서버 fileSize는 bytes가 아니라 MB 단위 소수 문자열이라 bytes로 환산한다.
    activeExisting.reduce((sum, f) => sum + parseFloat(f.fileSize) * 1024 * 1024, 0) +
    newFiles.reduce((sum, f) => sum + f.size, 0);

  function notify(next: { newFiles: File[]; deletedFiles: ServerFile[] }) {
    onChange?.({ newFiles: next.newFiles, deletedFiles: next.deletedFiles });
  }

  /* ── 유효성 검사 후 파일 추가 ── */
  function addFiles(selected: File[]) {
    if (!selected.length) return;

    for (const file of selected) {
      const ext = getExtension(file.name);
      if (!allowedExts.includes(ext)) {
        setError(`허용되지 않는 형식입니다. (.${ext})`);
        return;
      }
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        setError(`파일당 최대 ${maxFileSizeMB}MB까지 첨부할 수 있습니다.`);
        return;
      }
    }

    const afterCount = totalCount + selected.length;
    const afterBytes = totalBytes + selected.reduce((s, f) => s + f.size, 0);

    if (afterCount > maxFiles) {
      setError(`파일은 최대 ${maxFiles}개까지 첨부할 수 있습니다.`);
      return;
    }
    if (afterBytes > maxTotalSizeMB * 1024 * 1024) {
      setError(`전체 파일 크기는 ${maxTotalSizeMB}MB를 초과할 수 없습니다.`);
      return;
    }

    const activeNames = new Set([
      ...activeExisting.map((file) => normalizeFileName(getServerFileName(file))),
      ...newFiles.map((file) => normalizeFileName(file.name)),
    ]);
    const selectedNames = new Set<string>();

    for (const file of selected) {
      const normalizedName = normalizeFileName(file.name);
      if (activeNames.has(normalizedName) || selectedNames.has(normalizedName)) {
        setError(`같은 이름의 파일이 이미 첨부되어 있습니다. (${file.name})`);
        return;
      }
      selectedNames.add(normalizedName);
    }

    setError(null);
    const next = [...newFiles, ...selected];
    setNewFiles(next);
    notify({ newFiles: next, deletedFiles });
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (inputRef.current) inputRef.current.value = '';
    addFiles(selected);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  }

  function handleDeleteExisting(file: ServerFile) {
    const next = [...deletedFiles, file];
    setDeletedFiles(next);
    setError(null);
    notify({ newFiles, deletedFiles: next });
  }

  function handleDeleteNew(index: number) {
    const next = newFiles.filter((_, i) => i !== index);
    setNewFiles(next);
    setError(null);
    notify({ newFiles: next, deletedFiles });
  }

  const hasFiles = totalCount > 0;
  const isMaxReached = totalCount >= maxFiles;
  const canInteract = !disabled && !isUploading && !isMaxReached;

  /* ── 공통 파일 목록 ── */
  const fileList = hasFiles ? (
    <ul className="file-attachment__list">
      {activeExisting.map((f) => (
        <FileRow
          key={f.convertFileNm}
          name={f.originalFileNm}
          size={parseFloat(f.fileSize) * 1024 * 1024}
          onDelete={disabled || isUploading ? undefined : () => handleDeleteExisting(f)}
        />
      ))}
      {newFiles.map((f, i) => (
        <FileRow
          key={`new-${i}`}
          name={f.name}
          size={f.size}
          isNew
          onDelete={disabled || isUploading ? undefined : () => handleDeleteNew(i)}
        />
      ))}
    </ul>
  ) : null;

  /* ── 힌트(좌) + 카운터(우) + 에러 ── */
  const footer = (
    <>
      {!disabled && (effectiveHint || totalCount > 0) && (
        <div className="file-attachment__toolbar">
          <span className="file-attachment__toolbar-hint">{effectiveHint}</span>
          <span className="file-attachment__counter">
            {totalCount}/{maxFiles}개 · {formatFileSize(totalBytes)}/{maxTotalSizeMB}MB
          </span>
        </div>
      )}
      {error && <p className="file-attachment__error">{error}</p>}
    </>
  );

  /* ── 숨김 input ── */
  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      multiple
      accept={acceptAttr}
      className="file-attachment__hidden-input"
      aria-label="파일 선택"
      onChange={handleInputChange}
    />
  );

  /* =====================================================
   * 버튼 형식
   * ===================================================== */
  if (variant === 'button') {
    return (
      <div className="file-input-group">
        {/* 인풋 형식 버튼 */}
        <div className="file-attachment__btn-input">
          <div
            className={`file-attachment__btn-input-left${disabled ? ' file-attachment__btn-input-left--disabled' : ''}`}
          >
            <Icon
              id="i-file"
              size={14}
              className="file-attachment__btn-input-icon"
              aria-hidden="true"
            />
            <span className="file-attachment__btn-input-placeholder">
              파일을 선택해주세요
            </span>
            {hasFiles && (
              <span className="file-attachment__btn-input-count">{totalCount}</span>
            )}
          </div>
          <button
            type="button"
            className="file-attachment__btn-input-trigger"
            disabled={disabled || isUploading || isMaxReached}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? '업로드 중...' : '파일 선택'}
          </button>
        </div>

        {fileList}
        {footer}
        {hiddenInput}
      </div>
    );
  }

  /* =====================================================
   * 드롭존 형식 (기본값)
   * ===================================================== */
  return (
    <div className="file-input-group">
      {fileList}

      {/* 드롭존 */}
      {!disabled && (
        <div
          className={[
            'file-attachment__dropzone',
            isDragOver && !isUploading ? 'file-attachment__dropzone--active' : '',
            isMaxReached ? 'file-attachment__dropzone--disabled' : '',
            isUploading ? 'file-attachment__dropzone--uploading' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          role="button"
          tabIndex={canInteract ? 0 : -1}
          aria-disabled={canInteract ? undefined : 'true'}
          aria-busy={isUploading ? 'true' : undefined}
          aria-label="파일을 끌어다 놓거나 클릭하여 선택"
          onClick={() => canInteract && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (canInteract && (e.key === 'Enter' || e.key === ' ')) {
              inputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Icon
            id={isUploading ? 'i-loading' : 'i-file'}
            size={24}
            className={`file-attachment__dropzone-icon${isUploading ? ' file-attachment__dropzone-icon--spinning' : ''}`}
            aria-hidden="true"
          />
          <span className="file-attachment__dropzone-text">
            {isUploading
              ? '업로드 중입니다...'
              : <><strong>클릭</strong>하거나 파일을 끌어다 놓으세요</>
            }
          </span>
          {!isUploading && (
            <span className="file-attachment__dropzone-hint">{hintText}</span>
          )}
        </div>
      )}

      {footer}
      {hiddenInput}
    </div>
  );
}


/* =====================================================
 * FileRow — 파일 목록 단일 행 (내부용)
 * ===================================================== */

type FileRowProps = {
  name: string;
  size: number;
  isNew?: boolean;
  onDelete?: () => void;
};

function FileRow({ name, size, isNew = false, onDelete }: FileRowProps) {
  const { iconId, colorClass } = getFileTypeInfo(name);
  return (
    <li className={`file-attachment__item${isNew ? ' file-attachment__item--new' : ''}`}>
      <span
        className={['file-attachment__item-icon', colorClass].filter(Boolean).join(' ')}
        aria-hidden="true"
      >
        <Icon id={iconId} size={14} />
      </span>
      <span className="file-attachment__item-name" title={name}>
        {name}
      </span>
      {isNew && <span className="file-attachment__item-new-badge">NEW</span>}
      <span className="file-attachment__item-size">{formatFileSize(size)}</span>
      {onDelete && (
        <button
          type="button"
          className="file-attachment__item-action file-attachment__item-action--delete"
          aria-label={`${name} 삭제`}
          onClick={onDelete}
        >
          <Icon id="i-close" size={12} aria-hidden="true" />
        </button>
      )}
    </li>
  );
}
