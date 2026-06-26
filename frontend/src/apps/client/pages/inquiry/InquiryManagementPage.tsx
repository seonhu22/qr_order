/**
 * @fileoverview 게시판 > 문의사항 관리 페이지
 *
 * @description
 * - 화면 조립 역할만 담당한다.
 * - 실제 상태 계산과 등록 흐름은 `useInquiryListPage` feature hook에서 처리한다.
 * - 상세 모달은 목록에 있는 필드 + 첨부파일 다운로드만 보여준다.
 */

import './InquiryManagementPage.css';
import { InquiryListFilters } from '@/apps/client/features/inquiry/components/InquiryListFilters';
import { InquiryListTable } from '@/apps/client/features/inquiry/components/InquiryListTable';
import { useInquiryListPage } from '@/apps/client/features/inquiry/hooks/useInquiryListPage';
import { INQUIRY_FILE_POLICY } from '@/apps/client/features/inquiry/constants';
import { InputWrapper, TextInput, TextareaInput } from '@/shared/components/input';
import { FileDownloadList, FileInputGroup } from '@/shared/components/file-attachment';
import { WrapperModal } from '@/shared/components/modal/wrapper/WrapperModal';
import { SaveConfirmModal, SimpleDefaultModal } from '@/shared/components/modal';
import { Icon } from '@/shared/assets/icons/Icon';

export function InquiryManagementPage() {
  const { data, status, actions, uiProps } = useInquiryListPage();
  const { modalProps, selectedRow, attachFiles } = uiProps;

  return (
    <>
      <section className="inquiry-management-page" aria-label="문의사항 관리">
        <InquiryListFilters
          draftKeyword={uiProps.draftKeyword}
          draftAnswerStatus={uiProps.draftAnswerStatus}
          onKeywordChange={actions.handleKeywordChange}
          onAnswerStatusChange={actions.handleAnswerStatusChange}
          onSearch={actions.handleSearch}
          onReset={actions.handleReset}
        />

        <InquiryListTable
          className="inquiry-list-table"
          rows={data.rows}
          isLoading={status.isLoading}
          isError={status.isError}
          onRowClick={actions.handleRowClick}
          onCreate={actions.handleCreateClick}
        />
      </section>

      {/* ── 신규 등록 모달 ── */}
      <WrapperModal
        size="xl"
        open={modalProps.editor.open}
        isDirty={modalProps.editor.isDirty}
        title="문의사항 등록"
        subtitle="문의 내용을 입력하세요."
        primaryAction={{ label: '확인', onClick: actions.requestSave }}
        secondaryAction={{ label: '닫기', onClick: actions.closeEditorModal }}
        onClose={actions.closeEditorModal}
      >
        <div className="inquiry-editor-form">
          <TextInput
            label="제목"
            required
            size="md"
            value={modalProps.editor.editingRow?.title ?? ''}
            errorText={modalProps.editor.editorErrors.title ? '제목을 입력해주세요.' : undefined}
            placeholder="문의 제목을 입력하세요"
            onChange={(e) => actions.changeEditingField('title', e.target.value)}
          />
          <TextareaInput
            label="내용"
            required
            rows={6}
            value={modalProps.editor.editingRow?.content ?? ''}
            errorText={modalProps.editor.editorErrors.content ? '내용을 입력해주세요.' : undefined}
            placeholder="문의 내용을 입력하세요"
            onChange={(e) => actions.changeEditingField('content', e.target.value)}
          />
          {/* 첨부파일 업로드 연동은 아직 미구현 — api/inquiryApi.ts의 buildCreateInquiryRequest 주석 참고 */}
          <InputWrapper label="첨부파일" inputId="inquiry-create-file">
            <FileInputGroup
              variant="button"
              files={[]}
              onChange={actions.changeFileState}
              maxFiles={INQUIRY_FILE_POLICY.maxFiles}
              maxFileSizeMB={INQUIRY_FILE_POLICY.maxFileSizeMB}
              maxTotalSizeMB={INQUIRY_FILE_POLICY.maxTotalSizeMB}
              allowedExtensions={INQUIRY_FILE_POLICY.allowedExtensions}
            />
          </InputWrapper>
        </div>
      </WrapperModal>

      {/* ── 등록 확인 모달 ── */}
      <SaveConfirmModal
        open={modalProps.saveConfirm.open}
        title="등록하시겠습니까?"
        description="입력하신 내용을 등록합니다."
        primaryAction={{
          label: '확인',
          loading: modalProps.saveConfirm.isLoading,
          onClick: actions.confirmSave,
        }}
        secondaryAction={{
          disabled: modalProps.saveConfirm.isLoading,
          onClick: actions.closeSaveConfirm,
        }}
        onClose={actions.closeSaveConfirm}
      />

      {/* ── 변경 내용 경고 모달 ── */}
      <SimpleDefaultModal
        open={modalProps.dirtyWarning.open}
        title="알림"
        description="페이지를 나가시겠습니까?"
        helperText="입력하신 내용이 저장되지 않았습니다."
        primaryAction={{ label: '확인', onClick: actions.forceCloseEditorModal }}
        secondaryAction={{ onClick: actions.closeDirtyWarning }}
        onClose={actions.closeDirtyWarning}
      />

      {/* ── 안내 모달 ── */}
      <SimpleDefaultModal
        open={modalProps.notice.open}
        title={modalProps.notice.title}
        description={modalProps.notice.description}
        onClose={actions.closeNotice}
      />

      {/* ── 문의사항 상세 모달 ── */}
      <WrapperModal
        size="xl"
        open={selectedRow !== null}
        title="문의사항 상세"
        primaryAction={{ label: '닫기', onClick: actions.closeDetail }}
        onClose={actions.closeDetail}
      >
        {selectedRow && (
          <div className="inquiry-detail-form">
            {selectedRow.answerStatus === 'answered' && (
              <div className="inquiry-detail-answered-banner">
                <span className="inquiry-detail-answered-banner__left">
                  <Icon id="i-success" size={16} />
                  답변완료
                </span>
                <span className="inquiry-detail-answered-banner__date">
                  {selectedRow.answeredAt} 답변
                </span>
              </div>
            )}
            <TextInput label="제목" value={selectedRow.title} readOnly />
            <TextInput label="작성자" value={selectedRow.registrant} readOnly />
            <TextInput label="등록일자" value={selectedRow.registeredAt} readOnly />
            <TextareaInput label="내용" value={selectedRow.content} rows={5} readOnly />
            <TextareaInput label="답변 내용" value={selectedRow.answerContent} rows={5} readOnly />
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
