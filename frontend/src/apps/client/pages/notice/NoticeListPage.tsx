/**
 * @fileoverview 게시판 > 공지사항 조회 페이지
 *
 * @description
 * - 화면 조립 역할만 담당한다.
 * - 실제 상태 계산과 다운로드 흐름은 `useNoticeListPage` feature hook에서 처리한다.
 */

import './NoticeListPage.css';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';
import { TextInput, TextareaInput } from '@/shared/components/input';
import { WrapperModal } from '@/shared/components/modal/wrapper/WrapperModal';
import { FileDownloadList } from '@/shared/components/file-attachment';
import { NoticeListTable } from '@/apps/client/features/notice/components/NoticeListTable';
import { useNoticeListPage } from '@/apps/client/features/notice/hooks/useNoticeListPage';

export function NoticeListPage() {
  const { data, status, actions, uiProps } = useNoticeListPage();
  const { selectedRow, attachFiles } = uiProps;

  return (
    <>
      <section className="notice-list-page" aria-label="공지사항 조회">
        <SearchFilterCard
          ariaLabel="공지사항 검색"
          inputId="notice-list-search-keyword"
          inputAriaLabel="공지사항 검색어"
          placeholder="제목, 내용으로 검색"
          draftKeyword={uiProps.draftKeyword}
          onKeywordChange={actions.handleKeywordChange}
          onSearch={actions.handleSearch}
          onReset={actions.handleReset}
        />

        <NoticeListTable
          className="notice-list-table"
          rows={data.rows}
          isLoading={status.isLoading}
          isError={status.isError}
          onRowClick={actions.handleRowClick}
        />
      </section>

      {/* ── 공지사항 상세 모달 (조회 전용) ── */}
      <WrapperModal
        size="xl"
        open={selectedRow !== null}
        title="공지사항 상세"
        subtitle="공지사항 내용을 확인하세요."
        primaryAction={{ label: '닫기', onClick: actions.closeDetail }}
        onClose={actions.closeDetail}
      >
        {selectedRow && (
          <div className="notice-list-detail">
            <TextInput label="제목" value={selectedRow.title} readOnly />
            <TextInput label="작성자" value={selectedRow.registrant} readOnly />
            <TextInput label="날짜" value={selectedRow.registeredAt} readOnly />
            <TextareaInput label="내용" value={selectedRow.content} rows={6} readOnly />
            <FileDownloadList
              files={attachFiles}
              showHeader
              showDownloadAll={attachFiles.length > 0}
              onDownload={actions.downloadFile}
              onDownloadAll={actions.downloadAllFiles}
            />
          </div>
        )}
      </WrapperModal>
    </>
  );
}
