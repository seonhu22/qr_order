import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import type { DetailCode } from '../types';
import {
  buildCommonDetailRequest,
  hasCommonDetailChanges,
  mapCommonDetailToRow,
  mapCommonMasterToRow,
  useCommonCodeDetailsQuery,
  useCommonCodeMastersQuery,
  useDeleteCommonMastersMutation,
  useSaveCommonDetailsMutation,
  useSaveCommonMasterMutation,
} from '../api/commonCodeApi';

function cloneRows(rows: DetailCode[]) {
  return rows.map((row) => ({ ...row }));
}

function normalizeOrdNo(rows: DetailCode[]) {
  return rows.map((row, index) => ({
    ...row,
    ordNo: index + 1,
  }));
}

export function useCommonCodePageState() {
  const queryClient = useQueryClient();
  const [selectedMasterId, setSelectedMasterId] = useState<string>('');
  const [checkedMasterIds, setCheckedMasterIds] = useState<string[]>([]);
  const [detailRowsByMaster, setDetailRowsByMaster] = useState<Record<string, DetailCode[]>>({});
  const [initialDetailRowsByMaster, setInitialDetailRowsByMaster] = useState<
    Record<string, DetailCode[]>
  >({});

  const mastersQuery = useCommonCodeMastersQuery();
  const saveMasterMutation = useSaveCommonMasterMutation();
  const deleteMastersMutation = useDeleteCommonMastersMutation();
  const detailQuery = useCommonCodeDetailsQuery(selectedMasterId);
  const saveDetailsMutation = useSaveCommonDetailsMutation();

  const masterRows = useMemo(
    () => (mastersQuery.data ?? []).map(mapCommonMasterToRow),
    [mastersQuery.data],
  );
  const selectedMaster = masterRows.find((row) => row.id === selectedMasterId) ?? null;
  const detailRows = selectedMaster ? (detailRowsByMaster[selectedMaster.id] ?? []) : [];
  const checkedDetailIds = detailRows.filter((row) => row.checked).map((row) => row.id);
  const isAllMastersChecked =
    masterRows.length > 0 && checkedMasterIds.length === masterRows.length;
  const isAllDetailsChecked =
    detailRows.length > 0 && checkedDetailIds.length === detailRows.length;

  useEffect(() => {
    if (selectedMasterId && !masterRows.some((row) => row.id === selectedMasterId)) {
      setSelectedMasterId('');
    }
  }, [masterRows, selectedMasterId]);

  useEffect(() => {
    setCheckedMasterIds((prev) => prev.filter((id) => masterRows.some((row) => row.id === id)));
  }, [masterRows]);

  useEffect(() => {
    if (!selectedMasterId || !detailQuery.data) {
      return;
    }

    const mappedRows = detailQuery.data.map(mapCommonDetailToRow);

    setDetailRowsByMaster((prev) => ({
      ...prev,
      [selectedMasterId]: cloneRows(mappedRows),
    }));
    setInitialDetailRowsByMaster((prev) => ({
      ...prev,
      [selectedMasterId]: cloneRows(mappedRows),
    }));
  }, [selectedMasterId, detailQuery.data]);

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
    setCheckedMasterIds(isAllMastersChecked ? [] : masterRows.map((row) => row.id));
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
      linkSysId: selectedMaster.id,
      code: '',
      name: '',
      useYn: true,
      ordNo: detailRows.length + 1,
      checked: false,
      isNew: true,
    };

    updateSelectedDetailRows((rows) => normalizeOrdNo([...rows, nextRow]));
  };

  const removeCheckedDetailRows = () => {
    updateSelectedDetailRows((rows) => normalizeOrdNo(rows.filter((row) => !row.checked)));
  };

  const canMoveDetailRowsUp = detailRows.some((row, index) => row.checked && index > 0);
  const canMoveDetailRowsDown = detailRows.some(
    (row, index) => row.checked && index < detailRows.length - 1,
  );

  const moveCheckedDetailRowsUp = () => {
    updateSelectedDetailRows((rows) => {
      const nextRows = [...rows];

      for (let index = 1; index < nextRows.length; index += 1) {
        if (nextRows[index].checked && !nextRows[index - 1].checked) {
          [nextRows[index - 1], nextRows[index]] = [nextRows[index], nextRows[index - 1]];
        }
      }

      return normalizeOrdNo(nextRows);
    });
  };

  const moveCheckedDetailRowsDown = () => {
    updateSelectedDetailRows((rows) => {
      const nextRows = [...rows];

      for (let index = nextRows.length - 2; index >= 0; index -= 1) {
        if (nextRows[index].checked && !nextRows[index + 1].checked) {
          [nextRows[index], nextRows[index + 1]] = [nextRows[index + 1], nextRows[index]];
        }
      }

      return normalizeOrdNo(nextRows);
    });
  };

  const saveMaster = async (master: { id: string; sysId?: string; code: string; name: string; useYn: 'Y' | 'N' }, isCreateMode: boolean) => {
    await saveMasterMutation.mutateAsync(master, isCreateMode);
    await queryClient.invalidateQueries({ queryKey: queryKeys.commonCode.masters() });
  };

  const deleteCheckedMasters = async () => {
    const targets = masterRows.filter((row) => checkedMasterIds.includes(row.id));

    if (!targets.length) {
      return 0;
    }

    await deleteMastersMutation.mutateAsync(targets);
    await queryClient.invalidateQueries({ queryKey: queryKeys.commonCode.masters() });

    if (targets.some((row) => row.id === selectedMasterId)) {
      setSelectedMasterId('');
    }

    setCheckedMasterIds([]);

    return targets.length;
  };

  const saveDetailRows = async () => {
    if (!selectedMaster) {
      return false;
    }

    const currentRows = detailRowsByMaster[selectedMaster.id] ?? [];
    const originalRows = initialDetailRowsByMaster[selectedMaster.id] ?? [];
    const request = buildCommonDetailRequest(selectedMaster.id, currentRows, originalRows);

    if (!hasCommonDetailChanges(request)) {
      return false;
    }

    await saveDetailsMutation.mutateAsync(request);
    await queryClient.invalidateQueries({ queryKey: queryKeys.commonCode.details(selectedMaster.id) });

    return true;
  };

  return {
    masterRows,
    selectedMaster,
    selectedMasterId,
    checkedMasterIds,
    detailRows,
    isAllMastersChecked,
    isAllDetailsChecked,
    checkedDetailIds,
    canMoveDetailRowsUp,
    canMoveDetailRowsDown,
    isLoadingMasters: mastersQuery.isLoading,
    isLoadingDetails: detailQuery.isLoading,
    isSavingMaster: saveMasterMutation.isPending,
    isDeletingMasters: deleteMastersMutation.isPending,
    isSavingDetails: saveDetailsMutation.isPending,
    selectMaster,
    toggleMasterChecked,
    toggleAllMasters,
    toggleDetailChecked,
    toggleAllDetails,
    changeDetailField,
    changeDetailUseYn,
    addDetailRow,
    removeCheckedDetailRows,
    moveCheckedDetailRowsUp,
    moveCheckedDetailRowsDown,
    saveMaster,
    deleteCheckedMasters,
    saveDetailRows,
  };
}
