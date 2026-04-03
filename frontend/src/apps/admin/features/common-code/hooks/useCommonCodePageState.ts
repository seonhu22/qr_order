import { useState } from 'react';
import { DETAIL_ROWS_BY_MASTER, MASTER_ROWS } from '../mock/commonCodeMock';
import type { DetailCode } from '../types';

function cloneDetailRowsByMaster() {
  return Object.fromEntries(
    Object.entries(DETAIL_ROWS_BY_MASTER).map(([masterId, rows]) => [
      masterId,
      rows.map((row) => ({ ...row })),
    ]),
  ) as Record<string, DetailCode[]>;
}

export function useCommonCodePageState() {
  const [selectedMasterId, setSelectedMasterId] = useState<string>(MASTER_ROWS[0]?.id ?? '');
  const [checkedMasterIds, setCheckedMasterIds] = useState<string[]>([]);
  const [detailRowsByMaster, setDetailRowsByMaster] =
    useState<Record<string, DetailCode[]>>(cloneDetailRowsByMaster);

  const selectedMaster =
    MASTER_ROWS.find((row) => row.id === selectedMasterId) ?? MASTER_ROWS[0] ?? null;
  const detailRows = selectedMaster ? (detailRowsByMaster[selectedMaster.id] ?? []) : [];
  const checkedDetailIds = detailRows.filter((row) => row.checked).map((row) => row.id);
  const isAllMastersChecked =
    MASTER_ROWS.length > 0 && checkedMasterIds.length === MASTER_ROWS.length;
  const isAllDetailsChecked =
    detailRows.length > 0 && checkedDetailIds.length === detailRows.length;

  const updateSelectedDetailRows = (updater: (rows: DetailCode[]) => DetailCode[]) => {
    if (!selectedMaster) {
      return;
    }

    setDetailRowsByMaster((prev) => ({
      ...prev,
      [selectedMaster.id]: updater(prev[selectedMaster.id] ?? []),
    }));
  };

  const selectMaster = (masterId: string) => {
    setSelectedMasterId(masterId);
  };

  const toggleMasterChecked = (masterId: string) => {
    setCheckedMasterIds((prev) =>
      prev.includes(masterId) ? prev.filter((id) => id !== masterId) : [...prev, masterId],
    );
  };

  const toggleAllMasters = () => {
    setCheckedMasterIds(isAllMastersChecked ? [] : MASTER_ROWS.map((row) => row.id));
  };

  const toggleDetailChecked = (detailId: string) => {
    updateSelectedDetailRows((rows) =>
      rows.map((row) => (row.id === detailId ? { ...row, checked: !row.checked } : row)),
    );
  };

  const toggleAllDetails = () => {
    updateSelectedDetailRows((rows) =>
      rows.map((row) => ({
        ...row,
        checked: !isAllDetailsChecked,
      })),
    );
  };

  const changeDetailField = (detailId: string, key: 'code' | 'name', value: string) => {
    updateSelectedDetailRows((rows) =>
      rows.map((row) => (row.id === detailId ? { ...row, [key]: value } : row)),
    );
  };

  const changeDetailUseYn = (detailId: string, checked: boolean) => {
    updateSelectedDetailRows((rows) =>
      rows.map((row) => (row.id === detailId ? { ...row, useYn: checked } : row)),
    );
  };

  const addDetailRow = () => {
    if (!selectedMaster) {
      return;
    }

    const nextRow: DetailCode = {
      id: `new-${selectedMaster.id}-${Date.now()}`,
      code: selectedMaster.code,
      name: '',
      useYn: true,
      checked: false,
    };

    updateSelectedDetailRows((rows) => [...rows, nextRow]);
  };

  const removeCheckedDetailRows = () => {
    updateSelectedDetailRows((rows) => rows.filter((row) => !row.checked));
  };

  return {
    masterRows: MASTER_ROWS,
    selectedMaster,
    selectedMasterId,
    checkedMasterIds,
    detailRows,
    isAllMastersChecked,
    isAllDetailsChecked,
    checkedDetailIds,
    selectMaster,
    toggleMasterChecked,
    toggleAllMasters,
    toggleDetailChecked,
    toggleAllDetails,
    changeDetailField,
    changeDetailUseYn,
    addDetailRow,
    removeCheckedDetailRows,
  };
}
