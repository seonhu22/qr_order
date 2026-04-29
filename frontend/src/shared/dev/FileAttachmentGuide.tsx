/**
 * @fileoverview 파일 첨부 컴포넌트 개발 가이드
 *
 * @description
 * 사용 시나리오별 3단계 × 2가지 형식 구성
 *   1. 등록 — 기존 파일 없음, 새 파일 추가
 *   2. 수정 — 기존 파일 있음, 추가·삭제 가능
 *   3. 상세 — 다운로드 전용 (FileDownloadList)
 *  × 드롭존 형식 / 버튼 형식
 *
 * 경로: /dev/file-attachment
 */

import { useState } from 'react';
import { Icon } from '@/shared/assets/icons/Icon';
import { FileInputGroup } from '@/shared/components/file-attachment/FileInputGroup';
import { FileDownloadList } from '@/shared/components/file-attachment/FileDownloadList';
import { FileHint } from '@/shared/components/file-attachment/FileHint';
import { getFileTypeInfo } from '@/shared/components/file-attachment/fileTypeUtils';
import type { ServerFile, FileChangeState } from '@/shared/components/file-attachment/types';
import './devStyles/FileAttachmentGuide.css';


/* =====================================================
 * 목업 데이터
 * ===================================================== */

const MOCK_FILES: ServerFile[] = [
  {
    sysId: 'notice', linkSysId: '001',
    originalFileNm: '계획서_2025.pdf', convertFileNm: 'abc123.pdf',
    fileExt: 'pdf', mimeType: 'application/pdf',
    fileSize: '2457600', filePath: '/files/abc123.pdf', ordNo: 1, pdfYn: 'Y',
  },
  {
    sysId: 'notice', linkSysId: '001',
    originalFileNm: '현장사진.png', convertFileNm: 'def456.png',
    fileExt: 'png', mimeType: 'image/png',
    fileSize: '1048576', filePath: '/files/def456.png', ordNo: 2, pdfYn: 'N',
  },
  {
    sysId: 'notice', linkSysId: '001',
    originalFileNm: '결과보고서.xlsx', convertFileNm: 'ghi789.xlsx',
    fileExt: 'xlsx', mimeType: 'application/vnd.ms-excel',
    fileSize: '512000', filePath: '/files/ghi789.xlsx', ordNo: 3, pdfYn: 'N',
  },
];

const MOCK_FILES_MANY: ServerFile[] = [
  ...MOCK_FILES,
  {
    sysId: 'notice', linkSysId: '001',
    originalFileNm: '추가파일_1.zip', convertFileNm: 'jkl000.zip',
    fileExt: 'zip', mimeType: 'application/zip',
    fileSize: '3145728', filePath: '/files/jkl000.zip', ordNo: 4, pdfYn: 'N',
  },
  {
    sysId: 'notice', linkSysId: '001',
    originalFileNm: '추가파일_2.docx', convertFileNm: 'mno111.docx',
    fileExt: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: '204800', filePath: '/files/mno111.docx', ordNo: 5, pdfYn: 'N',
  },
];

/* 제약 설정 — 실제 사용 시 동일한 값을 FileInputGroup과 FileHint 양쪽에 넘긴다 */
const POLICY = { maxFiles: 5, maxFileSizeMB: 50, maxTotalSizeMB: 50 };
const HINT_EXTS = ['JPG', 'PNG', 'PDF', 'DOCX', 'XLSX', 'PPTX', 'ZIP'];
const ICON_CASES = [
  { filename: 'sample.jpg', extensions: 'JPG, JPEG, PNG', label: '이미지 파일', color: '--color-status-info-default', usage: '파일 목록 아이콘' },
  { filename: 'sample.pdf', extensions: 'PDF', label: 'PDF 문서', color: '--color-status-error-default', usage: '파일 목록 아이콘' },
  { filename: 'sample.docx', extensions: 'DOCX', label: '문서 파일', color: '--color-text-secondary', usage: '파일 목록 아이콘' },
  { filename: 'sample.xlsx', extensions: 'XLSX', label: '스프레드시트', color: '--color-status-success-default', usage: '파일 목록 아이콘' },
  { filename: 'sample.pptx', extensions: 'PPTX', label: '프레젠테이션', color: '--color-brand-default', usage: '파일 목록 아이콘' },
  { filename: 'sample.zip', extensions: 'ZIP', label: '압축 파일', color: '--color-status-warning-default', usage: '파일 목록 아이콘' },
  { filename: 'sample.etc', extensions: '기타', label: '기본 파일', color: '--color-text-tertiary', usage: 'fallback 아이콘' },
];

