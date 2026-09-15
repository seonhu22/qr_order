/**
 * @fileoverview 매장 > 메뉴 관리 > 옵션 관리 페이지
 *
 * @description
 * - 마스터(메뉴 목록, 좌) 1단 + 디테일(옵션 그룹/옵션 항목, 우) 2단 세로 스택 레이아웃
 * - 화면 조립 역할만 담당한다. 실제 상태 계산과 UX 플로우는 `useMenuOptionManagementPage`에서 처리한다.
 */

import './MenuOptionManagementPage.css';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';
import { InputBase, InputWrapper, SelectInput, TextareaInput } from '@/shared/components/input';
import { CheckboxInput } from '@/shared/components/checkbox';
import { FileHint, FileInputGroup } from '@/shared/components/file-attachment';
import {
  ConfirmModal,
  EditConfirmModal,
  SaveConfirmModal,
  SimpleDefaultModal,
  WrapperModal,
} from '@/shared/components/modal';
import { MenuOptionDetailTable } from '@/apps/client/features/menu-option/components/MenuOptionDetailTable';
import { MenuOptionGroupTable } from '@/apps/client/features/menu-option/components/MenuOptionGroupTable';
import { MenuOptionMasterTable } from '@/apps/client/features/menu-option/components/MenuOptionMasterTable';
import { USE_YN_OPTIONS } from '@/apps/client/features/menu-option/api/menuOptionApi';
import {
  MENU_OPTION_DETAIL_FILE_POLICY,
  OPTION_SELECTION_TYPE,
} from '@/apps/client/features/menu-option/constants';
import { useMenuOptionManagementPage } from '@/apps/client/features/menu-option/hooks/useMenuOptionManagementPage';

function formatOptionPriceDisplay(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '');
  return digits ? Number(digits).toLocaleString('ko-KR') : '';
}

