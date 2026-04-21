import AdminMainLayout from '@/apps/admin/layout/AdminMainLayout';
import '@/apps/admin/pages/common-code/CommonCodePage.css';
import './CouponManagePage.css';
import { CouponManageFilters } from '@/apps/admin/features/coupon-manage/components/CouponManageFilters';
import { CouponManageTable } from '@/apps/admin/features/coupon-manage/components/CouponManageTable';
import { useCouponManagePageState } from '@/apps/admin/features/coupon-manage/hooks/useCouponManagePageState';
import { InputBase, InputWrapper, SelectInput } from '@/shared/components/input';
import {
  DeleteConfirmModal,
  EditConfirmModal,
  SaveConfirmModal,
  SimpleDefaultModal,
} from '@/shared/components/modal';
import { WrapperModal } from '@/shared/components/modal/wrapper/WrapperModal';

const USE_YN_OPTIONS = [
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
];

export function CouponManagePage() {
  const { data, status, uiProps, actions } = useCouponManagePageState();
  const { modalProps } = uiProps;

  return (
    <>
      <AdminMainLayout
        adminMainTitle="쿠폰 관리"
        depth1="시스템"
        depth2="결제 관리"
        className="admin-main-layout-page--fixed"
        filterSlot={
          <CouponManageFilters
            draftKeyword={uiProps.draftKeyword}
            onKeywordChange={actions.handleKeywordChange}
            onSearch={actions.handleSearch}
            onReset={actions.handleReset}
          />
        }
      >
        <CouponManageTable
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
        size="md"
        open={modalProps.editor.open}
        isDirty={modalProps.editor.isDirty}
        title={modalProps.editor.isCreateMode ? '쿠폰 등록' : '쿠폰 수정'}
        subtitle="쿠폰 정보를 입력하세요."
        primaryAction={{ label: '확인', onClick: actions.requestSave }}
        secondaryAction={{ label: '닫기', onClick: actions.closeEditorModal }}
        onClose={actions.closeEditorModal}
      >
        <div className="common-code-modal-form">
          <InputWrapper
            label="쿠폰 코드"
            inputId="coupon-cd"
            required
            errorText={modalProps.editor.editorErrors.couponCd ? '쿠폰 코드를 입력해주세요.' : undefined}
          >
            <InputBase
              id="coupon-cd"
              size="md"
              value={modalProps.editor.editingRow?.couponCd ?? ''}
              readOnly={modalProps.editor.isCodeReadonly}
              required
              controlState={
                modalProps.editor.editorErrors.couponCd
                  ? 'error'
                  : modalProps.editor.isCodeReadonly
                    ? 'readonly'
                    : ''
              }
              placeholder={modalProps.editor.isCreateMode ? '쿠폰 코드를 입력하세요' : ''}
              onChange={(e) => actions.changeEditingField('couponCd', e.target.value)}
            />
          </InputWrapper>

          <InputWrapper
            label="쿠폰 명"
            inputId="coupon-nm"
            required
            errorText={modalProps.editor.editorErrors.couponNm ? '쿠폰 명을 입력해주세요.' : undefined}
          >
            <InputBase
              id="coupon-nm"
              size="md"
              value={modalProps.editor.editingRow?.couponNm ?? ''}
              required
              controlState={modalProps.editor.editorErrors.couponNm ? 'error' : ''}
              placeholder="쿠폰 명을 입력하세요"
              onChange={(e) => actions.changeEditingField('couponNm', e.target.value)}
            />
          </InputWrapper>

          <InputWrapper
            label="쿠폰 적용 일자"
            inputId="coupon-start-date"
            required
            errorText={modalProps.editor.editorErrors.startDate ? '쿠폰 적용 일자를 입력해주세요.' : undefined}
          >
            <InputBase
              id="coupon-start-date"
              type="date"
              size="md"
              value={modalProps.editor.editingRow?.startDate ?? ''}
              required
              controlState={modalProps.editor.editorErrors.startDate ? 'error' : ''}
              onChange={(e) => actions.changeEditingField('startDate', e.target.value)}
            />
          </InputWrapper>

          <InputWrapper
            label="쿠폰 종료 일자"
            inputId="coupon-end-date"
            required
            errorText={modalProps.editor.editorErrors.endDate ? '쿠폰 종료 일자를 입력해주세요.' : undefined}
          >
            <InputBase
              id="coupon-end-date"
              type="date"
              size="md"
              value={modalProps.editor.editingRow?.endDate ?? ''}
              required
              controlState={modalProps.editor.editorErrors.endDate ? 'error' : ''}
              onChange={(e) => actions.changeEditingField('endDate', e.target.value)}
            />
          </InputWrapper>

          <InputWrapper
            label="사용 여부"
            inputId="coupon-use-yn"
            required
            errorText={modalProps.editor.editorErrors.useYn ? '사용 여부를 선택해주세요.' : undefined}
          >
            <SelectInput
              size="md"
              className="common-code-modal-form__select-input"
              value={modalProps.editor.editingRow?.useYn ?? ''}
              options={USE_YN_OPTIONS}
              required
              isError={modalProps.editor.editorErrors.useYn}
              placeholder="사용 여부를 선택하세요"
              onChange={(value) => actions.changeEditingField('useYn', value)}
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