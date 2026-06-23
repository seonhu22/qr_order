import AdminMainLayout from '@/apps/admin/layout/AdminMainLayout';
import '@/apps/admin/pages/common-code/CommonCodePage.css';
import './PaymentManagePage.css';
import { PaymentManageTable } from '@/apps/admin/features/payment-manage/components/PaymentManageTable';
import { usePaymentManagePageState } from '@/apps/admin/features/payment-manage/hooks/usePaymentManagePageState';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';
import { InputBase, InputWrapper, SelectInput } from '@/shared/components/input';
import {
  DeleteConfirmModal,
  EditConfirmModal,
  SaveConfirmModal,
  SimpleDefaultModal,
} from '@/shared/components/modal';
import { WrapperModal } from '@/shared/components/modal/wrapper/WrapperModal';

const RATE_UNIT_OPTIONS = [
  { value: '원', label: '원' },
  { value: '달러', label: '달러' },
];

function formatRateAmountDisplay(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '');
  return digits ? Number(digits).toLocaleString('ko-KR') : '';
}

export function PaymentManagePage() {
  const { data, status, uiProps, actions } = usePaymentManagePageState();
  const { modalProps } = uiProps;

  return (
    <>
      <AdminMainLayout
        adminMainTitle="결제 요금 관리"
        depth1="시스템"
        depth2="결제 관리"
        className="admin-main-layout-page--fixed"
        filterSlot={
          <SearchFilterCard
            ariaLabel="결제 요금 검색"
            inputId="payment-manage-search-keyword"
            inputAriaLabel="결제 요금 검색어"
            placeholder="결제 요금 코드, 결제 요금명으로 검색"
            draftKeyword={uiProps.draftKeyword}
            onKeywordChange={actions.handleKeywordChange}
            onSearch={actions.handleSearch}
            onReset={actions.handleReset}
          />
        }
      >
        <PaymentManageTable
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
        title={modalProps.editor.isCreateMode ? '결제 요금 등록' : '결제 요금 수정'}
        subtitle="결제 요금 정보를 입력하세요."
        primaryAction={{ label: '확인', onClick: actions.requestSave }}
        secondaryAction={{ label: '닫기', onClick: actions.closeEditorModal }}
        onClose={actions.closeEditorModal}
      >
        <div className="common-code-modal-form">
          <InputWrapper
            label="결제 요금 코드"
            inputId="payment-rate-code"
            required
            errorText={modalProps.editor.editorErrors.rateCode ? '결제 요금 코드를 입력해주세요.' : undefined}
          >
            <InputBase
              id="payment-rate-code"
              size="md"
              value={modalProps.editor.editingRow?.rateCode ?? ''}
              readOnly={modalProps.editor.isCodeReadonly}
              required
              controlState={
                modalProps.editor.editorErrors.rateCode
                  ? 'error'
                  : modalProps.editor.isCodeReadonly
                    ? 'readonly'
                    : ''
              }
              placeholder={modalProps.editor.isCreateMode ? '결제 요금 코드를 입력하세요' : ''}
              onChange={(e) => actions.changeEditingField('rateCode', e.target.value)}
            />
          </InputWrapper>

          <InputWrapper
            label="결제 요금 명"
            inputId="payment-rate-name"
            required
            errorText={modalProps.editor.editorErrors.rateName ? '결제 요금 명을 입력해주세요.' : undefined}
          >
            <InputBase
              id="payment-rate-name"
              size="md"
              value={modalProps.editor.editingRow?.rateName ?? ''}
              required
              controlState={modalProps.editor.editorErrors.rateName ? 'error' : ''}
              placeholder="결제 요금 명을 입력하세요"
              onChange={(e) => actions.changeEditingField('rateName', e.target.value)}
            />
          </InputWrapper>

          <InputWrapper
            label="결제 요금"
            inputId="payment-rate-amount"
            required
            errorText={modalProps.editor.editorErrors.rateAmount ? '올바른 결제 요금을 입력해주세요.' : undefined}
          >
            <InputBase
              id="payment-rate-amount"
              inputMode="numeric"
              size="md"
              value={formatRateAmountDisplay(modalProps.editor.editingRow?.rateAmount ?? '')}
              required
              controlState={modalProps.editor.editorErrors.rateAmount ? 'error' : ''}
              placeholder="결제 요금을 입력하세요"
              onChange={(e) => actions.changeEditingField('rateAmount', e.target.value.replace(/\D/g, ''))}
            />
          </InputWrapper>

          <InputWrapper
            label="결제 요금 단위"
            inputId="payment-rate-unit"
            required
            errorText={modalProps.editor.editorErrors.rateUnit ? '결제 요금 단위를 선택해주세요.' : undefined}
          >
            <SelectInput
              size="md"
              className="common-code-modal-form__select-input"
              value={modalProps.editor.editingRow?.rateUnit ?? ''}
              options={RATE_UNIT_OPTIONS}
              required
              isError={modalProps.editor.editorErrors.rateUnit}
              placeholder="단위를 선택하세요"
              onChange={(value) => actions.changeEditingField('rateUnit', value)}
            />
          </InputWrapper>

          <InputWrapper
            label="라이센스 기간 (월)"
            inputId="payment-license-month"
            required
            errorText={modalProps.editor.editorErrors.licenseValidMonth ? '올바른 기간(월)을 입력해주세요.' : undefined}
          >
            <InputBase
              id="payment-license-month"
              type="number"
              min="1"
              step="1"
              size="md"
              value={modalProps.editor.editingRow?.licenseValidMonth ?? ''}
              required
              controlState={modalProps.editor.editorErrors.licenseValidMonth ? 'error' : ''}
              placeholder="기간(개월)을 입력하세요"
              onChange={(e) => actions.changeEditingField('licenseValidMonth', e.target.value)}
            />
          </InputWrapper>
        </div>
      </WrapperModal>

      {/* ── 저장 확인 모달 ── */}
      {modalProps.saveConfirm.isCreateMode ? (
        <SaveConfirmModal
          open={modalProps.saveConfirm.open}
          title="저장하시겠습니까?"
          description="입력하신 내용을 저장합니다."
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
          title="수정하시겠습니까?"
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