const ACTION_ICONS = [
  { iconId: 'i-file', label: '파일 선택', color: '--color-text-tertiary', usage: '드롭존, 버튼형 입력 왼쪽 아이콘' },
  { iconId: 'i-loading', label: '업로드 중', color: '--color-text-tertiary', usage: 'isUploading 상태의 드롭존 아이콘' },
  { iconId: 'i-close', label: '삭제', color: '--color-text-tertiary', usage: '편집 모드 파일 삭제 버튼' },
  { iconId: 'i-download', label: '다운로드', color: '--color-text-tertiary', usage: '개별/전체 다운로드 버튼' },
  { iconId: 'i-info', label: '안내', color: '--color-status-info-default', usage: 'FileHint simple/info' },
  { iconId: 'i-lightbulb', label: '경고', color: '--color-status-warning-default', usage: 'FileHint warning' },
  { iconId: 'i-error', label: '오류', color: '--color-status-error-default', usage: 'FileHint error' },
];


/* =====================================================
 * 레이아웃 헬퍼
 * ===================================================== */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="file-attachment-guide__section">
      <h2 className="file-attachment-guide__section-title">{title}</h2>
      {children}
    </section>
  );
}

function Case({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="file-attachment-guide__case">
      <p className="file-attachment-guide__case-label">{label}</p>
      <div className="file-attachment-guide__case-body">{children}</div>
    </div>
  );
}

