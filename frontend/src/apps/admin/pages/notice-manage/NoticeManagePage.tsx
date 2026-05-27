import AdminMainLayout from '@/apps/admin/layout/AdminMainLayout';
import './NoticeManagePage.css';
import { NoticeManageTable } from '@/apps/admin/features/notice-manage/components/NoticeManageTable';
import { useNoticeManagePageState } from '@/apps/admin/features/notice-manage/hooks/useNoticeManagePageState';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';
import { InputBase, InputWrapper, SelectInput, TextareaInput } from '@/shared/components/input';
import { FileInputGroup } from '@/shared/components/file-attachment';
import { NOTICE_FILE_POLICY } from '@/apps/admin/features/notice-manage/constants';
import {
  DeleteConfirmModal,
  EditConfirmModal,
  SaveConfirmModal,
  SimpleDefaultModal,
} from '@/shared/components/modal';
import { WrapperModal } from '@/shared/components/modal/wrapper/WrapperModal';

const NOTICE_TYPE_OPTIONS = [
  { value: 'notice', label: '공지' },
  { value: 'update', label: '업데이트' },
  { value: 'alert', label: '알림' },
];

const TARGET_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'select', label: '선택' },
];

export function NoticeManagePage() {
  const { data, status, uiProps, actions } = useNoticeManagePageState();
  const { modalProps } = uiProps;

  return (
    <>
      <AdminMainLayout
        adminMainTitle="공지사항 관리"
        depth1="게시판"
        depth2="공지사항"
        className="admin-main-layout-page--fixed"
        filterSlot={
          <SearchFilterCard
            ariaLabel="공지사항 검색"
            inputId="notice-manage-search-keyword"
            inputAriaLabel="공지사항 검색어"
            placeholder="제목, 내용으로 검색"
            draftKeyword={uiProps.draftKeyword}
            onKeywordChange={actions.handleKeywordChange}
            onSearch={actions.handleSearch}
            onReset={actions.handleReset}
          />
        }
      >
        <NoticeManageTable
          rows={data.rows}
          isLoading={status.isLoading}
          isError={status.isError}
          checkedIds={uiProps.checkedIds}
          isAllChecked={uiProps.isAllChecked}
          onToggleRow={actions.handleToggleRow}
          onToggleAll={actions.handleToggleAll}
          onCreate={actions.handleCreate}
          onDelete={actions.handleDelete}
          onEdit={actions.handleEdit}
        />
      </AdminMainLayout>

      {/* ── 등록/수정 에디터 모달 ── */}
      <WrapperModal
        size="xl"
        open={modalProps.editor.open}
        isDirty={modalProps.editor.isDirty}
        title={modalProps.editor.isCreateMode ? '공지사항 등록' : '공지사항 수정'}
        subtitle="공지사항 정보를 입력하세요."
        primaryAction={{ label: '확인', onClick: actions.requestSave }}
        secondaryAction={{ label: '닫기', onClick: actions.closeEditorModal }}
        onClose={actions.closeEditorModal}
      >
        <div className="common-code-modal-form">
          {/* 제목 */}
          <InputWrapper
            label="제목"
            inputId="notice-title"
            required
            errorText={modalProps.editor.editorErrors.title ? '제목을 입력해주세요.' : undefined}
          >
            <InputBase
              id="notice-title"
              size="md"
              value={modalProps.editor.editingRow?.title ?? ''}
              required
              controlState={modalProps.editor.editorErrors.title ? 'error' : ''}
              placeholder="공지사항 제목을 입력하세요"
              onChange={(e) => actions.changeEditingField('title', e.target.value)}
            />
          </InputWrapper>

          {/* 공지 유형 + 수신 대상 — 2컬럼 */}
          <div className="notice-manage-modal-row">
            <SelectInput
              label="공지 유형"
              size="md"
              required
              value={modalProps.editor.editingRow?.noticeType ?? 'notice'}
              options={NOTICE_TYPE_OPTIONS}
              onChange={(v) => actions.changeEditingField('noticeType', v)}
            />
            <SelectInput
              label="수신 대상"
              size="md"
              required
              value={modalProps.editor.editingRow?.target ?? 'all'}
              options={TARGET_OPTIONS}
              onChange={(v) => actions.changeEditingField('target', v)}
            />
          </div>

          {/* 내용 */}
          <TextareaInput
            label="내용"
            id="notice-content"
            required
            errorText={modalProps.editor.editorErrors.content ? '내용을 입력해주세요.' : undefined}
            value={modalProps.editor.editingRow?.content ?? ''}
            rows={5}
            placeholder="공지사항 내용을 입력하세요"
            onChange={(e) => actions.changeEditingField('content', e.target.value)}
          />

          {/* 첨부파일 */}
          <InputWrapper label="첨부파일" inputId="notice-file">
            <FileInputGroup
              variant="button"
              files={modalProps.editor.attachFiles}
              onChange={actions.changeFileState}
              maxFiles={NOTICE_FILE_POLICY.maxFiles}
              maxFileSizeMB={NOTICE_FILE_POLICY.maxFileSizeMB}
              maxTotalSizeMB={NOTICE_FILE_POLICY.maxTotalSizeMB}
              allowedExtensions={NOTICE_FILE_POLICY.allowedExtensions}
            />
          </InputWrapper>
        </div>
      </WrapperModal>

      {/* ── 저장 확인 모달 ── */}
      {modalProps.saveConfirm.isCreateMode ? (
        <SaveConfirmModal
          open={modalProps.saveConfirm.open}
          title="저장하시겠습니까?"
          description="작성된 내용을 저장합니다."
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
      ) : (
        <EditConfirmModal
          open={modalProps.saveConfirm.open}
          title="수정된 내용을 저장하시겠습니까?"
          description="변경된 내용이 저장됩니다."
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
      )}

      {/* ── 삭제 확인 모달 ── */}
      <DeleteConfirmModal
        open={modalProps.deleteConfirm.open}
        title="삭제하시겠습니까?"
        description={
          modalProps.deleteConfirm.selectedDeleteCount > 1
            ? `선택한 ${modalProps.deleteConfirm.selectedDeleteCount}건의 항목을 삭제하면 복구할 수 없습니다.`
            : '선택한 항목을 삭제하면 복구할 수 없습니다.'
        }
        helperText="정말 삭제하시겠습니까?"
        primaryAction={{
          label: '확인',
          loading: modalProps.deleteConfirm.isLoading,
          onClick: actions.confirmDelete,
        }}
        secondaryAction={{
          disabled: modalProps.deleteConfirm.isLoading,
          onClick: actions.closeDeleteConfirm,
        }}
        onClose={actions.closeDeleteConfirm}
      />

      {/* ── 변경 내용 경고 모달 ── */}
      <SimpleDefaultModal
        open={modalProps.dirtyWarning.open}
        title="알림"
        description="페이지를 나가시겠습니까?"
        helperText="수정하신 내용이 저장되지 않았습니다."
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
    </>
  );
}
