import { Button } from '@/shared/components/button';
import { CheckboxInput } from '@/shared/components/checkbox';
import { FeedbackState } from '@/shared/components/feedback';
import { InputBase, InputWrapper, SelectInput } from '@/shared/components/input';
import {
  DeleteConfirmModal,
  EditConfirmModal,
  SaveConfirmModal,
  SimpleDefaultModal,
} from '@/shared/components/modal';
import { WrapperModal } from '@/shared/components/modal/wrapper/WrapperModal';
import { TableCard } from '@/shared/components/table';
import { Icon } from '@/shared/assets/icons/Icon';
import { useCodeMasterModalFlow } from '@/shared/hooks/useCodeMasterModalFlow';
import type { RuleMasterRow } from '../types';

/**
 * 규칙 마스터 테이블 Props.
 *
 * @description
 * - 목록 표시와 선택/체크 상태는 상위 훅이 소유한다.
 * - 이 컴포넌트는 렌더링 + 사용자 이벤트 전달만 담당한다.
 */
type RuleMasterTableProps = {
  rows: RuleMasterRow[];
  isLoading: boolean;
  isError: boolean;
  selectedMasterId: string;
  checkedMasterIds: string[];
  isAllChecked: boolean;
  onSelectRow: (masterId: string) => void;
  onToggleRow: (masterId: string) => void;
  onToggleAllRows: () => void;
  onSaveMaster: (row: RuleMasterRow, isCreateMode: boolean) => Promise<void>;
  onDeleteMasters: () => Promise<number>;
};

/**
 * 규칙 관리의 마스터(상단) 테이블.
 *
 * @description
 * - 신규/수정/삭제 모달 플로우는 useCodeMasterModalFlow에 위임한다.
 * - 행 선택은 상세 테이블과 연동되므로 클릭 이벤트를 상위로 전달한다.
 */
