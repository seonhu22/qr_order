/**
 * @fileoverview 관리자 관리 목록 상태 훅
 *
 * @description
 * - 조회 결과(baseRows)와 로컬 편집 상태(draftRows)를 분리해 관리한다.
 * - 선택 행, 행 추가/삭제, 필드 수정, 필수값 error, dirty 판단을 담당한다.
 * - 저장/조회/초기화 모달 같은 공통 flow는 상위 훅에서 관리한다.
 *
 * @remarks
 * 이 훅은 "데이터 편집 상태"만 담당한다.
 * 모달 전이(저장 확인, 조회 확인 등)는 useAdminUserFlow에서 처리한다.
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
 *
 * @param {UseAdminUserListStateParams} params
 * @returns 목록 렌더링/편집에 필요한 상태와 액션
 *
 * @example
 * ```ts
 * const listState = useAdminUserListState({ baseRows, plantOptions });
 *
 * // 테이블 렌더링
 * <AdminUserTable
 *   rows={listState.rows}
 *   rowErrors={listState.rowErrors}
 *   selectedRowId={listState.selectedRowId}
 *   onSelectRow={listState.selectRow}
 *   onChangeRowField={listState.changeRowField}
 * />
 *
 * // 저장 전 검증
 * if (!listState.validateRequiredFields()) {
 *   openValidationNotice();
 * }
 * ```
 */
export function useAdminUserListState({
  baseRows,
  plantOptions,
}: UseAdminUserListStateParams) {
  const [draftRows, setDraftRows] = useState<AdminUserRow[] | null>(null);
  const [rowErrors, setRowErrors] = useState<AdminUserRowErrors>({});
  const [selectedRowId, setSelectedRowId] = useState('');

  /**
   * 현재 렌더링할 행 목록.
   *
   * @description
   * draft가 있으면 draftRows를, 없으면 서버 조회 원본(baseRows)을 사용한다.
   */
  const rows = draftRows ?? baseRows;
  const normalizedSelectedRowId = rows.some((row) => row.id === selectedRowId) ? selectedRowId : '';

  /**
   * 저장 필요 여부.
   *
   * @description
   * rows와 baseRows의 차이를 request 단위로 비교해 판단한다.
   * 단순 참조 비교가 아니라 저장 payload 기준 차이를 계산한다.
   */
  const isDirty = useMemo(() => {
    const request = buildAdminUserRequest(rows, baseRows);
    return hasAdminUserChanges(request);
  }, [rows, baseRows]);

  /**
   * rows 변경 공통 유틸.
   *
   * @description
   * 첫 편집 시점에는 baseRows를 복사해 draft를 만들고,
   * 이후부터는 draftRows를 기준으로 업데이트한다.
   */
  const updateRows = (updater: (rows: AdminUserRow[]) => AdminUserRow[]) => {
    setDraftRows((prev) => updater(prev ?? baseRows));
  };

  /**
   * 특정 행의 필드 에러를 해제한다.
   *
   * @description
   * 사용자가 값을 수정하면 해당 필드의 에러만 즉시 false로 바꾼다.
   */
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

  /**
   * 텍스트 필드(userId/userName) 변경.
   */
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
   *
   * @example
   * ```ts
   * const valid = validateRequiredFields();
   * if (!valid) {
   *   // rowErrors를 기준으로 input/select를 error 상태로 렌더링한다.
   * }
   * ```
   */
  const validateRequiredFields = () => {
    const nextRowErrors = getRequiredFieldErrors();
    setRowErrors(nextRowErrors);

    return !Object.values(nextRowErrors).some(
      (rowError) => rowError.userId || rowError.userName || rowError.plantCd,
    );
  };

  /**
   * 편집 중 draft를 버리고 조회 원본 상태로 되돌린다.
   *
   * @description
   * 조회 실행, 저장 성공, 필터 초기화 시점에 사용한다.
   */
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
