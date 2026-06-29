import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { useStoreTableQuery } from '@/apps/client/features/store-table/api/storeTableApi';
import { useEditablePageFlow } from '@/shared/hooks/useEditablePageFlow';
import { useFilterKeywordState } from '@/shared/hooks/useFilterKeywordState';
import { usePreventLeave } from '@/shared/hooks/usePreventLeave';
import { getNextSelectedId } from '@/shared/utils/rowSelection';
import type { QrCodePageViewModel, QrCodeRow, QrCodeRowErrors } from '../types';
import {
  buildQrCodeRequest,
  hasQrCodeChanges,
  mapToQrCodeModel,
  useQrCodeQuery,
  useSaveQrCodeMutation,
} from '../api/qrCodeApi';

function cloneRows(rows: QrCodeRow[]) {
  return rows.map((row) => ({ ...row }));
}

function getQrCodeRowErrors(rows: QrCodeRow[]): QrCodeRowErrors {
  return Object.fromEntries(
    rows
      .map((row) => [row.id, { tableNum: !row.tableNum.trim() }] as const)
      .filter(([, errors]) => errors.tableNum),
  );
}

function getDuplicateTableNumRowErrors(rows: QrCodeRow[]): QrCodeRowErrors {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const value = row.tableNum.trim();
    if (!value) return;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return Object.fromEntries(
    rows
      .filter((row) => (counts.get(row.tableNum.trim()) ?? 0) > 1)
      .map((row) => [row.id, { tableNum: true }] as const),
  );
}

function hasRowErrors(rowErrors: QrCodeRowErrors) {
  return Object.keys(rowErrors).length > 0;
}

