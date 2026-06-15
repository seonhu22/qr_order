import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { useEditablePageFlow } from '@/shared/hooks/useEditablePageFlow';
import { useFilterKeywordState } from '@/shared/hooks/useFilterKeywordState';
import { usePreventLeave } from '@/shared/hooks/usePreventLeave';
import { getNextSelectedId } from '@/shared/utils/rowSelection';
import type { MessagePageViewModel, MessageRow, MessageRowErrors } from '../types';
import {
  buildMessageRequest,
  hasMessageChanges,
  mapToMessageModel,
  useMessageQuery,
  useSaveMessagesMutation,
} from '../api/messageApi';

/**
 * 객체 배열을 그대로 재사용하지 않고 복사본으로 만든다.
 *
 * 원본과 편집본이 같은 참조를 바라보면
 * "수정 여부(isDirty)"를 올바르게 계산할 수 없기 때문이다.
 */
function cloneRows(rows: MessageRow[]) {
  return rows.map((row) => ({ ...row }));
}

function getEmptyMessageRowErrors(rows: MessageRow[]): MessageRowErrors {
  return Object.fromEntries(
    rows
      .map((row) => [
        row.id,
        {
          code: row.isNew && !row.code.trim(),
          name: !row.name.trim(),
          content: !row.content.trim(),
        },
      ] as const)
      .filter(([, errors]) => errors.code || errors.name || errors.content),
  );
}

function hasRowErrors(rowErrors: MessageRowErrors) {
  return Object.keys(rowErrors).length > 0;
}

/**
 * 메시지 관리 페이지 상태/액션 조합.
 *
 * @description
 * - 페이지는 이 훅이 반환하는 값만 받아 조립한다.
 * - 검색어 draft/applied 분리, 테이블 편집 상태, dirty guard를 한곳에서 관리한다.
 */
export function useMessagePage(): MessagePageViewModel {
  const queryClient = useQueryClient();
  const { draftKeyword, appliedKeyword, setDraftKeyword, applyDraftKeyword, resetKeywords } =
    useFilterKeywordState('');
  const messageQuery = useMessageQuery(appliedKeyword.trim());
  const saveMessagesMutation = useSaveMessagesMutation();
  const fetchedRows = useMemo(
    () => (messageQuery.data ?? []).map(mapToMessageModel),
    [messageQuery.data],
  );
  /* baseRows: 마지막 저장 상태, draftRows: 현재 화면에서 수정 중인 상태 */
  const [baseRows, setBaseRows] = useState<MessageRow[]>([]);
  const [draftRows, setDraftRows] = useState<MessageRow[]>([]);
  const [rowErrors, setRowErrors] = useState<MessageRowErrors>({});
  const [selectedRowId, setSelectedRowId] = useState('');

  useEffect(() => {
    const nextRows = cloneRows(fetchedRows);
    setBaseRows(nextRows);
    setDraftRows(cloneRows(fetchedRows));
    setRowErrors({});
    setSelectedRowId((prev) => {
      if (prev && nextRows.some((row) => row.id === prev)) {
        return prev;
      }
      return nextRows[0]?.id ?? '';
    });
  }, [fetchedRows]);

  /* 저장 전후 비교 기준. true면 "저장되지 않은 내용"이 있다는 뜻이다. */
  const isDirty = useMemo(() => {
    const request = buildMessageRequest(draftRows, baseRows);
    return hasMessageChanges(request);
  }, [baseRows, draftRows]);

  usePreventLeave(isDirty);

  const rows = useMemo(() => {
    const keyword = appliedKeyword.trim().toLowerCase();

    /* 검색어가 없으면 전체 편집 목록을 그대로 보여준다. */
    if (!keyword) {
      return draftRows;
    }

    /* 조회 버튼을 눌러 적용된 검색어(appliedKeyword) 기준으로 필터링한다. */
    return draftRows.filter((row) =>
      [row.code, row.name, row.content].some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [appliedKeyword, draftRows]);

  /**
   * 초기화 버튼이 확정되면 검색어와 테이블 데이터를 처음 상태로 되돌린다.
   */
  const resetMessageState = () => {
    resetKeywords();
    setBaseRows(cloneRows(fetchedRows));
    setDraftRows(cloneRows(fetchedRows));
    setSelectedRowId(fetchedRows[0]?.id ?? '');
  };

  const editableFlow = useEditablePageFlow({
    isDirty,
    onApplySearch: applyDraftKeyword,
    onResetFilters: resetMessageState,
    onSaveChanges: async () => {
      const request = buildMessageRequest(draftRows, baseRows);

      if (!hasMessageChanges(request)) {
        return 'unchanged';
      }

      await saveMessagesMutation.mutateAsync(request);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.message.lists,
      });
      return 'saved';
    },
  });

  /**
   * 입력창 값(draftKeyword)만 바꾼다.
   *
   * 실제 조회는 handleSearch -> applyDraftKeyword 경로에서 실행된다.
   */
  const handleKeywordChange = (value: string) => {
    setDraftKeyword(value);
  };

  /**
   * 사용자가 클릭한 행을 선택 상태로 저장한다.
   */
  const handleSelectRow = (rowId: string) => {
    setSelectedRowId(rowId);
  };

  /**
   * 특정 행의 한 필드만 수정한다.
   *
   * @param {string} rowId 수정 대상 행 ID
   * @param {'code' | 'name' | 'content'} key 수정할 필드 이름
   * @param {string} value 새 값
   */
  const handleChangeRowField = (rowId: string, key: 'code' | 'name' | 'content', value: string) => {
    setDraftRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)));
    setRowErrors((prev) => {
      const current = prev[rowId];

      if (!current) {
        return prev;
      }

      const nextRowError = { ...current, [key]: false };
      if (!nextRowError.code && !nextRowError.name && !nextRowError.content) {
        const rest = { ...prev };
        delete rest[rowId];
        return rest;
      }

      return {
        ...prev,
        [rowId]: nextRowError,
      };
    });
  };

  /**
   * 비어 있는 신규 행을 마지막에 추가한다.
   *
   * 추가 직후 바로 편집할 수 있도록 새 행을 선택 상태로 만든다.
   */
  const handleAddRow = () => {
    const nextRow: MessageRow = {
      id: `message-row-${Date.now()}`,
      code: '',
      name: '',
      content: '',
      isNew: true,
    };

    setDraftRows((prev) => [...prev, nextRow]);
    setSelectedRowId(nextRow.id);
  };

  /**
   * 현재 선택된 행을 목록에서 제거한다.
   *
   * 선택된 행이 없으면 아무 동작도 하지 않는다.
   */
  const handleDeleteRow = () => {
    if (!selectedRowId) {
      return;
    }

    const nextSelectedId = getNextSelectedId(rows, selectedRowId);
    setDraftRows((prev) => prev.filter((row) => row.id !== selectedRowId));
    setSelectedRowId(nextSelectedId);
  };

  /**
   * 저장 버튼 클릭 시 공통 저장 플로우로 진입한다.
   */
  const handleSave = () => {
    const nextRowErrors = getEmptyMessageRowErrors(draftRows);

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
    data: {
      rows,
      rowErrors,
    },
    status: {
      isLoading: messageQuery.isLoading,
      isFetching: messageQuery.isFetching,
      isError: messageQuery.isError,
      error: messageQuery.error,
      isSaving: saveMessagesMutation.isPending,
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
