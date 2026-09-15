import AdminMainLayout from '@/apps/admin/layout/AdminMainLayout';
import '@/apps/admin/pages/common-code/CommonCodePage.css';
import { RuleDetailTable } from '@/apps/admin/features/rule-management/components/RuleDetailTable';
import { RuleMasterTable } from '@/apps/admin/features/rule-management/components/RuleMasterTable';
import { useRuleManagementPage } from '@/apps/admin/features/rule-management/hooks/useRuleManagementPage';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';
import { InputBase, InputWrapper, SelectInput } from '@/shared/components/input';
import {
  ConfirmModal,
  DeleteConfirmModal,
  EditConfirmModal,
  SaveConfirmModal,
  SimpleDefaultModal,
} from '@/shared/components/modal';
import { WrapperModal } from '@/shared/components/modal/wrapper/WrapperModal';

/**
 * 규칙 관리 페이지 컨테이너.
 *
 * @description
 * 공통코드와 같은 검색 영역 + 마스터/상세 테이블을 조립하고,
 * 저장/삭제/알림 모달 흐름은 이 페이지에서 한 번에 조율한다.
 */
export function RuleManagementPage() {
  const { data, status, actions, uiProps } = useRuleManagementPage();
  const masterModalProps = uiProps.masterModalProps;
  const detailModalProps = uiProps.detailModalProps;

  return (
    <>
      {/* 페이지 본문은 테이블 2개를 조립하고,
         실제 모달은 아래에서 한 번에 관리한다. */}
      <AdminMainLayout
        adminMainTitle="규칙 관리"
        depth1="시스템"
        depth2="시스템 관리"
        className="admin-main-layout-page--fixed"
        filterSlot={
          <SearchFilterCard
            ariaLabel="규칙 검색"
            inputId="rule-search-keyword"
            inputAriaLabel="규칙 검색어"
            placeholder="규칙코드, 규칙명으로 검색"
            draftKeyword={uiProps.draftMasterKeyword}
            onKeywordChange={actions.handleMasterKeywordChange}
            onSearch={actions.handleSearch}
            onReset={actions.handleReset}
          />
        }
      >
        <RuleMasterTable
          rows={data.masterRows}
          isLoading={status.isLoadingMasters}
          isError={status.isErrorMasters}
          selectedMasterId={uiProps.selectedMasterId}
          checkedMasterIds={uiProps.checkedMasterIds}
          isAllChecked={uiProps.isAllMastersChecked}
          onSelectRow={actions.handleSelectMaster}
          onToggleRow={actions.handleToggleMaster}
          onToggleAllRows={actions.handleToggleAllMasters}
          onCreate={actions.openCreateMasterModal}
          onEdit={actions.openEditMasterModal}
          onDelete={actions.requestDeleteMasters}
        />

        <RuleDetailTable
          key={data.selectedMaster?.id ?? 'rule-detail-empty'}
          selectedMaster={data.selectedMaster}
          isLoading={status.isLoadingDetails}
          isSaving={status.isConfirmingDetailSave}
          columns={data.detailColumns}
          rows={data.detailRows}
          rowErrors={uiProps.detailRowErrors}
          onChangeValue={actions.handleChangeDetailValue}
          onClearRowError={actions.clearDetailRowError}
          onAddRow={actions.handleAddDetailRow}
          onDeleteRow={actions.handleDeleteDetailRow}
          onMoveUp={actions.handleMoveDetailRowUp}
          onMoveDown={actions.handleMoveDetailRowDown}
          onSave={actions.requestSaveDetailRows}
        />
      </AdminMainLayout>

      <ConfirmModal
        open={uiProps.pendingFilterAction !== null}
        tone="info"
        title={uiProps.pendingFilterAction === 'reset' ? '초기화하시겠습니까?' : '조회하시겠습니까?'}
        description="저장되지 않은 내용이 있습니다."
        onClose={actions.cancelFilterAction}
        primaryAction={{ onClick: actions.confirmFilterAction }}
        secondaryAction={{ onClick: actions.cancelFilterAction }}
      />

      {/* 마스터 수정/등록 editor 모달 */}
      <WrapperModal
        size="md"
        open={masterModalProps.editor.open}
        isDirty={masterModalProps.editor.isDirty}
        title={masterModalProps.editor.isCreateMode ? '규칙 등록' : '규칙 수정'}
        subtitle="규칙 정보를 입력하세요."
        primaryAction={{ label: '확인', onClick: actions.requestSaveMaster }}
        secondaryAction={{ label: '닫기', onClick: actions.closeMasterEditorModal }}
        onClose={actions.closeMasterEditorModal}
      >
        <div className="common-code-modal-form">
          <InputWrapper
            label="규칙코드"
            inputId="rule-master-code"
            required
            errorText={
              masterModalProps.editor.editorErrors.code ? '규칙코드를 채워주세요.' : undefined
            }
          >
            <InputBase
              id="rule-master-code"
              size="md"
              value={masterModalProps.editor.editingRow?.code ?? ''}
              readOnly={masterModalProps.editor.isCodeReadonly}
              required
              controlState={
                masterModalProps.editor.editorErrors.code
                  ? 'error'
                  : masterModalProps.editor.isCodeReadonly
                    ? 'readonly'
                    : ''
              }
              placeholder={masterModalProps.editor.isCreateMode ? '규칙코드를 입력하세요' : ''}
              onChange={(event) => actions.changeMasterEditingField('code', event.target.value)}
            />
          </InputWrapper>
          <InputWrapper
            label="규칙명"
            inputId="rule-master-name"
            required
            errorText={
              masterModalProps.editor.editorErrors.name ? '규칙명을 채워주세요.' : undefined
            }
          >
            <InputBase
              id="rule-master-name"
              size="md"
              value={masterModalProps.editor.editingRow?.name ?? ''}
              required
              controlState={masterModalProps.editor.editorErrors.name ? 'error' : ''}
              placeholder={masterModalProps.editor.isCreateMode ? '규칙명을 입력하세요' : ''}
              onChange={(event) => actions.changeMasterEditingField('name', event.target.value)}
            />
          </InputWrapper>
          <InputWrapper
            label="사용여부"
            inputId="rule-master-use-yn"
            required
            errorText={
              masterModalProps.editor.editorErrors.useYn
                ? '사용여부를 선택해주세요.'
                : undefined
            }
          >
            <SelectInput
              size="md"
              className="common-code-modal-form__select-input"
              value={masterModalProps.editor.editingRow?.useYn ?? 'Y'}
              options={[
                { value: 'Y', label: '사용 (Y)' },
                { value: 'N', label: '미사용 (N)' },
              ]}
              required
              isError={masterModalProps.editor.editorErrors.useYn}
              onChange={(value) => actions.changeMasterEditingField('useYn', value)}
            />
          </InputWrapper>
        </div>
      </WrapperModal>

      {/* 마스터 저장 확인 모달: 등록/수정은 문구만 다르고 흐름은 동일하다. */}
      {masterModalProps.saveConfirm.isCreateMode ? (
        <SaveConfirmModal
          open={masterModalProps.saveConfirm.open}
          title="저장하시겠습니까?"
          description="입력하신 내용을 저장합니다."
          primaryAction={{
            label: '확인',
            loading: masterModalProps.saveConfirm.isLoading,
            onClick: actions.confirmSaveMaster,
          }}
          secondaryAction={{
            disabled: masterModalProps.saveConfirm.isLoading,
            onClick: actions.closeMasterSaveConfirm,
          }}
          onClose={actions.closeMasterSaveConfirm}
        />
      ) : (
        <EditConfirmModal
          open={masterModalProps.saveConfirm.open}
          title="수정하시겠습니까?"
          description="변경된 내용이 저장됩니다."
          primaryAction={{
            label: '확인',
            loading: masterModalProps.saveConfirm.isLoading,
            onClick: actions.confirmSaveMaster,
          }}
          secondaryAction={{
            disabled: masterModalProps.saveConfirm.isLoading,
            onClick: actions.closeMasterSaveConfirm,
          }}
          onClose={actions.closeMasterSaveConfirm}
        />
      )}

      {/* 마스터 삭제 확인 */}
      <DeleteConfirmModal
        open={masterModalProps.deleteConfirm.open}
        title="삭제하시겠습니까?"
        description={
          masterModalProps.deleteConfirm.selectedDeleteCount > 1
            ? `선택한 ${masterModalProps.deleteConfirm.selectedDeleteCount}건의 항목을 삭제하면 복구할 수 없습니다.`
            : '선택한 항목을 삭제하면 복구할 수 없습니다.'
        }
        helperText="정말 삭제하시겠습니까?"
        primaryAction={{
          label: '확인',
          loading: masterModalProps.deleteConfirm.isLoading,
          onClick: actions.confirmDeleteMasters,
        }}
        secondaryAction={{
          disabled: masterModalProps.deleteConfirm.isLoading,
          onClick: actions.closeMasterDeleteConfirm,
        }}
        onClose={actions.closeMasterDeleteConfirm}
      />

      {/* 수정 중 닫기 시 dirty 경고 */}
      <SimpleDefaultModal
        open={masterModalProps.dirtyWarning.open}
        title="알림"
        description="페이지를 나가시겠습니까?"
        helperText="수정하신 내용이 저장되지 않았습니다."
        primaryAction={{ label: '확인', onClick: actions.forceCloseMasterEditorModal }}
        secondaryAction={{ onClick: actions.closeMasterDirtyWarning }}
        onClose={actions.closeMasterDirtyWarning}
      />

      {/* 마스터 저장/삭제 후 안내 */}
      <SimpleDefaultModal
        open={masterModalProps.notice.open}
        title={masterModalProps.notice.title}
        description={masterModalProps.notice.description}
        helperText={masterModalProps.notice.helperText}
        onClose={actions.closeMasterNotice}
      />

      {/* 상세 저장 후 안내 */}
      <SimpleDefaultModal
        open={detailModalProps.notice.open}
        title={detailModalProps.notice.title}
        description={detailModalProps.notice.description}
        primaryAction={
          detailModalProps.notice.hasConfirmAction
            ? { label: '확인', onClick: actions.confirmDetailNotice }
            : undefined
        }
        onClose={actions.closeDetailNotice}
      />

      {/* 상세 저장 확인 */}
      <SaveConfirmModal
        open={detailModalProps.saveConfirm.open}
        title="저장하시겠습니까?"
        description="입력하신 내용을 저장합니다."
        primaryAction={{
          label: '확인',
          loading: detailModalProps.saveConfirm.isLoading,
          onClick: actions.confirmSaveDetailRows,
        }}
        secondaryAction={{
          disabled: detailModalProps.saveConfirm.isLoading,
          onClick: actions.closeDetailSaveConfirm,
        }}
        onClose={actions.closeDetailSaveConfirm}
      />
    </>
  );
}