export function useQrCodePage(): QrCodePageViewModel {
  const queryClient = useQueryClient();
  const { draftKeyword, appliedKeyword, setDraftKeyword, applyDraftKeyword, resetKeywords } =
    useFilterKeywordState('');
  const qrCodeQuery = useQrCodeQuery();
  const saveQrCodeMutation = useSaveQrCodeMutation();
  const storeTableQuery = useStoreTableQuery();
  const fetchedRows = useMemo(
    () => (qrCodeQuery.data ?? []).map(mapToQrCodeModel),
    [qrCodeQuery.data],
  );
  /** 등록된 테이블 번호 목록 — 테이블 관리(store-table)에 등록된 행을 그대로 옵션으로 쓴다. */
  const tableNumOptions = useMemo(() => {
    return (storeTableQuery.data ?? [])
      .filter((item) => item.tableNum != null)
      .map((item) => ({ value: String(item.tableNum), label: String(item.tableNum) }));
  }, [storeTableQuery.data]);
  const tableSysIdByNum = useMemo(() => {
    return new Map(
      (storeTableQuery.data ?? [])
        .filter((item) => item.tableNum != null && item.sysId)
        .map((item) => [String(item.tableNum), item.sysId as string]),
    );
  }, [storeTableQuery.data]);

  const [baseRows, setBaseRows] = useState<QrCodeRow[]>([]);
  const [draftRows, setDraftRows] = useState<QrCodeRow[]>([]);
  const [rowErrors, setRowErrors] = useState<QrCodeRowErrors>({});
  const [selectedRowId, setSelectedRowId] = useState('');
  const [checkedRowIds, setCheckedRowIds] = useState<Set<string>>(new Set());
  const [printTargetRowIds, setPrintTargetRowIds] = useState<string[] | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- 서버 조회 결과를 편집 가능한 draft 상태로 동기화한다. */
  useEffect(() => {
    const nextRows = cloneRows(fetchedRows);
    setBaseRows(nextRows);
    setDraftRows(cloneRows(fetchedRows));
    setRowErrors({});
    setSelectedRowId((prev) => (prev && nextRows.some((row) => row.id === prev) ? prev : ''));
  }, [fetchedRows]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const isDirty = useMemo(() => {
    const request = buildQrCodeRequest(draftRows, baseRows);
    return hasQrCodeChanges(request);
  }, [baseRows, draftRows]);

  usePreventLeave(isDirty);

  const rows = useMemo(() => {
    const keyword = appliedKeyword.trim().toLowerCase();
    if (!keyword) return draftRows;
    return draftRows.filter(
      (row) =>
        row.isNew ||
        [row.tableNum, row.remark].some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [appliedKeyword, draftRows]);

  const resetQrCodeState = () => {
    resetKeywords();
    setBaseRows(cloneRows(fetchedRows));
    setDraftRows(cloneRows(fetchedRows));
    setSelectedRowId('');
    setCheckedRowIds(new Set());
  };

  const editableFlow = useEditablePageFlow({
    isDirty,
    onApplySearch: applyDraftKeyword,
    onResetFilters: resetQrCodeState,
    onSaveChanges: async () => {
      const request = buildQrCodeRequest(draftRows, baseRows);
      if (!hasQrCodeChanges(request)) return 'unchanged';
      await saveQrCodeMutation.mutateAsync(request);
      resetKeywords();
      await queryClient.invalidateQueries({ queryKey: queryKeys.qrCode.lists });
      return 'saved';
    },
  });

  const handleKeywordChange = (value: string) => {
    setDraftKeyword(value);
  };

  const handleSelectRow = (rowId: string) => {
    setSelectedRowId(rowId);
  };

  const handleChangeRowField = (rowId: string, key: 'tableNum' | 'remark', value: string) => {
    setDraftRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        if (key !== 'tableNum') return { ...row, [key]: value };

        return {
          ...row,
          tableNum: value,
          linkSysId: tableSysIdByNum.get(value) ?? '',
        };
      }),
    );
    setRowErrors((prev) => {
      const current = prev[rowId];
      if (!current) return prev;
      const rest = { ...prev };
      delete rest[rowId];
      return rest;
    });
  };

  const handleToggleRow = (rowId: string, checked: boolean) => {
    setCheckedRowIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(rowId);
      else next.delete(rowId);
      return next;
    });
  };

  const handleToggleAll = (checked: boolean) => {
    setCheckedRowIds(checked ? new Set(rows.map((row) => row.id)) : new Set());
  };

  const handlePrintRow = (rowId: string) => {
    setPrintTargetRowIds([rowId]);
  };

  const handleBulkPrint = () => {
    if (checkedRowIds.size === 0) {
      editableFlow.setSimpleModalState({
        description: '출력할 항목을 먼저 선택해주세요.',
      });
      return;
    }
    setPrintTargetRowIds(Array.from(checkedRowIds));
  };

  /** TODO: 실제 QR 출력 연동은 다음 단계에서 구현한다. */
  const confirmPrint = () => {
    setPrintTargetRowIds(null);
  };

  const cancelPrint = () => {
    setPrintTargetRowIds(null);
  };

  const handleAddRow = () => {
    const nextRow: QrCodeRow = {
      id: `qr-code-row-${Date.now()}`,
      linkSysId: '',
      useYn: 'Y',
      tableNum: '',
      remark: '',
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
    const nextRowErrors = getQrCodeRowErrors(draftRows);
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

    const duplicateRowErrors = getDuplicateTableNumRowErrors(draftRows);
    if (hasRowErrors(duplicateRowErrors)) {
      editableFlow.setSimpleModalState({
        description: '이미 사용 중인 테이블 번호입니다.\n다른 번호를 입력해 주세요.',
        onConfirm: () => {
          setRowErrors(duplicateRowErrors);
          editableFlow.closeSimpleModal();
        },
      });
      return;
    }

    setRowErrors({});
    editableFlow.requestSave();
  };

  return {
    data: { rows, rowErrors, tableNumOptions },
    status: {
      isLoading: qrCodeQuery.isLoading,
      isFetching: qrCodeQuery.isFetching,
      isError: qrCodeQuery.isError,
      error: qrCodeQuery.error,
      isSaving: saveQrCodeMutation.isPending || editableFlow.state.isConfirmingSave,
    },
    actions: {
      handleKeywordChange,
      handleSearch: editableFlow.requestSearch,
      handleReset: editableFlow.requestResetFilters,
      handleSelectRow,
      handleChangeRowField,
      handleToggleRow,
      handleToggleAll,
      handlePrintRow,
      handleBulkPrint,
      confirmPrint,
      cancelPrint,
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
      checkedRowIds,
      printConfirm: {
        open: printTargetRowIds !== null,
        count: printTargetRowIds?.length ?? 0,
      },
      flowState: editableFlow.state,
    },
  };
}
