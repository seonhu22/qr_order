/**
 * @fileoverview 공통코드 관리 페이지 컨테이너
 *
 * @description
 * - 화면 레이아웃과 feature 컴포넌트를 조립하는 역할만 맡는다.
 * - 실제 상태 조합과 서버 연동은 useCommonCodePageState로 위임한다.
 */

import AdminMainLayout from '@/apps/admin/layout/AdminMainLayout';
import '@/apps/admin/pages/CommonCodePage.css';
import { CommonCodeDetailTable } from '@/apps/admin/features/common-code/components/CommonCodeDetailTable';
import { CommonCodeFilters } from '@/apps/admin/features/common-code/components/CommonCodeFilters';
import { CommonCodeMasterTable } from '@/apps/admin/features/common-code/components/CommonCodeMasterTable';
import { useCommonCodePageState } from '@/apps/admin/features/common-code/hooks/useCommonCodePageState';
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
 * 공통코드 관리 페이지를 렌더링한다.
 *
 * @description
 * page-level orchestration 구조를 따르며,
 * - 훅에서 data/status/actions/uiProps를 받고
 * - 테이블과 필터를 배치하고
 * - 실제 모달은 이 페이지에서 한 번에 조립한다.
 */
export const CommonCodePage = () => {
  const { data, status, actions, uiProps } = useCommonCodePageState();
  const masterModalProps = uiProps.masterModalProps;
  const detailModalProps = uiProps.detailModalProps;

  return (
    <>
      <AdminMainLayout
        adminMainTitle="공통코드 관리"
        depth1="시스템"
        depth2="시스템 관리"
        className="admin-main-layout-page--fixed"
        filterSlot={
          /* filterSlot에는 입력 UI만 두고, 실제 조회/초기화 흐름은 page hook action을 연결한다. */
          <CommonCodeFilters
            draftKeyword={uiProps.draftMasterKeyword}
            onKeywordChange={actions.handleMasterKeywordChange}
            onSearch={actions.handleSearch}
            onReset={actions.handleReset}
          />
        }
      >
        <CommonCodeMasterTable
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

        <CommonCodeDetailTable
          selectedMaster={data.selectedMaster}
          isLoading={status.isLoadingDetails}
          rows={data.detailRows}
          onFieldChange={actions.handleChangeDetailField}
          onUseYnChange={actions.handleChangeDetailUseYn}
          onAddRow={actions.handleAddDetailRow}
          onDeleteRows={actions.handleDeleteDetailRow}
          onMoveUp={actions.handleMoveDetailRowUp}
          onMoveDown={actions.handleMoveDetailRowDown}
          isSaving={status.isSavingDetails}
          rowErrors={uiProps.detailRowErrors}
          onClearRowError={actions.clearDetailRowError}
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

      <WrapperModal
        size="md"
        open={masterModalProps.editor.open}
        isDirty={masterModalProps.editor.isDirty}
        title={masterModalProps.editor.isCreateMode ? '공통코드 마스터 등록' : '공통코드 마스터 수정'}
        subtitle="공통코드 정보를 입력하세요."
        primaryAction={{ label: '확인', onClick: actions.requestSaveMaster }}
        secondaryAction={{ label: '닫기', onClick: actions.closeMasterEditorModal }}
        onClose={actions.closeMasterEditorModal}
      >
        <div className="common-code-modal-form">
          <InputWrapper
            label="공통코드"
            inputId="common-master-code"
            required
            errorText={
              masterModalProps.editor.editorErrors.code ? '공통코드를 채워주세요.' : undefined
            }
          >
            <InputBase
              id="common-master-code"
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
              placeholder={masterModalProps.editor.isCreateMode ? '공통코드를 입력하세요' : ''}
              onChange={(event) => actions.changeMasterEditingField('code', event.target.value)}
            />
          </InputWrapper>
          <InputWrapper
            label="공통코드명"
            inputId="common-master-name"
            required
            errorText={
              masterModalProps.editor.editorErrors.name ? '공통코드명을 채워주세요.' : undefined
            }
          >
            <InputBase
              id="common-master-name"
              size="md"
              value={masterModalProps.editor.editingRow?.name ?? ''}
              required
              controlState={masterModalProps.editor.editorErrors.name ? 'error' : ''}
              placeholder={masterModalProps.editor.isCreateMode ? '공통코드명을 입력하세요' : ''}
              onChange={(event) => actions.changeMasterEditingField('name', event.target.value)}
            />
          </InputWrapper>
          <InputWrapper
            label="사용여부"
            inputId="common-master-use-yn"
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

      {masterModalProps.saveConfirm.isCreateMode ? (
        <SaveConfirmModal
          open={masterModalProps.saveConfirm.open}
          title="저장하시겠습니까?"
          description="작성된 내용을 저장합니다."
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
          title="수정된 내용을 저장하시겠습니까?"
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

      <SimpleDefaultModal
        open={masterModalProps.dirtyWarning.open}
        title="알림"
        description="페이지를 나가시겠습니까?"
        helperText="수정하신 내용이 저장되지 않았습니다."
        primaryAction={{ label: '확인', onClick: actions.forceCloseMasterEditorModal }}
        secondaryAction={{ onClick: actions.closeMasterDirtyWarning }}
        onClose={actions.closeMasterDirtyWarning}
      />

      <SimpleDefaultModal
        open={masterModalProps.notice.open}
        title={masterModalProps.notice.title}
        description={masterModalProps.notice.description}
        helperText={masterModalProps.notice.helperText}
        onClose={actions.closeMasterNotice}
      />

      <SimpleDefaultModal
        open={detailModalProps.notice.open}
        title={detailModalProps.notice.title}
        description={detailModalProps.notice.description}
        onClose={actions.closeDetailNotice}
      />

      <SaveConfirmModal
        open={detailModalProps.saveConfirm.open}
        title="저장하시겠습니까?"
        description="작성된 공통코드 상세를 저장하시겠습니까?"
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
};
