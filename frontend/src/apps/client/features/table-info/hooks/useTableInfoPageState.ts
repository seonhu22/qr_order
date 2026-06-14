import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetTableInfo1QueryKey,
  useGetTableInfo1,
  useNewTableInfo,
} from '@/generated/store-manage-controller/store-manage-controller';
import type { TableInfoRow, TableInfoRowErrors, TableInfoRowField } from '../types';
import {
  createTableInfoSaveRequest,
  emptyTableInfoRowError,
  hasTableInfoRowErrors,
  toTableInfoRow,
  validateTableInfoRows,
} from '../tableInfoModel';

function createNewRow(index: number): TableInfoRow {
  return {
    id: `new-table-${Date.now()}-${index}`,
    tableNum: '',
    tableName: '',
    tableQty: '',
    useYn: 'Y',
    isNew: true,
  };
}

export function useTableInfoPageState() {
  const queryClient = useQueryClient();
  const tableInfoQuery = useGetTableInfo1();
  const saveMutation = useNewTableInfo({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetTableInfo1QueryKey() });
      },
    },
  });
  const [draftKeyword, setDraftKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [localRows, setLocalRows] = useState<TableInfoRow[] | null>(null);
  const [deletedRows, setDeletedRows] = useState<TableInfoRow[]>([]);
  const [selectedRowId, setSelectedRowId] = useState('');
  const [rowErrors, setRowErrors] = useState<TableInfoRowErrors>({});
  const [noticeMessage, setNoticeMessage] = useState('');

  const originalRows = useMemo(
    () => (tableInfoQuery.data ?? []).map(toTableInfoRow),
    [tableInfoQuery.data],
  );
  const rows = localRows ?? originalRows;
  const visibleRows = useMemo(() => {
    const keyword = appliedKeyword.trim().toLowerCase();

    if (!keyword) {
      return rows;
    }

    return rows.filter(
      (row) =>
        row.tableNum.toLowerCase().includes(keyword) ||
        row.tableName.toLowerCase().includes(keyword),
    );
  }, [appliedKeyword, rows]);

  const updateRows = (updater: (prevRows: TableInfoRow[]) => TableInfoRow[]) => {
    setLocalRows((prevRows) => updater(prevRows ?? originalRows));
  };

  const handleChangeRowField = (rowId: string, field: TableInfoRowField, value: string) => {
    updateRows((prevRows) =>
      prevRows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    );
    setRowErrors((prev) => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] ?? emptyTableInfoRowError),
        [field]: false,
      },
    }));
  };

  const handleAddRow = () => {
    updateRows((prevRows) => {
      const nextRow = createNewRow(prevRows.length + 1);
      setSelectedRowId(nextRow.id);
      return [...prevRows, nextRow];
    });
  };

  const handleDeleteRow = () => {
    if (!selectedRowId) {
      setNoticeMessage('삭제할 행을 선택해주세요.');
      return;
    }

    updateRows((prevRows) => {
      const selectedRow = prevRows.find((row) => row.id === selectedRowId);

      if (selectedRow && !selectedRow.isNew) {
        setDeletedRows((prevDeletedRows) => [...prevDeletedRows, selectedRow]);
      }

      const nextRows = prevRows.filter((row) => row.id !== selectedRowId);
      setSelectedRowId(nextRows[0]?.id ?? '');
      return nextRows;
    });
  };

  const handleSave = () => {
    const nextErrors = validateTableInfoRows(rows);
    setRowErrors(nextErrors);

    if (hasTableInfoRowErrors(nextErrors)) {
      setNoticeMessage('필수 항목을 확인해주세요.');
      return;
    }

    const { newItems, updateItems, delItems } = createTableInfoSaveRequest(
      rows,
      originalRows,
      deletedRows,
    );

    if (newItems.length === 0 && updateItems.length === 0 && delItems.length === 0) {
      setNoticeMessage('저장할 변경사항이 없습니다.');
      return;
    }

    saveMutation.mutate(
      { data: { newItems, updateItems, delItems } },
      {
        onSuccess: () => {
          setLocalRows(null);
          setDeletedRows([]);
          setRowErrors({});
          setNoticeMessage('저장되었습니다.');
        },
        onError: () => {
          setNoticeMessage('저장에 실패했습니다.');
        },
      },
    );
  };

  return {
    data: {
      rows: visibleRows,
    },
    status: {
      isLoading: tableInfoQuery.isLoading,
      isError: tableInfoQuery.isError,
      isSaving: saveMutation.isPending,
    },
    uiProps: {
      draftKeyword,
      selectedRowId,
      rowErrors,
      noticeMessage,
    },
    actions: {
      handleKeywordChange: setDraftKeyword,
      handleSearch: () => setAppliedKeyword(draftKeyword),
      handleReset: () => {
        setDraftKeyword('');
        setAppliedKeyword('');
      },
      handleSelectRow: setSelectedRowId,
      handleChangeRowField,
      handleAddRow,
      handleDeleteRow,
      handleSave,
      closeNotice: () => setNoticeMessage(''),
    },
  };
}
