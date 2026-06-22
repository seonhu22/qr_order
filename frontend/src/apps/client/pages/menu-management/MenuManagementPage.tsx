/**
 * @fileoverview 매장 > 메뉴 관리 > 메뉴/카테고리 관리 페이지
 *
 * @description
 * - 좌우 분할 레이아웃: 마스터(카테고리 목록) 좌측, 디테일(메뉴 관리) 우측
 * - 화면 조립 역할만 담당한다. 실제 상태 계산과 UX 플로우는 `useMenuManagementPage`에서 처리한다.
 */

import './MenuManagementPage.css';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';
import { InputBase, InputWrapper, SelectInput, TextareaInput } from '@/shared/components/input';
import { FileHint, FileInputGroup } from '@/shared/components/file-attachment';
import {
  ConfirmModal,
  DeleteConfirmModal,
  EditConfirmModal,
  SaveConfirmModal,
  SimpleDefaultModal,
  WrapperModal,
} from '@/shared/components/modal';
import { MenuCategoryMasterTable } from '@/apps/client/features/menu-management/components/MenuCategoryMasterTable';
import { MenuDetailTable } from '@/apps/client/features/menu-management/components/MenuDetailTable';
import { USE_YN_OPTIONS } from '@/apps/client/features/menu-management/api/menuManagementApi';
import { MENU_DETAIL_FILE_POLICY } from '@/apps/client/features/menu-management/constants';
import { useMenuManagementPage } from '@/apps/client/features/menu-management/hooks/useMenuManagementPage';

function formatMenuPriceDisplay(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '');
  return digits ? Number(digits).toLocaleString('ko-KR') : '';
}

