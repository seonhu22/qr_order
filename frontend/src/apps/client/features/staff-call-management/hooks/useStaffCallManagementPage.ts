/**
 * @fileoverview 직원호출 관리 페이지 상태 조합 훅
 *
 * @description
 * - 마스터/디테일 선택 구조가 아니라 매장당 하나뿐인 평평한 목록이며, 로그인 매장의 설정을
 *   조회해 편집 가능한 draft로 관리한다.
 * - 조회는 클라이언트 필터일 뿐이지만, 편집 중(행추가·입력) 상태에서 필터를 바꾸면 그 행이
 *   화면에서 사라져 보일 수 있고 초기화는 편집 내용 자체를 되돌리므로, menu-option과 동일하게
 *   `useFilterDirtyCheck`로 조회/초기화 전에 확인을 받는다.
 */

import { useEffect, useMemo, useState } from 'react';
import { useDetailTableSaveFlow } from '@/shared/hooks/useDetailTableSaveFlow';
import { useFilterDirtyCheck } from '@/shared/hooks/useFilterDirtyCheck';
import { useOrderedRowEditor } from '@/shared/hooks/useOrderedRowEditor';
import { usePreventLeave } from '@/shared/hooks/usePreventLeave';
import {
  buildStaffCallSettingRequest,
  mapStaffCallSetting,
  useSaveStaffCallSettingsMutation,
  useStaffCallSettingsQuery,
} from '../api/staffCallManagementApi';
import type { StaffCallItemRow } from '../types';

/** 상세 테이블이 "마스터 선택됨" 상태로 항상 보이게 하는 용도의 고정 값 — 실제로 선택할 대상이 없다. */
const STAFF_CALL_MASTER = { id: 'staff-call' };

function cloneRows(rows: StaffCallItemRow[]) {
  return rows.map((row) => ({ ...row }));
}

