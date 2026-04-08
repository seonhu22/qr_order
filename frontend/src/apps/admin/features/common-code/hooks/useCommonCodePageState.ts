/**
 * @fileoverview 공통코드 페이지 상태 조합 훅
 *
 * @description
 * - 서버 조회(Query)와 화면 편집 상태(draft)를 한 곳에서 조합한다.
 * - 페이지/테이블 컴포넌트는 이 훅이 제공하는 값과 액션만 사용한다.
 * - 마스터/상세 선택, 체크 상태, 상세 draft 편집, 저장/삭제, 순번 이동까지 담당한다.
 */

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import type { DetailCode } from '../types';
import {
  buildCommonDetailRequest,
  hasCommonDetailChanges,
  mapToCommonDetailModel,
  mapToCommonMasterModel,
  useCommonCodeDetailsQuery,
  useCommonCodeMastersQuery,
  useDeleteCommonMastersMutation,
  useSaveCommonDetailsMutation,
  useSaveCommonMasterMutation,
} from '../api/commonCodeApi';

function cloneRows(rows: DetailCode[]) {
  return rows.map((row) => ({ ...row }));
}

/**
 * 현재 배열 순서를 기준으로 ordNo를 1부터 다시 부여한다.
 *
 * @description
 * - 행 추가/삭제/이동 후 저장 payload가 실제 화면 순서를 반영하도록 유지한다.
 */
function normalizeOrdNo(rows: DetailCode[]) {
  return rows.map((row, index) => ({
    ...row,
    ordNo: index + 1,
  }));
}

/**
 * 공통코드 화면에서 사용하는 모든 상태와 액션을 조합한다.
 *
 * @description
 * - masterRows, detailRows는 서버 응답을 화면용 모델로 바꾼 결과다.
 * - detailRowsByMaster는 사용자가 편집 중인 로컬 draft다.
 * - initialDetailRowsByMaster는 최초 조회 시점 스냅샷으로, 상세 저장 diff 계산에 사용한다.
 */
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
    () => (mastersQuery.data ?? []).map(mapToCommonMasterModel),
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

    const mappedRows = detailQuery.data.map(mapToCommonDetailModel);

    setDetailRowsByMaster((prev) => ({
      ...prev,
      [selectedMasterId]: cloneRows(mappedRows),
    }));
    setInitialDetailRowsByMaster((prev) => ({
      ...prev,
      [selectedMasterId]: cloneRows(mappedRows),
    }));
  }, [selectedMasterId, detailQuery.data]);

  /**
   * 현재 선택된 마스터의 상세 draft만 안전하게 갱신한다.
   */
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

  const removeCheckedDetailRows = (selectedId?: string) => {
    updateSelectedDetailRows((rows) =>
      normalizeOrdNo(rows.filter((row) => !row.checked && row.id !== selectedId)),
    );
  };

  const canMoveDetailRowsUp = detailRows.some((row, index) => row.checked && index > 0);
  const canMoveDetailRowsDown = detailRows.some(
    (row, index) => row.checked && index < detailRows.length - 1,
  );

  const moveCheckedDetailRowsUp = (selectedId?: string) => {
    updateSelectedDetailRows((rows) => {
      const nextRows = [...rows];
      const shouldMove = (row: DetailCode) => row.checked || row.id === selectedId;

      for (let index = 1; index < nextRows.length; index += 1) {
        if (shouldMove(nextRows[index]) && !shouldMove(nextRows[index - 1])) {
          [nextRows[index - 1], nextRows[index]] = [nextRows[index], nextRows[index - 1]];
        }
      }

      return normalizeOrdNo(nextRows);
    });
  };

  const moveCheckedDetailRowsDown = (selectedId?: string) => {
    updateSelectedDetailRows((rows) => {
      const nextRows = [...rows];
      const shouldMove = (row: DetailCode) => row.checked || row.id === selectedId;

      for (let index = nextRows.length - 2; index >= 0; index -= 1) {
        if (shouldMove(nextRows[index]) && !shouldMove(nextRows[index + 1])) {
          [nextRows[index], nextRows[index + 1]] = [nextRows[index + 1], nextRows[index]];
        }
      }

      return normalizeOrdNo(nextRows);
    });
  };

  /**
   * 마스터 저장 후 목록 query를 다시 조회한다.
   *
   * @description
   * - 낙관적 업데이트 대신 invalidate 후 재조회 방식을 사용한다.
   * - 업무 화면에서 서버 정합성을 우선하기 위한 선택이다.
   */
  const saveMaster = async (master: { id: string; sysId?: string; code: string; name: string; useYn: 'Y' | 'N' }, isCreateMode: boolean) => {
    await saveMasterMutation.mutateAsync(master, isCreateMode);
    await queryClient.invalidateQueries({ queryKey: queryKeys.commonCode.masters() });
  };

  /**
   * 체크된 마스터를 삭제하고 목록/선택 상태를 정리한다.
   */
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

  /**
   * 상세 draft를 저장 요청으로 변환해 서버에 전송한다.
   *
   * @returns {Promise<boolean>} 실제 변경이 있어 저장을 수행했으면 true, 아니면 false
   */
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