function Log({ value }: { value: object }) {
  return (
    <pre className="file-attachment-guide__log">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function IconSection() {
  return (
    <Section title="파일첨부 아이콘 적용 기준">
      <Case label="확장자별 파일 아이콘">
        <div className="file-attachment-guide__icon-grid">
          {ICON_CASES.map((item) => {
            const { iconId, colorClass } = getFileTypeInfo(item.filename);

            return (
              <div key={item.filename} className="file-attachment-guide__icon-card">
                <span
                  className={['file-attachment-guide__icon-preview', colorClass].filter(Boolean).join(' ')}
                  style={{ color: `var(${item.color})` }}
                >
                  <Icon id={iconId} size={22} />
                </span>
                <div className="file-attachment-guide__icon-meta">
                  <strong>{item.label}</strong>
                  <p>{item.extensions}</p>
                  <code>{iconId}</code>
                  <span className="file-attachment-guide__color-token">
                    <i style={{ backgroundColor: `var(${item.color})` }} aria-hidden="true" />
                    <code>{item.color}</code>
                  </span>
                  <span>{item.usage}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Case>

      <Case label="동작/상태 아이콘">
        <div className="file-attachment-guide__icon-grid">
          {ACTION_ICONS.map((item) => (
            <div key={item.iconId} className="file-attachment-guide__icon-card">
              <span
                className="file-attachment-guide__icon-preview"
                style={{ color: `var(${item.color})` }}
              >
                <Icon id={item.iconId} size={22} />
              </span>
              <div className="file-attachment-guide__icon-meta">
                <strong>{item.label}</strong>
                <code>{item.iconId}</code>
                <span className="file-attachment-guide__color-token">
                  <i style={{ backgroundColor: `var(${item.color})` }} aria-hidden="true" />
                  <code>{item.color}</code>
                </span>
                <span>{item.usage}</span>
              </div>
            </div>
          ))}
        </div>
      </Case>
    </Section>
  );
}


/* =====================================================
 * 인터랙티브 데모 컴포넌트
 * ===================================================== */

function RegisterDropDemo() {
  const [state, setState] = useState<FileChangeState>({ newFiles: [], deletedFiles: [] });
  return (
    <Case label="드롭존 — 인터랙티브 (실제 파일 선택 가능)">
      <FileInputGroup
        {...POLICY}
        hint={<FileHint variant="badge" maxSize="50MB" maxCount={POLICY.maxFiles} allowedExts={HINT_EXTS} />}
        onChange={setState}
      />
      <Log value={{ newFiles: state.newFiles.map((f) => ({ name: f.name, size: f.size })) }} />
    </Case>
  );
}

function RegisterButtonDemo() {
  const [state, setState] = useState<FileChangeState>({ newFiles: [], deletedFiles: [] });
  return (
    <Case label="버튼 형식 — 인터랙티브 (실제 파일 선택 가능)">
      <FileInputGroup
        variant="button"
        {...POLICY}
        hint={<FileHint variant="simple" maxSize="50MB" maxCount={POLICY.maxFiles} allowedExts={HINT_EXTS} />}
        onChange={setState}
      />
      <Log value={{ newFiles: state.newFiles.map((f) => ({ name: f.name, size: f.size })) }} />
    </Case>
  );
}

function EditDropDemo() {
  const [state, setState] = useState<FileChangeState>({ newFiles: [], deletedFiles: [] });
  return (
    <Case label="드롭존 — 인터랙티브 (기존 파일 삭제 · 새 파일 추가 가능)">
      <FileInputGroup
        files={MOCK_FILES}
        {...POLICY}
        hint={<FileHint variant="badge" maxSize="50MB" maxCount={POLICY.maxFiles} allowedExts={HINT_EXTS} />}
        onChange={setState}
      />
      <Log value={{
        newFiles: state.newFiles.map((f) => ({ name: f.name, size: f.size })),
        deletedFiles: state.deletedFiles.map((f) => f.originalFileNm),
      }} />
    </Case>
  );
}

function EditButtonDemo() {
  const [state, setState] = useState<FileChangeState>({ newFiles: [], deletedFiles: [] });
  return (
    <Case label="버튼 형식 — 인터랙티브 (기존 파일 삭제 · 새 파일 추가 가능)">
      <FileInputGroup
        variant="button"
        files={MOCK_FILES}
        {...POLICY}
        hint={<FileHint variant="simple" maxSize="50MB" maxCount={POLICY.maxFiles} />}
        onChange={setState}
      />
      <Log value={{
        newFiles: state.newFiles.map((f) => ({ name: f.name, size: f.size })),
        deletedFiles: state.deletedFiles.map((f) => f.originalFileNm),
      }} />
    </Case>
  );
}

function DownloadDemo() {
  const [log, setLog] = useState<string[]>([]);
  return (
    <Case label="상세 — 인터랙티브 (클릭 시 콜백 확인)">
      <FileDownloadList
        files={MOCK_FILES}
        showHeader
        showDownloadAll
        onDownload={(f) =>
          setLog((p) => [`[개별] ${f.originalFileNm} — filePath: ${f.filePath}`, ...p])
        }
        onDownloadAll={(files) =>
          setLog((p) => [`[전체] ${files.length}개 — zip 구성은 hook에서 처리`, ...p])
        }
      />
      {log.length > 0 && (
        <pre className="file-attachment-guide__log">{log.join('\n')}</pre>
      )}
    </Case>
  );
}


/* =====================================================
 * 메인 가이드
 * ===================================================== */

export default function FileAttachmentGuide() {
  return (
    <div className="file-attachment-guide">
      <header className="file-attachment-guide__header">
        <h1 className="file-attachment-guide__title">첨부파일</h1>
        <p className="file-attachment-guide__desc">
          <code>FileInputGroup</code>(편집) · <code>FileDownloadList</code>(조회) · <code>FileHint</code>(안내)
          <br />
          3가지 시나리오(등록/수정/상세) × 2가지 형식(드롭/버튼)으로 구성된다.
        </p>
      </header>

      <IconSection />

      {/* ── 1. 등록 ──────────────────────────────────── */}
      <Section title="1. 등록 — 기존 파일 없음">
        <Case label="드롭존 — 기본">
          <FileInputGroup hint={<FileHint variant="badge" maxSize="50MB" maxCount={5} allowedExts={HINT_EXTS} />} />
        </Case>

        <Case label="버튼 형식 — 기본">
          <FileInputGroup variant="button" hint={<FileHint variant="simple" maxSize="50MB" maxCount={5} allowedExts={HINT_EXTS} />} />
        </Case>

        <Case label="드롭존 — 업로드 진행 중 (isUploading)">
          <FileInputGroup isUploading />
        </Case>

        <Case label="버튼 형식 — 업로드 진행 중 (isUploading)">
          <FileInputGroup variant="button" isUploading />
        </Case>

        <RegisterDropDemo />
        <RegisterButtonDemo />
      </Section>


      {/* ── 2. 수정 ──────────────────────────────────── */}
      <Section title="2. 수정 — 기존 파일 + 신규 파일">
        <Case label="드롭존 — 기존 파일 있음">
          <FileInputGroup files={MOCK_FILES} hint={<FileHint variant="badge" maxSize="50MB" maxCount={5} allowedExts={HINT_EXTS} />} />
        </Case>

        <Case label="버튼 형식 — 기존 파일 있음 (개수 뱃지 확인)">
          <FileInputGroup variant="button" files={MOCK_FILES} hint={<FileHint variant="simple" maxSize="50MB" maxCount={5} />} />
        </Case>

        <Case label="드롭존 — 최대 개수 도달 → warning 안내">
          <FileInputGroup files={MOCK_FILES} maxFiles={3} hint={<FileHint variant="warning" maxCount={3} />} />
        </Case>

        <Case label="드롭존 — 업로드 진행 중 (저장 API 호출 중)">
          <FileInputGroup files={MOCK_FILES} isUploading />
        </Case>

        <Case label="드롭존 — disabled (읽기 전용 전환)">
          <FileInputGroup files={MOCK_FILES} disabled />
        </Case>

        <EditDropDemo />
        <EditButtonDemo />
      </Section>


      {/* ── 3. 상세 (다운로드 전용) ───────────────────── */}
      <Section title="3. 상세 — 다운로드 전용 (FileDownloadList)">
        <Case label="헤더 + 개수 뱃지 표시 (showHeader)">
          <FileDownloadList files={MOCK_FILES} showHeader onDownload={() => {}} />
        </Case>

        <Case label="전체 다운로드 버튼 포함">
          <FileDownloadList
            files={MOCK_FILES}
            showHeader
            showDownloadAll
            onDownload={() => {}}
            onDownloadAll={() => {}}
          />
        </Case>

        <Case label="5개 파일 — 4개 초과부터 스크롤">
          <FileDownloadList files={MOCK_FILES_MANY} showHeader onDownload={() => {}} />
        </Case>

        <Case label="파일 없음">
          <FileDownloadList files={[]} showHeader />
        </Case>

        <DownloadDemo />
      </Section>


      {/* ── FileHint 변형 ────────────────────────────── */}
      <Section title="FileHint — 제약 안내 변형">
        <Case label="simple — 한 줄 텍스트">
          <FileHint variant="simple" maxSize="50MB" maxCount={5} allowedExts={HINT_EXTS} />
        </Case>

        <Case label="badge — 칩 형식 (확장자 없음)">
          <FileHint variant="badge" maxSize="50MB" maxCount={5} />
        </Case>

        <Case label="badge — 전체 제약 표시">
          <FileHint variant="badge" maxSize="50MB" maxCount={5} allowedExts={HINT_EXTS} />
        </Case>

        <Case label="info — 파란 박스">
          <FileHint variant="info" maxSize="50MB" maxCount={5} allowedExts={HINT_EXTS} />
        </Case>

        <Case label="warning — 노란 박스 (한도 도달 시)">
          <FileHint variant="warning" maxCount={5} />
        </Case>

        <Case label="error — 빨간 박스 (형식 위반 시)">
          <FileHint variant="error" />
        </Case>

        <Case label="커스텀 메시지">
          <FileHint variant="info" message="PDF 파일은 업로드 후 미리보기를 지원합니다." />
        </Case>
      </Section>


      {/* ── 정책 ─────────────────────────────────────── */}
      <Section title="첨부 정책">
        <table className="file-attachment-guide__table">
          <thead>
            <tr><th>항목</th><th>값</th></tr>
          </thead>
          <tbody>
            <tr><td>파일당 최대 크기</td><td>50 MB</td></tr>
            <tr><td>최대 파일 수</td><td>5개</td></tr>
            <tr><td>전체 최대 크기</td><td>50 MB</td></tr>
            <tr><td>허용 확장자</td><td>JPG · PNG · PDF · DOCX · XLSX · PPTX · ZIP</td></tr>
            <tr><td>개별 다운로드</td><td>파일명 클릭 또는 다운로드 아이콘</td></tr>
            <tr><td>전체 다운로드</td><td>zip — API 확정 후 hook에서 구현</td></tr>
          </tbody>
        </table>
      </Section>
    </div>
  );
}
