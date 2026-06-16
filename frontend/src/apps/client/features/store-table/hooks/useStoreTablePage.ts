import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { useEditablePageFlow } from '@/shared/hooks/useEditablePageFlow';
import { useFilterKeywordState } from '@/shared/hooks/useFilterKeywordState';
import { usePreventLeave } from '@/shared/hooks/usePreventLeave';
import { getNextSelectedId } from '@/shared/utils/rowSelection';
import type { StoreTablePageViewModel, StoreTableRow, StoreTableRowErrors } from '../types';
import {
  buildStoreTableRequest,
  hasStoreTableChanges,
  mapToStoreTableModel,
  useSaveStoreTableMutation,
  useStoreTableQuery,
} from '../api/storeTableApi';

function cloneRows(rows: StoreTableRow[]) {
  return rows.map((row) => ({ ...row }));
}

function isValidNumber(value: string) {
  return value.trim() !== '' && /^\d+$/.test(value.trim());
}

function getStoreTableRowErrors(rows: StoreTableRow[]): StoreTableRowErrors {
  return Object.fromEntries(
    rows
      .map(
        (row) =>
          [
            row.id,
            {
              tableNum: !isValidNumber(row.tableNum),
              tableName: !row.tableName.trim(),
              tableQty: !isValidNumber(row.tableQty),
              useYn: !row.useYn.trim(),
            },
          ] as const,
      )
      .filter(
        ([, errors]) =>
          errors.tableNum || errors.tableName || errors.tableQty || errors.useYn,
      ),
  );
}

function hasRowErrors(rowErrors: StoreTableRowErrors) {
  return Object.keys(rowErrors).length > 0;
}

export function useStoreTablePage(): StoreTablePageViewModel {
  const queryClient = useQueryClient();
  const { draftKeyword, appliedKeyword, setDraftKeyword, applyDraftKeyword, resetKeywords } =
    useFilterKeywordState('');
  const tableQuery = useStoreTableQuery();
  const saveStoreTableMutation = useSaveStoreTableMutation();
  const fetchedRows = useMemo(
    () => (tableQuery.data ?? []).map(mapToStoreTableModel),
    [tableQuery.data],
  );

  const [baseRows, setBaseRows] = useState<StoreTableRow[]>([]);
  const [draftRows, setDraftRows] = useState<StoreTableRow[]>([]);
  const [rowErrors, setRowErrors] = useState<StoreTableRowErrors>({});
  const [selectedRowId, setSelectedRowId] = useState('');

  useEffect(() => {
    const nextRows = cloneRows(fetchedRows);
    setBaseRows(nextRows);
    setDraftRows(cloneRows(fetchedRows));
    setRowErrors({});
    setSelectedRowId((prev) => {
      if (prev && nextRows.some((row) => row.id === prev)) return prev;
      return nextRows[0]?.id ?? '';
    });
  }, [fetchedRows]);

  const isDirty = useMemo(() => {
    const request = buildStoreTableRequest(draftRows, baseRows);
    return hasStoreTableChanges(request);
  }, [baseRows, draftRows]);

  usePreventLeave(isDirty);

  const rows = useMemo(() => {
    const keyword = appliedKeyword.trim().toLowerCase();
    if (!keyword) return draftRows;
    return draftRows.filter(
      (row) =>
        row.isNew ||
        [row.tableNum, row.tableName].some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [appliedKeyword, draftRows]);

  const resetStoreTableState = () => {
    resetKeywords();
    setBaseRows(cloneRows(fetchedRows));
    setDraftRows(cloneRows(fetchedRows));
    setSelectedRowId(fetchedRows[0]?.id ?? '');
  };

  const editableFlow = useEditablePageFlow({
    isDirty,
    onApplySearch: applyDraftKeyword,
    onResetFilters: resetStoreTableState,
    onSaveChanges: async () => {
      const request = buildStoreTableRequest(draftRows, baseRows);
      if (!hasStoreTableChanges(request)) return 'unchanged';
      await saveStoreTableMutation.mutateAsync(request);
      resetKeywords();
      await queryClient.invalidateQueries({ queryKey: queryKeys.storeTable.lists });
      return 'saved';
    },
  });

  const handleKeywordChange = (value: string) => {
    setDraftKeyword(value);
  };

  const handleSelectRow = (rowId: string) => {
    setSelectedRowId(rowId);
  };

  const handleChangeRowField = (
    rowId: string,
    key: 'tableNum' | 'tableName' | 'tableQty' | 'useYn',
    value: string,
  ) => {
    setDraftRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)));
    setRowErrors((prev) => {
      const current = prev[rowId];
      if (!current) return prev;
      const nextRowError = { ...current, [key]: false };
      if (
        !nextRowError.tableNum &&
        !nextRowError.tableName &&
        !nextRowError.tableQty &&
        !nextRowError.useYn
      ) {
        const rest = { ...prev };
        delete rest[rowId];
        return rest;
      }
      return { ...prev, [rowId]: nextRowError };
    });
  };

  const handleAddRow = () => {
    const nextRow: StoreTableRow = {
      id: `store-table-row-${Date.now()}`,
      tableNum: '',
      tableName: '',
      tableQty: '',
      useYn: 'Y',
      isNew: true,
    };
    setDraftRows((prev) => [...prev, nextRow]);
    setSelectedRowId(nextRow.id);
  };

  const handleDeleteRow = () => {
    if (!selectedRowId) return;
    const nextSelectedId = getNextSelectedId(rows, selectedRowId);
    setDraftRows((prev) => prev.filter((row) => row.id !== selectedRowId));
    setSelectedRowId(nextSelectedId);
  };

  const handleSave = () => {
    const nextRowErrors = getStoreTableRowErrors(draftRows);
    if (hasRowErrors(nextRowErrors)) {
      editableFlow.setSimpleModalState({
        description: '빈값을 채워주세요.',
        onConfirm: () => {
          setRowErrors(nextRowErrors);
          editableFlow.closeSimpleModal();
        },
      });
      return;
    }
    setRowErrors({});
    editableFlow.requestSave();
  };

  return {
    data: { rows, rowErrors },
    status: {
      isLoading: tableQuery.isLoading,
      isFetching: tableQuery.isFetching,
      isError: tableQuery.isError,
      error: tableQuery.error,
      isSaving: saveStoreTableMutation.isPending || editableFlow.state.isConfirmingSave,
    },
    actions: {
      handleKeywordChange,
      handleSearch: editableFlow.requestSearch,
      handleReset: editableFlow.requestResetFilters,
      handleSelectRow,
      handleChangeRowField,
      handleAddRow,
      handleDeleteRow,
      handleSave,
      confirmSave: editableFlow.confirmSave,
      closeSaveConfirm: editableFlow.closeSaveConfirm,
      closeSimpleModal: editableFlow.closeSimpleModal,
      confirmSimpleModal: editableFlow.confirmSimpleModal,
      confirmFilterAction: editableFlow.confirmFilterAction,
      cancelFilterAction: editableFlow.cancelFilterAction,
    },
    uiProps: {
      draftKeyword,
      selectedRowId,
      flowState: editableFlow.state,
    },
  };
}
