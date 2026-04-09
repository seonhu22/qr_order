/**
 * @fileoverview 관리자 관리 목록 상태 훅
 *
 * @description
 * - 조회 결과(baseRows)와 로컬 편집 상태(draftRows)를 분리해 관리한다.
 * - 선택 행, 행 추가/삭제, 필드 수정, 필수값 error, dirty 판단을 담당한다.
 * - 저장/조회/초기화 모달 같은 공통 flow는 상위 훅에서 관리한다.
 */

import { useMemo, useState } from 'react';
import type { SelectOption } from '@/shared/components/input';
import { buildAdminUserRequest, hasAdminUserChanges } from '../api/adminUserApi';
import type { AdminUserRow, AdminUserRowErrors } from '../types';

type UseAdminUserListStateParams = {
  baseRows: AdminUserRow[];
  plantOptions: SelectOption[];
};

/**
 * 관리자 관리 화면의 목록/편집 상태를 관리한다.
 *
 * @description
 * - 필수값 검증에 따른 rowErrors 생성 책임도 이 훅이 가진다.
 * - flow 훅은 validateRequiredFields의 결과만 보고 어떤 모달을 띄울지 결정한다.
 */
export function useAdminUserListState({
  baseRows,
  plantOptions,
}: UseAdminUserListStateParams) {
  const [draftRows, setDraftRows] = useState<AdminUserRow[] | null>(null);
  const [rowErrors, setRowErrors] = useState<AdminUserRowErrors>({});
  const [selectedRowId, setSelectedRowId] = useState('');

  const rows = draftRows ?? baseRows;
  const normalizedSelectedRowId = rows.some((row) => row.id === selectedRowId) ? selectedRowId : '';

  const isDirty = useMemo(() => {
    const request = buildAdminUserRequest(rows, baseRows);
    return hasAdminUserChanges(request);
  }, [rows, baseRows]);

  const updateRows = (updater: (rows: AdminUserRow[]) => AdminUserRow[]) => {
    setDraftRows((prev) => updater(prev ?? baseRows));
  };

  const clearRowError = (rowId: string, key: 'userId' | 'userName' | 'plantCd') => {
    setRowErrors((prev) => ({
      ...prev,
      [rowId]: {
        userId: key === 'userId' ? false : prev[rowId]?.userId ?? false,
        userName: key === 'userName' ? false : prev[rowId]?.userName ?? false,
        plantCd: key === 'plantCd' ? false : prev[rowId]?.plantCd ?? false,
      },
    }));
  };

  const selectRow = (rowId: string) => {
    setSelectedRowId(rowId);
  };

  const changeRowField = (rowId: string, key: 'userId' | 'userName', value: string) => {
    clearRowError(rowId, key);
    updateRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)));
  };

  const changeRowPlant = (rowId: string, plantCd: string) => {
    const matchedOption = plantOptions.find((option) => option.value === plantCd);
    clearRowError(rowId, 'plantCd');

    updateRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              plantCd,
              plantName: matchedOption?.label ?? '',
            }
          : row,
      ),
    );
  };

  const addRow = () => {
    const newRow: AdminUserRow = {
      id: `new-${Date.now()}`,
      userId: '',
      userName: '',
      plantCd: '',
      plantName: '',
      isNew: true,
    };

    updateRows((prev) => [...prev, newRow]);
    setSelectedRowId(newRow.id);
  };

  const deleteSelectedRow = () => {
    if (!normalizedSelectedRowId) {
      return false;
    }

    updateRows((prev) => prev.filter((row) => row.id !== normalizedSelectedRowId));
    setSelectedRowId('');
    return true;
  };

  const getRequiredFieldErrors = (): AdminUserRowErrors =>
    rows.reduce<AdminUserRowErrors>((acc, row) => {
      acc[row.id] = {
        userId: !row.userId.trim(),
        userName: !row.userName.trim(),
        plantCd: !row.plantCd.trim(),
      };
      return acc;
    }, {});

  /**
   * 현재 draft 행의 필수값을 검사하고 rowErrors를 갱신한다.
   *
   * @returns {boolean} 모든 필수값이 입력되어 있으면 true
   */
  const validateRequiredFields = () => {
    const nextRowErrors = getRequiredFieldErrors();
    setRowErrors(nextRowErrors);

    return !Object.values(nextRowErrors).some(
      (rowError) => rowError.userId || rowError.userName || rowError.plantCd,
    );
  };

  const resetToBaseRows = () => {
    setDraftRows(null);
    setRowErrors({});
    setSelectedRowId('');
  };

  return {
    rows,
    rowErrors,
    selectedRowId: normalizedSelectedRowId,
    isDirty,
    setRowErrors,
    selectRow,
    changeRowField,
    changeRowPlant,
    addRow,
    deleteSelectedRow,
    validateRequiredFields,
    resetToBaseRows,
  };
}