export function MenuOptionManagementPage() {
  const { data, status, actions, uiProps } = useMenuOptionManagementPage();
  const isQuantityGroup =
    data.selectedGroupRow?.values.inputType === OPTION_SELECTION_TYPE.QUANTITY;

  return (
    <>
      <section className="menu-option-page" aria-label="옵션 관리">
        <SearchFilterCard
          ariaLabel="메뉴 검색"
          inputId="menu-option-search-keyword"
          inputAriaLabel="메뉴 검색어"
          placeholder="메뉴명으로 검색"
          draftKeyword={uiProps.draftKeyword}
          onKeywordChange={actions.handleKeywordChange}
          onSearch={actions.handleSearch}
          onReset={actions.handleReset}
        />

        <div className="menu-option-page__layout">
          <MenuOptionMasterTable
            rows={data.masterRows}
            isLoading={status.isLoadingMasters}
            isError={status.isErrorMasters}
            selectedId={uiProps.selectedMasterId}
            onSelectRow={actions.handleSelectMaster}
          />

          <div className="menu-option-page__detail-stack">
            <MenuOptionGroupTable
              selectedMaster={data.selectedMaster}
              isLoading={status.isLoadingGroups}
              isSaving={status.isSavingGroups}
              columns={data.groupColumns}
              rows={data.groupRows}
              rowErrors={uiProps.groupRowErrors}
              selectedGroupId={uiProps.selectedGroupId}
              onSelectGroup={actions.handleSelectGroup}
              onChangeValue={actions.handleChangeGroupValue}
              onClearRowError={actions.clearGroupRowError}
              onAddRow={actions.handleAddGroupRow}
              onDeleteRow={actions.handleDeleteGroupRow}
              onMoveUp={actions.handleMoveGroupRowUp}
              onMoveDown={actions.handleMoveGroupRowDown}
              onSave={actions.requestSaveGroupRows}
            />

            <MenuOptionDetailTable
              selectedGroup={data.selectedGroupRow}
              isLoading={status.isLoadingDetails}
              isSaving={status.isSavingDetails}
              columns={data.detailColumns}
              rows={data.detailRows}
              rowErrors={uiProps.detailRowErrors}
              onChangeValue={actions.handleChangeDetailValue}
              onClearRowError={actions.clearDetailRowError}
              onAddRow={actions.handleAddDetailRow}
              onDeleteRow={actions.handleDeleteDetailRow}
              onMoveUp={actions.handleMoveDetailRowUp}
              onMoveDown={actions.handleMoveDetailRowDown}
              onEditRow={actions.handleEditDetailRow}
              onSave={actions.requestSaveDetailRows}
            />
          </div>
        </div>
      </section>

      <ConfirmModal
        open={uiProps.pendingFilterAction !== null}
        tone="info"
        title={uiProps.pendingFilterAction === 'reset' ? '초기화하시겠습니까?' : '조회하시겠습니까?'}
        description="저장되지 않은 내용이 있습니다."
        onClose={actions.cancelFilterAction}
        primaryAction={{ onClick: actions.confirmFilterAction }}
        secondaryAction={{ onClick: actions.cancelFilterAction }}
      />

      {/* 옵션 그룹 옵션/수량 변경 — 이미 등록된 옵션 항목이 있으면 확인 받음 */}
      <ConfirmModal
        open={uiProps.isGroupInputTypeChangeConfirmOpen}
        tone="info"
        title="옵션/수량을 변경하시겠습니까?"
        description="이미 등록된 옵션 항목이 있습니다. 변경하면 옵션 항목의 입력 컬럼이 바뀌고, 수량 설정 값은 초기화됩니다."
        onClose={actions.cancelGroupInputTypeChange}
        primaryAction={{ onClick: actions.confirmGroupInputTypeChange }}
        secondaryAction={{ onClick: actions.cancelGroupInputTypeChange }}
      />

      {/* 옵션 항목 행추가/그룹 저장이 막혔을 때 공통 안내 */}
      <SimpleDefaultModal
        open={uiProps.blockedActionNoticeMessage !== null}
        title="알림"
        description={uiProps.blockedActionNoticeMessage ?? undefined}
        onClose={actions.closeBlockedActionNotice}
      />

      {/* 옵션 그룹 저장 확인 */}
      <SaveConfirmModal
        open={uiProps.groupSaveConfirm.open}
        title="저장하시겠습니까?"
        description="입력하신 내용을 저장합니다."
        primaryAction={{
          label: '확인',
          loading: uiProps.groupSaveConfirm.isLoading,
          onClick: actions.confirmSaveGroupRows,
        }}
        secondaryAction={{
          disabled: uiProps.groupSaveConfirm.isLoading,
          onClick: actions.closeGroupSaveConfirm,
        }}
        onClose={actions.closeGroupSaveConfirm}
      />

      {/* 옵션 그룹 저장 후 안내 */}
      <SimpleDefaultModal
        open={uiProps.groupNotice.open}
        title={uiProps.groupNotice.title}
        description={uiProps.groupNotice.description}
        primaryAction={
          uiProps.groupNotice.hasConfirmAction
            ? { label: '확인', onClick: actions.confirmGroupNotice }
            : undefined
        }
        onClose={actions.closeGroupNotice}
      />

      {/* 옵션 항목 저장 확인 */}
      <SaveConfirmModal
        open={uiProps.detailSaveConfirm.open}
        title="저장하시겠습니까?"
        description="입력하신 내용을 저장합니다."
        primaryAction={{
          label: '확인',
          loading: uiProps.detailSaveConfirm.isLoading,
          onClick: actions.confirmSaveDetailRows,
        }}
        secondaryAction={{
          disabled: uiProps.detailSaveConfirm.isLoading,
          onClick: actions.closeDetailSaveConfirm,
        }}
        onClose={actions.closeDetailSaveConfirm}
      />

      {/* 옵션 항목 저장 후 안내 */}
      <SimpleDefaultModal
        open={uiProps.detailNotice.open}
        title={uiProps.detailNotice.title}
        description={uiProps.detailNotice.description}
        primaryAction={
          uiProps.detailNotice.hasConfirmAction
            ? { label: '확인', onClick: actions.confirmDetailNotice }
            : undefined
        }
        onClose={actions.closeDetailNotice}
      />

      {/* 옵션 항목 "수정" 추가 상세설정 모달 */}
      <WrapperModal
        size="md"
        open={uiProps.editingOptionDetailRow !== null}
        isDirty={uiProps.isOptionDetailEditorDirty}
        title="옵션 항목 상세설정"
        subtitle={uiProps.editingOptionDetailRow?.values.menuOptionName}
        primaryAction={{ label: '확인', onClick: actions.requestConfirmOptionDetailEditor }}
        secondaryAction={{ label: '닫기', onClick: actions.requestCloseOptionDetailEditor }}
        onClose={actions.requestCloseOptionDetailEditor}
      >
        {uiProps.editingOptionDetailRow && (
          <div className="common-code-modal-form">
            <InputWrapper label="옵션명" inputId="menu-option-detail-name" required>
              <InputBase
                id="menu-option-detail-name"
                size="md"
                value={uiProps.editingOptionDetailRow.values.menuOptionName ?? ''}
                required
                placeholder="옵션명을 입력하세요"
                onChange={(event) =>
                  actions.handleChangeDetailValue(
                    uiProps.editingOptionDetailRow!.id,
                    'menuOptionName',
                    event.target.value,
                  )
                }
              />
            </InputWrapper>

            <InputWrapper label="옵션 가격" inputId="menu-option-detail-price" required>
              <InputBase
                id="menu-option-detail-price"
                size="md"
                inputMode="numeric"
                required
                value={formatOptionPriceDisplay(
                  uiProps.editingOptionDetailRow.values.menuOptionPrice ?? '',
                )}
                placeholder="가격을 입력하세요"
                onChange={(event) =>
                  actions.handleChangeDetailValue(
                    uiProps.editingOptionDetailRow!.id,
                    'menuOptionPrice',
                    event.target.value.replace(/\D/g, ''),
                  )
                }
              />
            </InputWrapper>

            {isQuantityGroup && (
              <InputWrapper label="수량 설정" inputId="menu-option-detail-max-num" required>
                <InputBase
                  id="menu-option-detail-max-num"
                  size="md"
                  inputMode="numeric"
                  required
                  value={uiProps.editingOptionDetailRow.values.maximumNum ?? ''}
                  placeholder="수량을 입력하세요"
                  onChange={(event) =>
                    actions.handleChangeDetailValue(
                      uiProps.editingOptionDetailRow!.id,
                      'maximumNum',
                      event.target.value.replace(/\D/g, ''),
                    )
                  }
                />
              </InputWrapper>
            )}

            <TextareaInput
              label="옵션 설명"
              id="menu-option-detail-description"
              value={uiProps.editingOptionDetailRow.values.menuDescription ?? ''}
              rows={4}
              placeholder="옵션 설명을 입력하세요"
              onChange={(event) =>
                actions.handleChangeDetailValue(
                  uiProps.editingOptionDetailRow!.id,
                  'menuDescription',
                  event.target.value,
                )
              }
            />

            <InputWrapper label="기본 선택 사용여부" inputId="menu-option-detail-default-yn" required>
              <CheckboxInput
                size="sm"
                checked={Boolean(uiProps.editingOptionDetailRow.values.defaultYn)}
                onChange={(checked) =>
                  actions.handleChangeDetailValue(
                    uiProps.editingOptionDetailRow!.id,
                    'defaultYn',
                    checked,
                  )
                }
              />
            </InputWrapper>

            <SelectInput
              label="사용 여부"
              size="md"
              required
              value={uiProps.editingOptionDetailRow.values.useYn ?? 'Y'}
              options={USE_YN_OPTIONS}
              onChange={(value) =>
                actions.handleChangeDetailValue(uiProps.editingOptionDetailRow!.id, 'useYn', value)
              }
            />

            <InputWrapper label="첨부파일" inputId="menu-option-detail-file">
              <FileInputGroup
                variant="button"
                files={uiProps.optionDetailAttachFiles}
                onChange={actions.changeOptionDetailFileState}
                maxFiles={MENU_OPTION_DETAIL_FILE_POLICY.maxFiles}
                maxFileSizeMB={MENU_OPTION_DETAIL_FILE_POLICY.maxFileSizeMB}
                maxTotalSizeMB={MENU_OPTION_DETAIL_FILE_POLICY.maxTotalSizeMB}
                allowedExtensions={MENU_OPTION_DETAIL_FILE_POLICY.allowedExtensions}
                hint={
                  <FileHint
                    variant="simple"
                    maxSize={`${MENU_OPTION_DETAIL_FILE_POLICY.maxFileSizeMB}MB`}
                    maxCount={MENU_OPTION_DETAIL_FILE_POLICY.maxFiles}
                    allowedExts={MENU_OPTION_DETAIL_FILE_POLICY.allowedExtensions.map((ext) =>
                      ext.toUpperCase(),
                    )}
                  />
                }
              />
            </InputWrapper>
          </div>
        )}
      </WrapperModal>

      {/* 옵션 항목 상세설정 모달 "확인" 클릭 시 변경 확인 */}
      <EditConfirmModal
        open={uiProps.isOptionDetailEditConfirmOpen}
        title="수정하시겠습니까?"
        description="변경된 내용이 옵션 항목 행에 반영됩니다."
        primaryAction={{
          label: '확인',
          loading: uiProps.isOptionDetailEditConfirming,
          onClick: actions.confirmOptionDetailEditor,
        }}
        secondaryAction={{
          disabled: uiProps.isOptionDetailEditConfirming,
          onClick: actions.closeOptionDetailEditorConfirm,
        }}
        onClose={actions.closeOptionDetailEditorConfirm}
      />

      {/* 옵션 항목 상세설정 모달 저장 후 안내 */}
      <SimpleDefaultModal
        open={uiProps.optionDetailEditorNotice !== null}
        title={uiProps.optionDetailEditorNotice?.title ?? '알림'}
        description={uiProps.optionDetailEditorNotice?.description}
        onClose={actions.closeOptionDetailEditorNotice}
      />

      {/* 옵션 항목 상세설정 모달 닫기 시 dirty 경고 */}
      <SimpleDefaultModal
        open={uiProps.isOptionDetailEditorDirtyWarningOpen}
        title="알림"
        description="페이지를 나가시겠습니까?"
        helperText="수정하신 내용이 저장되지 않았습니다."
        primaryAction={{ label: '확인', onClick: actions.forceCloseOptionDetailEditor }}
        secondaryAction={{ onClick: actions.closeOptionDetailEditorDirtyWarning }}
        onClose={actions.closeOptionDetailEditorDirtyWarning}
      />
    </>
  );
}
