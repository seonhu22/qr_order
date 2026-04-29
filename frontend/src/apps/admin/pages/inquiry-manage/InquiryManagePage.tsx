import { useState } from 'react';
import AdminMainLayout from '@/apps/admin/layout/AdminMainLayout';
import './InquiryManagePage.css';
import { InquiryManageTable } from '@/apps/admin/features/inquiry-manage/components/InquiryManageTable';
import { useInquiryManagePage } from '@/apps/admin/features/inquiry-manage/hooks/useInquiryManagePage';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';
import { WrapperModal } from '@/shared/components/modal/wrapper/WrapperModal';
import { SimpleDefaultModal } from '@/shared/components/modal';
import { TextInput, TextareaInput } from '@/shared/components/input';
import type { InquiryManageRow } from '@/apps/admin/features/inquiry-manage/types';

export function InquiryManagePage() {
  const { data, status, actions, uiProps } = useInquiryManagePage();

  const [selectedRow, setSelectedRow] = useState<InquiryManageRow | null>(null);
  const [answerContent, setAnswerContent] = useState('');
  const [answerError, setAnswerError] = useState(false);
  const [dirtyWarning, setDirtyWarning] = useState(false);
  const [noticeModal, setNoticeModal] = useState({ open: false, title: '', description: '' });

  const isDirty = answerContent !== (selectedRow?.answerContent ?? '');
  const canSaveAnswer = Boolean(selectedRow?.sysId);

  const handleOpenDetail = (row: InquiryManageRow) => {
    setSelectedRow(row);
    setAnswerContent(row.answerContent);
    setAnswerError(false);
  };

  /* 닫기 — 변경사항 있으면 경고 */
  const handleClose = () => {
    if (isDirty) {
      setDirtyWarning(true);
    } else {
      closeEditor();
    }
  };

  /* 강제 닫기 — 경고 모달 확인 후 */
  const handleForceClose = () => {
    setDirtyWarning(false);
    closeEditor();
  };

  const closeEditor = () => {
    setSelectedRow(null);
    setAnswerContent('');
    setAnswerError(false);
  };

  /* 확인 — 빈 답변 검증 후 저장 */
  const handleConfirm = async () => {
    if (!selectedRow) {
      return;
    }

    if (!answerContent.trim()) {
      setAnswerError(true);
      return;
    }

    try {
      await actions.saveAnswer(selectedRow, answerContent);
      closeEditor();
      setNoticeModal({ open: true, title: '안내', description: '답변이 저장되었습니다.' });
    } catch (error) {
      const description =
        error instanceof Error ? error.message : '답변 저장 중 오류가 발생했습니다.';

      setNoticeModal({ open: true, title: '오류', description });
    }
  };

  return (
    <>
      <AdminMainLayout
        adminMainTitle="문의사항 관리"
        depth1="게시판"
        depth2="문의사항"
        className="admin-main-layout-page--fixed"
        filterSlot={
          <SearchFilterCard
            ariaLabel="문의사항 검색"
            inputId="inquiry-manage-search-keyword"
            inputAriaLabel="문의사항 검색어"
            placeholder="제목, 사업장, 등록자로 검색"
            draftKeyword={uiProps.draftKeyword}
            onKeywordChange={actions.handleKeywordChange}
            onSearch={actions.handleSearch}
            onReset={actions.handleReset}
          />
        }
      >
        <InquiryManageTable
          rows={data.rows}
          isLoading={status.isLoading || status.isFetching}
          isError={status.isError}
          onDetail={handleOpenDetail}
        />
      </AdminMainLayout>

      {/* ── 문의 상세 모달 ── */}
      <WrapperModal
        size="xl"
        open={selectedRow !== null}
        isDirty={isDirty}
        title="문의사항 상세"
        subtitle="문의 내용을 확인하세요."
        primaryAction={{
          label: status.isSaving ? '저장 중...' : '확인',
          onClick: handleConfirm,
          disabled: status.isSaving || !canSaveAnswer,
        }}
        secondaryAction={{ label: '닫기', onClick: handleClose }}
        onClose={handleClose}
      >
        {selectedRow && (
          <div className="inquiry-detail">
            <TextInput label="제목" value={selectedRow.title} readOnly />
            <TextareaInput label="내용" value={selectedRow.content} rows={5} readOnly />
            <TextareaInput
              label="답변 내용"
              required
              value={answerContent}
              rows={5}
              placeholder="답변 내용을 입력하세요"
              errorText={answerError ? '답변 내용을 입력해주세요.' : undefined}
              disabled={!canSaveAnswer}
              onChange={(e) => {
                setAnswerContent(e.target.value);
                if (answerError) setAnswerError(false);
              }}
            />
            {!canSaveAnswer ? (
              <div className="inquiry-detail__attachment-placeholder">
                문의사항 식별자(sysId)가 없어 답변을 저장할 수 없습니다.
              </div>
            ) : null}
            <div className="inquiry-detail__attachment">
              <span className="inquiry-detail__attachment-label">첨부파일</span>
              <span className="inquiry-detail__attachment-placeholder">미구현</span>
            </div>
          </div>
        )}
      </WrapperModal>

      {/* ── 변경 내용 경고 모달 ── */}
      <SimpleDefaultModal
        open={dirtyWarning}
        title="알림"
        description="페이지를 나가시겠습니까?"
        helperText="수정하신 내용이 저장되지 않았습니다."
        primaryAction={{ label: '확인', onClick: handleForceClose }}
        secondaryAction={{ onClick: () => setDirtyWarning(false) }}
        onClose={() => setDirtyWarning(false)}
      />

      {/* ── 안내 모달 ── */}
      <SimpleDefaultModal
        open={noticeModal.open}
        title={noticeModal.title}
        description={noticeModal.description}
        onClose={() => setNoticeModal((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}