export function useStaffCallManagementPage() {
  const orderedRowEditor = useOrderedRowEditor<StaffCallItemRow>();
  const settingsQuery = useStaffCallSettingsQuery();
  const saveMutation = useSaveStaffCallSettingsMutation();
  const [baseRows, setBaseRows] = useState<StaffCallItemRow[]>([]);
  const [rows, setRows] = useState<StaffCallItemRow[]>([]);

  /* eslint-disable react-hooks/set-state-in-effect -- 서버 목록을 편집 가능한 draft 상태로 동기화한다. */
  useEffect(() => {
    if (!settingsQuery.data) return;
    const nextRows = settingsQuery.data.map(mapStaffCallSetting);
    setBaseRows(cloneRows(nextRows));
    setRows(cloneRows(nextRows));
  }, [settingsQuery.data]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const [draftKeyword, setDraftKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');

  const displayedRows = useMemo(
    () =>
      appliedKeyword
        ? rows.filter((row) => row.callNm.includes(appliedKeyword))
        : rows,
    [rows, appliedKeyword],
  );

  const emptyRowsText = appliedKeyword ? '조회 결과가 없습니다.' : '등록된 직원호출 항목이 없습니다.';

  const isDirty = useMemo(
    () => JSON.stringify(rows) !== JSON.stringify(baseRows),
    [rows, baseRows],
  );

  const handleKeywordChange = (value: string) => setDraftKeyword(value);
  const handleSearch = () => setAppliedKeyword(draftKeyword);
  const handleReset = () => {
    setDraftKeyword('');
    setAppliedKeyword('');
    setRows(cloneRows(baseRows));
  };

  const {
    pendingFilterAction,
    requestSearch,
    requestReset,
    confirmFilterAction,
    cancelFilterAction,
  } = useFilterDirtyCheck({
    isDirty,
    onSearch: handleSearch,
    onReset: handleReset,
  });

  const changeValue = (rowId: string, key: string, value: string | boolean) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)));
  };

  const addRow = (): string => {
    const nextRow: StaffCallItemRow = {
      id: `new-${Date.now()}`,
      callCd: '',
      callNm: '',
      singleYn: 'N',
      description: '',
      useYn: 'Y',
      ordNo: rows.length + 1,
      isNew: true,
    };

    setRows((prev) => orderedRowEditor.appendRow(prev, nextRow));

    return nextRow.id;
  };

  const removeRow = (rowId?: string) => {
    setRows((prev) => orderedRowEditor.removeRow(prev, rowId));
  };

  const moveRowUp = (rowId?: string) => {
    setRows((prev) => orderedRowEditor.moveRowUp(prev, rowId));
  };

  const moveRowDown = (rowId?: string) => {
    setRows((prev) => orderedRowEditor.moveRowDown(prev, rowId));
  };

  const saveRows = async () => {
    if (!isDirty) return false;

    await saveMutation.mutateAsync(buildStaffCallSettingRequest(rows, baseRows));
    await settingsQuery.refetch();

    return true;
  };

  const analyzeCallNames = () => {
    const nameCounts = new Map<string, number>();
    const codeCounts = new Map<string, number>();
    rows.forEach((row) => {
      const trimmed = row.callNm.trim();
      if (trimmed) nameCounts.set(trimmed, (nameCounts.get(trimmed) ?? 0) + 1);
      const callCd = row.callCd.trim();
      if (callCd) codeCounts.set(callCd, (codeCounts.get(callCd) ?? 0) + 1);
    });

    let hasEmpty = false;
    let hasDuplicate = false;
    const rowErrors = Object.fromEntries(
      rows.map((row) => {
        const trimmed = row.callNm.trim();
        const callCd = row.callCd.trim();
        const isEmpty = !trimmed || !callCd;
        const isDuplicate = (!isEmpty && (nameCounts.get(trimmed) ?? 0) > 1)
          || (!!callCd && (codeCounts.get(callCd) ?? 0) > 1);
        if (isEmpty) hasEmpty = true;
        if (isDuplicate) hasDuplicate = true;

        return [row.id, { callCd: !callCd || isDuplicate, callNm: !trimmed || isDuplicate }];
      }),
    );

    return { rowErrors, hasEmpty, hasDuplicate };
  };

  const validateRows = () => analyzeCallNames().rowErrors;

  /** 빈값만 있을 땐 다른 화면과 같은 문구를, 중복이 섞여 있으면 중복 사실도 같이 안내한다. */
  const buildInvalidValueMessage = () => {
    const { hasEmpty, hasDuplicate } = analyzeCallNames();
    if (hasDuplicate && hasEmpty) return '빈값을 채워주세요. 중복된 호출명도 있습니다.';
    if (hasDuplicate) return '중복된 호출명이 있습니다.';
    return '빈값을 채워주세요.';
  };

  const saveFlow = useDetailTableSaveFlow({
    isDirty,
    validateRows,
    invalidValueMessage: buildInvalidValueMessage,
    onSaveRows: saveRows,
  });

  usePreventLeave(isDirty);

  return {
    master: STAFF_CALL_MASTER,
    data: {
      rows: displayedRows,
      emptyRowsText,
    },
    status: {
      isLoading: settingsQuery.isLoading,
      isSaving: saveMutation.isPending,
    },
    uiProps: {
      draftKeyword,
      pendingFilterAction,
      rowErrors: saveFlow.rowErrors,
      saveConfirm: {
        open: saveFlow.isSaveConfirmOpen,
        isLoading: saveFlow.isConfirming,
      },
      notice: {
        open: !!saveFlow.notice,
        title: saveFlow.notice?.title ?? '알림',
        description: saveFlow.notice?.description,
        hasConfirmAction: !!saveFlow.notice?.onConfirm,
      },
    },
    actions: {
      handleKeywordChange,
      handleSearch: requestSearch,
      handleReset: requestReset,
      confirmFilterAction,
      cancelFilterAction,
      changeValue,
      addRow,
      removeRow,
      moveRowUp,
      moveRowDown,
      clearRowError: saveFlow.clearRowError,
      requestSave: saveFlow.requestSave,
      confirmSave: saveFlow.confirmSave,
      closeSaveConfirm: saveFlow.closeSaveConfirm,
      closeNotice: saveFlow.closeNotice,
      confirmNotice: saveFlow.confirmNotice,
    },
  };
}