export function MenuManagementPage() {
  const { data, status, actions, uiProps } = useMenuManagementPage();
  const categoryModalProps = uiProps.categoryModalProps;
  const detailModalProps = uiProps.detailModalProps;

  return (
    <>
      <section className="menu-management-page" aria-label="메뉴 관리">
        <SearchFilterCard
          ariaLabel="카테고리 검색"
          inputId="menu-management-search-keyword"
          inputAriaLabel="카테고리 검색어"
          placeholder="카테고리명으로 검색"
          draftKeyword={uiProps.draftKeyword}
          onKeywordChange={actions.handleKeywordChange}
          onSearch={actions.handleSearch}
          onReset={actions.handleReset}
        />

        <div className="menu-management-page__layout">
          <MenuCategoryMasterTable
            rows={data.categoryRows}
            isLoading={status.isLoadingCategories}
            isError={status.isErrorCategories}
            selectedId={uiProps.selectedCategoryId}
            checkedIds={uiProps.checkedCategoryIds}
            isAllChecked={uiProps.isAllCategoriesChecked}
            onSelectRow={actions.handleSelectCategory}
            onToggleRow={actions.handleToggleCategory}
            onToggleAllRows={actions.handleToggleAllCategories}
            onCreate={actions.openCreateCategoryModal}
            onEdit={actions.openEditCategoryModal}
            onDelete={actions.requestDeleteCategories}
          />

          <MenuDetailTable
            key={data.selectedCategory?.id ?? 'menu-detail-empty'}
            selectedCategory={data.selectedCategory}
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
            onEditRow={actions.handleEditDetailRow}
            onSave={actions.requestSaveDetailRows}
          />
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

      {/* 카테고리 등록/수정 모달 */}
      <WrapperModal
        size="md"
        open={categoryModalProps.editor.open}
        isDirty={categoryModalProps.editor.isDirty}
        title={categoryModalProps.editor.isCreateMode ? '카테고리 등록' : '카테고리 수정'}
        subtitle="카테고리 정보를 입력하세요."
        primaryAction={{ label: '확인', onClick: actions.requestSaveCategory }}
        secondaryAction={{ label: '닫기', onClick: actions.closeCategoryEditorModal }}
        onClose={actions.closeCategoryEditorModal}
      >
        <div className="common-code-modal-form">
          <InputWrapper
            label="카테고리명"
            inputId="menu-category-name"
            required
            errorText={
              categoryModalProps.editor.editorErrors.name ? '카테고리명을 채워주세요.' : undefined
            }
          >
            <InputBase
              id="menu-category-name"
              size="md"
              value={categoryModalProps.editor.editingRow?.name ?? ''}
              required
              controlState={categoryModalProps.editor.editorErrors.name ? 'error' : ''}
              placeholder="카테고리명을 입력하세요"
              onChange={(event) => actions.changeCategoryEditingField('name', event.target.value)}
            />
          </InputWrapper>
          <InputWrapper
            label="사용여부"
            inputId="menu-category-use-yn"
            required
            errorText={
              categoryModalProps.editor.editorErrors.useYn ? '사용여부를 선택해주세요.' : undefined
            }
          >
            <SelectInput
              size="md"
              className="common-code-modal-form__select-input"
              value={categoryModalProps.editor.editingRow?.useYn ?? 'Y'}
              options={USE_YN_OPTIONS}
              required
              isError={categoryModalProps.editor.editorErrors.useYn}
              onChange={(value) => actions.changeCategoryEditingField('useYn', value)}
            />
          </InputWrapper>
        </div>
      </WrapperModal>

      {/* 카테고리 저장 확인 모달 */}
      {categoryModalProps.saveConfirm.isCreateMode ? (
        <SaveConfirmModal
          open={categoryModalProps.saveConfirm.open}
          title="저장하시겠습니까?"
          description="입력하신 내용을 저장합니다."
          primaryAction={{
            label: '확인',
            loading: categoryModalProps.saveConfirm.isLoading,
            onClick: actions.confirmSaveCategory,
          }}
          secondaryAction={{
            disabled: categoryModalProps.saveConfirm.isLoading,
            onClick: actions.closeCategorySaveConfirm,
          }}
          onClose={actions.closeCategorySaveConfirm}
        />
      ) : (
        <EditConfirmModal
          open={categoryModalProps.saveConfirm.open}
          title="수정하시겠습니까?"
          description="변경된 내용이 저장됩니다."
          primaryAction={{
            label: '확인',
            loading: categoryModalProps.saveConfirm.isLoading,
            onClick: actions.confirmSaveCategory,
          }}
          secondaryAction={{
            disabled: categoryModalProps.saveConfirm.isLoading,
            onClick: actions.closeCategorySaveConfirm,
          }}
          onClose={actions.closeCategorySaveConfirm}
        />
      )}

      {/* 카테고리 삭제 확인 모달 */}
      <DeleteConfirmModal
        open={categoryModalProps.deleteConfirm.open}
        title="삭제하시겠습니까?"
        description={
          categoryModalProps.deleteConfirm.selectedDeleteCount > 1
            ? `선택한 ${categoryModalProps.deleteConfirm.selectedDeleteCount}건의 항목을 삭제하면 복구할 수 없습니다.`
            : '선택한 항목을 삭제하면 복구할 수 없습니다.'
        }
        helperText="정말 삭제하시겠습니까?"
        primaryAction={{
          label: '확인',
          loading: categoryModalProps.deleteConfirm.isLoading,
          onClick: actions.confirmDeleteCategories,
        }}
        secondaryAction={{
          disabled: categoryModalProps.deleteConfirm.isLoading,
          onClick: actions.closeCategoryDeleteConfirm,
        }}
        onClose={actions.closeCategoryDeleteConfirm}
      />

      {/* 카테고리 수정 중 닫기 시 dirty 경고 */}
      <SimpleDefaultModal
        open={categoryModalProps.dirtyWarning.open}
        title="알림"
        description="페이지를 나가시겠습니까?"
        helperText="수정하신 내용이 저장되지 않았습니다."
        primaryAction={{ label: '확인', onClick: actions.forceCloseCategoryEditorModal }}
        secondaryAction={{ onClick: actions.closeCategoryDirtyWarning }}
        onClose={actions.closeCategoryDirtyWarning}
      />

      {/* 카테고리 저장/삭제 후 안내 */}
      <SimpleDefaultModal
        open={categoryModalProps.notice.open}
        title={categoryModalProps.notice.title}
        description={categoryModalProps.notice.description}
        helperText={categoryModalProps.notice.helperText}
        onClose={actions.closeCategoryNotice}
      />

      {/* 메뉴 상세 저장 확인 */}
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

      {/* 메뉴 상세 저장 후 안내 */}
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

      {/* 메뉴 행 "수정" 추가 상세설정 모달 */}
      <WrapperModal
        size="md"
        open={uiProps.editingDetailRow !== null}
        isDirty={uiProps.isDetailEditorDirty}
        title="메뉴 상세설정"
        subtitle={uiProps.editingDetailRow?.values.menuName}
        primaryAction={{ label: '확인', onClick: actions.requestConfirmDetailEditor }}
        secondaryAction={{ label: '닫기', onClick: actions.requestCloseDetailEditor }}
        onClose={actions.requestCloseDetailEditor}
      >
        {uiProps.editingDetailRow && (
          <div className="common-code-modal-form">
            <InputWrapper label="메뉴명" inputId="menu-detail-name" required>
              <InputBase
                id="menu-detail-name"
                size="md"
                value={uiProps.editingDetailRow.values.menuName ?? ''}
                required
                placeholder="메뉴명을 입력하세요"
                onChange={(event) =>
                  actions.handleChangeDetailValue(
                    uiProps.editingDetailRow!.id,
                    'menuName',
                    event.target.value,
                  )
                }
              />
            </InputWrapper>

            <InputWrapper label="메뉴 가격" inputId="menu-detail-price" required>
              <InputBase
                id="menu-detail-price"
                size="md"
                inputMode="numeric"
                required
                value={formatMenuPriceDisplay(uiProps.editingDetailRow.values.menuPrice ?? '')}
                placeholder="가격을 입력하세요"
                onChange={(event) =>
                  actions.handleChangeDetailValue(
                    uiProps.editingDetailRow!.id,
                    'menuPrice',
                    event.target.value.replace(/\D/g, ''),
                  )
                }
              />
            </InputWrapper>

            <TextareaInput
              label="메뉴 설명"
              id="menu-detail-description"
              value={uiProps.editingDetailRow.values.menuDescription ?? ''}
              rows={4}
              placeholder="메뉴 설명을 입력하세요"
              onChange={(event) =>
                actions.handleChangeDetailValue(
                  uiProps.editingDetailRow!.id,
                  'menuDescription',
                  event.target.value,
                )
              }
            />

            <SelectInput
              label="상세옵션 사용"
              size="md"
              required
              value={uiProps.editingDetailRow.values.optionUseYn ?? 'N'}
              options={USE_YN_OPTIONS}
              onChange={(value) =>
                actions.handleChangeDetailValue(uiProps.editingDetailRow!.id, 'optionUseYn', value)
              }
            />
            <SelectInput
              label="사용여부"
              size="md"
              required
              value={uiProps.editingDetailRow.values.useYn ?? 'Y'}
              options={USE_YN_OPTIONS}
              onChange={(value) =>
                actions.handleChangeDetailValue(uiProps.editingDetailRow!.id, 'useYn', value)
              }
            />

            <InputWrapper label="첨부파일" inputId="menu-detail-file">
              <FileInputGroup
                variant="button"
                files={uiProps.detailAttachFiles}
                onChange={actions.changeDetailFileState}
                maxFiles={MENU_DETAIL_FILE_POLICY.maxFiles}
                maxFileSizeMB={MENU_DETAIL_FILE_POLICY.maxFileSizeMB}
                maxTotalSizeMB={MENU_DETAIL_FILE_POLICY.maxTotalSizeMB}
                allowedExtensions={MENU_DETAIL_FILE_POLICY.allowedExtensions}
                hint={
                  <FileHint
                    variant="simple"
                    maxSize={`${MENU_DETAIL_FILE_POLICY.maxFileSizeMB}MB`}
                    maxCount={MENU_DETAIL_FILE_POLICY.maxFiles}
                    allowedExts={MENU_DETAIL_FILE_POLICY.allowedExtensions.map((ext) =>
                      ext.toUpperCase(),
                    )}
                  />
                }
              />
            </InputWrapper>
          </div>
        )}
      </WrapperModal>

      {/* 메뉴 상세설정 모달 "확인" 클릭 시 변경 확인 */}
      <EditConfirmModal
        open={uiProps.isDetailEditConfirmOpen}
        title="수정하시겠습니까?"
        description="변경된 내용이 메뉴 행에 반영됩니다."
        primaryAction={{
          label: '확인',
          loading: uiProps.isDetailEditConfirming,
          onClick: actions.confirmDetailEditor,
        }}
        secondaryAction={{
          disabled: uiProps.isDetailEditConfirming,
          onClick: actions.closeDetailEditorConfirm,
        }}
        onClose={actions.closeDetailEditorConfirm}
      />

      {/* 메뉴 상세설정 모달 저장 후 안내 */}
      <SimpleDefaultModal
        open={uiProps.detailEditorNotice !== null}
        title={uiProps.detailEditorNotice?.title ?? '알림'}
        description={uiProps.detailEditorNotice?.description}
        onClose={actions.closeDetailEditorNotice}
      />

      {/* 메뉴 상세설정 모달 닫기 시 dirty 경고 */}
      <SimpleDefaultModal
        open={uiProps.isDetailEditorDirtyWarningOpen}
        title="알림"
        description="페이지를 나가시겠습니까?"
        helperText="수정하신 내용이 저장되지 않았습니다."
        primaryAction={{ label: '확인', onClick: actions.forceCloseDetailEditor }}
        secondaryAction={{ onClick: actions.closeDetailEditorDirtyWarning }}
        onClose={actions.closeDetailEditorDirtyWarning}
      />
    </>
  );
}
