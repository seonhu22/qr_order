import {
  AddRowTableButton,
  CreateTableButton,
  DeleteRowTableButton,
  DeleteTableButton,
  MoveDownTableButton,
  MoveUpTableButton,
  SaveTableButton,
} from '@/shared/components/button';

type MasterTableActionsProps = {
  onCreate: () => void;
  onDelete: () => void;
};

type EditableTableActionsProps = {
  isSaving?: boolean;
  canDelete?: boolean;
  onAddRow: () => void;
  onDeleteRow: () => void;
  onSave: () => void;
};

type DetailTableActionsProps = {
  canMoveUp: boolean;
  canMoveDown: boolean;
  canDelete: boolean;
  isSaving: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddRow: () => void;
  onDeleteRow: () => void;
  onSave: () => void;
};

/**
 * 마스터 목록 전용 액션 묶음.
 *
 * @description
 * 공통코드/규칙관리 같은 마스터 목록은 항상 `신규 + 삭제` 조합을 사용한다.
 */
export function MasterTableActions({ onCreate, onDelete }: MasterTableActionsProps) {
  return (
    <>
      <CreateTableButton onClick={onCreate} />
      <DeleteTableButton onClick={onDelete} />
    </>
  );
}

/**
 * 인라인 편집 목록 전용 액션 묶음.
 *
 * @description
 * 관리자 목록, 메시지 목록처럼 `행추가 + 행삭제 + 저장` 조합을 공통화한다.
 */
export function EditableTableActions({
  isSaving = false,
  canDelete = true,
  onAddRow,
  onDeleteRow,
  onSave,
}: EditableTableActionsProps) {
  return (
    <>
      <AddRowTableButton disabled={isSaving} onClick={onAddRow} />
      <DeleteRowTableButton disabled={!canDelete || isSaving} onClick={onDeleteRow} />
      <SaveTableButton loading={isSaving} onClick={onSave} />
    </>
  );
}

/**
 * 상세 편집 테이블 전용 액션 묶음.
 *
 * @description
 * 상세 목록은 `이동 + 행추가 + 행삭제 + 저장` 흐름을 같은 순서로 사용한다.
 */
export function DetailTableActions({
  canMoveUp,
  canMoveDown,
  canDelete,
  isSaving,
  onMoveUp,
  onMoveDown,
  onAddRow,
  onDeleteRow,
  onSave,
}: DetailTableActionsProps) {
  return (
    <>
      <MoveUpTableButton
        ariaLabel="위로 이동"
        disabled={!canMoveUp || isSaving}
        onClick={onMoveUp}
      />
      <MoveDownTableButton
        ariaLabel="아래로 이동"
        disabled={!canMoveDown || isSaving}
        onClick={onMoveDown}
      />
      <AddRowTableButton disabled={isSaving} onClick={onAddRow} />
      <DeleteRowTableButton disabled={!canDelete || isSaving} onClick={onDeleteRow} />
      <SaveTableButton loading={isSaving} onClick={onSave} />
    </>
  );
}