export function RuleMasterTable({
  rows,
  isLoading,
  isError,
  selectedMasterId,
  checkedMasterIds,
  isAllChecked,
  onSelectRow,
  onToggleRow,
  onToggleAllRows,
  onSaveMaster,
  onDeleteMasters,
}: RuleMasterTableProps) {
  /**
   * 공통 코드 마스터용 플로우 훅을 재사용해
   * 규칙 마스터의 저장/삭제/알림 모달 상태를 관리한다.
   */
  const {
    editingRow,
    isCreateMode,
    isCodeReadonly,
    isDirty,
    isEditorOpen,
    isSaveConfirmOpen,
    isDeleteConfirmOpen,
    isDirtyWarningOpen,
    isConfirming,
    isConfirmingDelete,
    selectedDeleteCount,
    editorErrors,
    noticeState,
    openCreateModal,
    openEditModal,
    closeEditorModal,
    forceCloseEditorModal,
    changeEditingField,
    requestSave,
    confirmSave,
    requestDelete,
    confirmDelete,
    closeSaveConfirm,
    closeDeleteConfirm,
    closeDirtyWarning,
    closeNotice,
  } = useCodeMasterModalFlow({
    checkedRowIds: checkedMasterIds,
    createEmptyRow: (): RuleMasterRow => ({ id: '', code: '', name: '', useYn: 'Y' }),
    onSaveRow: onSaveMaster,
    onDeleteRows: onDeleteMasters,
  });

  return (
    <>
      <TableCard
        title="규칙 목록"
        ariaLabel="규칙 목록"
        actions={
          <>
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Icon id="i-plus" size={13} />}
              onClick={openCreateModal}
            >
              신규
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={requestDelete}>
              삭제
            </Button>
          </>
        }
      >
        {isLoading ? (
          <FeedbackState variant="loading" title="규칙 목록을 불러오는 중입니다." />
        ) : isError ? (
          <FeedbackState variant="error" description="다시 한번 시도해주세요." />
        ) : (
          <div className="common-table-wrap">
            <table className="common-table" aria-label="규칙 목록 테이블">
              <colgroup>
                <col style={{ width: '3rem' }} />
                <col />
                <col />
                <col style={{ width: '8rem' }} />
                <col style={{ width: '4rem' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>
                    <CheckboxInput
                      checked={isAllChecked}
                      onChange={onToggleAllRows}
                      aria-label="규칙 목록 전체 선택"
                      size="sm"
                      className="common-table__checkbox"
                    />
                  </th>
                  <th className="common-table__cell--left">규칙코드</th>
                  <th className="common-table__cell--left">규칙명</th>
                  <th>사용여부</th>
                  <th aria-label="수정" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isSelected = selectedMasterId === row.id;
                  const isChecked = checkedMasterIds.includes(row.id);

                  return (
                    <tr
                      key={row.id}
                      className={isSelected ? 'is-selected' : undefined}
                      onClick={() => onSelectRow(row.id)}
                    >
                      <td>
                        <CheckboxInput
                          checked={isChecked}
                          onChange={() => onToggleRow(row.id)}
                          aria-label={`${row.code} 선택`}
                          size="sm"
                          className="common-table__checkbox"
                        />
                      </td>
                      <td className="common-table__mono common-table__cell--left">{row.code}</td>
                      <td className="common-table__cell--left">{row.name}</td>
                      <td>
                        <span
                          className={`status-badge ${row.useYn === 'Y' ? 'status-badge--yes' : 'status-badge--no'}`}
                        >
                          {row.useYn}
                        </span>
                      </td>
                      <td>
                        <Button
                          type="button"
                          variant="icon"
                          size="sm"
                          iconOnly={<Icon id="i-modal-pencil" size={12} />}
                          aria-label={`${row.code} 수정`}
                          onClick={(event) => {
                            event.stopPropagation();
                            openEditModal(row);
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      <WrapperModal
        size="md"
        open={isEditorOpen}
        isDirty={isDirty}
        title="규칙 수정/등록"
        subtitle="규칙 정보를 입력하세요."
        primaryAction={{ label: '확인', onClick: requestSave }}
        secondaryAction={{ label: '닫기', onClick: closeEditorModal }}
        onClose={closeEditorModal}
      >
        <div className="common-code-modal-form">
          <InputWrapper
            label="규칙코드"
            inputId="rule-master-code"
            required
            errorText={editorErrors.code ? '규칙코드를 채워주세요.' : undefined}
          >
            <InputBase
              id="rule-master-code"
              size="md"
              value={editingRow?.code ?? ''}
              readOnly={isCodeReadonly}
              required
              controlState={editorErrors.code ? 'error' : isCodeReadonly ? 'readonly' : ''}
              placeholder={isCreateMode ? '규칙코드를 입력하세요' : ''}
              onChange={(event) => changeEditingField('code', event.target.value)}
            />
          </InputWrapper>
          <InputWrapper
            label="규칙명"
            inputId="rule-master-name"
            required
            errorText={editorErrors.name ? '규칙명을 채워주세요.' : undefined}
          >
            <InputBase
              id="rule-master-name"
              size="md"
              value={editingRow?.name ?? ''}
              required
              controlState={editorErrors.name ? 'error' : ''}
              placeholder={isCreateMode ? '규칙명을 입력하세요' : ''}
              onChange={(event) => changeEditingField('name', event.target.value)}
            />
          </InputWrapper>
          <InputWrapper
            label="사용여부"
            inputId="rule-master-use-yn"
            required
            errorText={editorErrors.useYn ? '사용여부를 선택해주세요.' : undefined}
          >
            <SelectInput
              size="md"
              className="common-code-modal-form__select-input"
              value={editingRow?.useYn ?? 'Y'}
              options={[
                { value: 'Y', label: '사용 (Y)' },
                { value: 'N', label: '미사용 (N)' },
              ]}
              required
              isError={editorErrors.useYn}
              onChange={(value) => changeEditingField('useYn', value)}
            />
          </InputWrapper>
        </div>
      </WrapperModal>

      {isCreateMode ? (
        <SaveConfirmModal
          open={isSaveConfirmOpen}
          title="저장하시겠습니까?"
          description="작성된 내용을 저장합니다."
          primaryAction={{ label: '확인', loading: isConfirming, onClick: confirmSave }}
          secondaryAction={{ disabled: isConfirming, onClick: closeSaveConfirm }}
          onClose={closeSaveConfirm}
        />
      ) : (
        <EditConfirmModal
          open={isSaveConfirmOpen}
          title="수정된 내용을 저장하시겠습니까?"
          description="변경된 내용이 저장됩니다."
          primaryAction={{ label: '확인', loading: isConfirming, onClick: confirmSave }}
          secondaryAction={{ disabled: isConfirming, onClick: closeSaveConfirm }}
          onClose={closeSaveConfirm}
        />
      )}

      <DeleteConfirmModal
        open={isDeleteConfirmOpen}
        title="삭제하시겠습니까?"
        description={
          selectedDeleteCount > 1
            ? `선택한 ${selectedDeleteCount}건의 항목을 삭제하면 복구할 수 없습니다.`
            : '선택한 항목을 삭제하면 복구할 수 없습니다.'
        }
        helperText="정말 삭제하시겠습니까?"
        primaryAction={{ label: '확인', loading: isConfirmingDelete, onClick: confirmDelete }}
        secondaryAction={{ disabled: isConfirmingDelete, onClick: closeDeleteConfirm }}
        onClose={closeDeleteConfirm}
      />

      <SimpleDefaultModal
        open={isDirtyWarningOpen}
        title="알림"
        description="페이지를 나가시겠습니까?"
        helperText="수정하신 내용이 저장되지 않았습니다."
        primaryAction={{ label: '확인', onClick: forceCloseEditorModal }}
        secondaryAction={{ onClick: closeDirtyWarning }}
        onClose={closeDirtyWarning}
      />

      <SimpleDefaultModal
        open={!!noticeState}
        title={noticeState?.title ?? '알림'}
        description={noticeState?.description}
        helperText={noticeState?.helperText}
        onClose={closeNotice}
      />
    </>
  );
}
