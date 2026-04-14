import { useMemo, useState } from 'react';
import { useOrderedRowEditor } from '@/shared/hooks/useOrderedRowEditor';
import type { RuleDetailRow, RuleDetailSchema, RuleMasterRow } from '../types';
import {
  createBlankRuleDetailValues,
  createEmptyRuleDetailSchema,
  createInitialRuleDetailSchemaMap,
  createInitialRuleMasterRows,
  deleteRuleMastersMock,
  hasRuleDetailChanges,
  saveRuleDetailSchemaMock,
  saveRuleMasterMock,
} from '../api/ruleManagementApi';

/**
 * 규칙 관리 페이지의 마스터/상세 상태를 조합한다.
 *
 * @description
 * mock 데이터와 저장 규칙은 adapter 계층으로 분리해 두고,
 * 이 훅은 화면 상태 조합과 이벤트 연결만 담당한다.
 */
export function useRuleManagementPage() {
  const orderedRowEditor = useOrderedRowEditor<RuleDetailRow>();
  const [masterRows, setMasterRows] = useState<RuleMasterRow[]>(createInitialRuleMasterRows);
  const [checkedMasterIds, setCheckedMasterIds] = useState<string[]>([]);
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [baseDetailSchemasByMaster, setBaseDetailSchemasByMaster] = useState<
    Record<string, RuleDetailSchema>
  >(createInitialRuleDetailSchemaMap);
  const [draftDetailSchemasByMaster, setDraftDetailSchemasByMaster] = useState<
    Record<string, RuleDetailSchema>
  >(createInitialRuleDetailSchemaMap);

  const selectedMaster = useMemo(
    () => masterRows.find((row) => row.id === selectedMasterId) ?? null,
    [masterRows, selectedMasterId],
  );
  const selectedDetailSchema = selectedMaster
    ? (draftDetailSchemasByMaster[selectedMaster.id] ?? createEmptyRuleDetailSchema())
    : null;
  const baseSelectedDetailSchema = selectedMaster
    ? (baseDetailSchemasByMaster[selectedMaster.id] ?? createEmptyRuleDetailSchema())
    : null;
  const isAllMastersChecked =
    masterRows.length > 0 && checkedMasterIds.length === masterRows.length;

  /**
   * 현재 선택된 마스터의 상세 행 배열만 안전하게 갱신한다.
   */
  const setSelectedDetailRows = (updater: (rows: RuleDetailRow[]) => RuleDetailRow[]) => {
    if (!selectedMaster) {
      return;
    }

    setDraftDetailSchemasByMaster((prev) => {
      const currentSchema = prev[selectedMaster.id] ?? createEmptyRuleDetailSchema();

      return {
        ...prev,
        [selectedMaster.id]: {
          ...currentSchema,
          rows: updater(currentSchema.rows),
        },
      };
    });
  };

  /**
   * 마스터 행 선택 상태를 갱신한다.
   */
  const handleSelectMaster = (masterId: string) => {
    setSelectedMasterId(masterId);
  };

  /**
   * 마스터 행 체크박스를 토글한다.
   */
  const handleToggleMaster = (masterId: string) => {
    setCheckedMasterIds((prev) =>
      prev.includes(masterId) ? prev.filter((id) => id !== masterId) : [...prev, masterId],
    );
  };

  /**
   * 마스터 전체 선택/해제를 전환한다.
   */
  const handleToggleAllMasters = () => {
    setCheckedMasterIds(isAllMastersChecked ? [] : masterRows.map((row) => row.id));
  };

  /**
   * 마스터 행을 생성 또는 수정 저장한다.
   * 생성 시 상세 스키마 저장소도 함께 초기화한다.
   */
  const handleSaveMaster = async (row: RuleMasterRow, isCreateMode: boolean) => {
    const { nextMasterRows, savedRow, created } = await saveRuleMasterMock(
      masterRows,
      row,
      isCreateMode,
    );

    setMasterRows(nextMasterRows);

    if (created) {
      setBaseDetailSchemasByMaster((prev) => ({
        ...prev,
        [savedRow.id]: createEmptyRuleDetailSchema(),
      }));
      setDraftDetailSchemasByMaster((prev) => ({
        ...prev,
        [savedRow.id]: createEmptyRuleDetailSchema(),
      }));
    }
  };

  /**
   * 체크된 마스터를 삭제하고, 연결된 상세 상태를 정리한다.
   */
  const handleDeleteMasters = async () => {
    const { nextMasterRows, deletedIds, deletedCount } = await deleteRuleMastersMock(
      masterRows,
      checkedMasterIds,
    );

    if (!deletedCount) {
      return 0;
    }

    setMasterRows(nextMasterRows);
    setCheckedMasterIds([]);

    if (selectedMasterId && deletedIds.has(selectedMasterId)) {
      setSelectedMasterId('');
    }

    setBaseDetailSchemasByMaster((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([masterId]) => !deletedIds.has(masterId))),
    );
    setDraftDetailSchemasByMaster((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([masterId]) => !deletedIds.has(masterId))),
    );

    return deletedCount;
  };

  /**
   * 상세 셀 값을 변경한다.
   */
  const handleChangeDetailValue = (rowId: string, columnKey: string, value: string | boolean) => {
    setSelectedDetailRows((rows) =>
      rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              values: {
                ...row.values,
                [columnKey]: value,
              },
            }
          : row,
      ),
    );
  };

  /**
   * 선택된 마스터에 신규 상세 행을 추가한다.
   */
  const handleAddDetailRow = () => {
    if (!selectedMaster || !selectedDetailSchema) {
      return;
    }

    const nextRow: RuleDetailRow = {
      id: `rule-detail-${Date.now()}`,
      masterId: selectedMaster.id,
      ordNo: selectedDetailSchema.rows.length + 1,
      isNew: true,
      values: createBlankRuleDetailValues(selectedDetailSchema.columns),
    };

    setSelectedDetailRows((rows) => orderedRowEditor.appendRow(rows, nextRow));
  };

  /**
   * 선택된 상세 행(또는 전달된 rowId)을 삭제한다.
   */
  const handleDeleteDetailRow = (rowId?: string) => {
    setSelectedDetailRows((rows) => orderedRowEditor.removeRow(rows, rowId));
  };

  /**
   * 선택된 상세 행을 위로 이동한다.
   */
  const handleMoveDetailRowUp = (rowId?: string) => {
    setSelectedDetailRows((rows) => orderedRowEditor.moveRowUp(rows, rowId));
  };

  /**
   * 선택된 상세 행을 아래로 이동한다.
   */
  const handleMoveDetailRowDown = (rowId?: string) => {
    setSelectedDetailRows((rows) => orderedRowEditor.moveRowDown(rows, rowId));
  };

  /**
   * 상세 변경사항이 있을 때만 저장을 수행한다.
   * @returns 저장이 수행되면 true, 저장할 변경이 없거나 대상이 없으면 false
   */
  const handleSaveDetailRows = async () => {
    if (!selectedMaster || !selectedDetailSchema || !baseSelectedDetailSchema) {
      return false;
    }

    if (!hasRuleDetailChanges(baseSelectedDetailSchema, selectedDetailSchema)) {
      return false;
    }

    const { savedSchema } = await saveRuleDetailSchemaMock(selectedDetailSchema);

    setBaseDetailSchemasByMaster((prev) => ({
      ...prev,
      [selectedMaster.id]: savedSchema,
    }));
    setDraftDetailSchemasByMaster((prev) => ({
      ...prev,
      [selectedMaster.id]: savedSchema,
    }));

    return true;
  };

  return {
    data: {
      masterRows,
      selectedMaster,
      detailColumns: selectedDetailSchema?.columns ?? [],
      detailRows: selectedDetailSchema?.rows ?? [],
    },
    status: {
      isLoadingMasters: false,
      isErrorMasters: false,
      isLoadingDetails: false,
      isSavingDetails: false,
    },
    actions: {
      handleSelectMaster,
      handleToggleMaster,
      handleToggleAllMasters,
      handleSaveMaster,
      handleDeleteMasters,
      handleChangeDetailValue,
      handleAddDetailRow,
      handleDeleteDetailRow,
      handleMoveDetailRowUp,
      handleMoveDetailRowDown,
      handleSaveDetailRows,
    },
    uiProps: {
      selectedMasterId,
      checkedMasterIds,
      isAllMastersChecked,
    },
  };
}
