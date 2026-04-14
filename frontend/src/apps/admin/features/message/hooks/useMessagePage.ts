import { useMemo, useState } from 'react';
import { useFilterDirtyCheck } from '@/shared/hooks/useFilterDirtyCheck';
import { useFilterKeywordState } from '@/shared/hooks/useFilterKeywordState';
import type { MessagePageViewModel, MessageRow, MessageSimpleModalState } from '../types';

/**
 * Figma 시안을 바로 확인할 수 있도록 넣어둔 초기 메시지 목록.
 *
 * TODO : 추후 API 연동 시 이 상수는 서버 응답으로 대체된다.
 */
const INITIAL_ROWS: MessageRow[] = [
  {
    id: 'message-row-1',
    code: 'MSG001',
    name: '주문 완료',
    content: '주문이 정상적으로 접수되었습니다.',
    isNew: false,
  },
  {
    id: 'message-row-2',
    code: 'MSG002',
    name: '결제 완료',
    content: '결제가 완료되었습니다. 감사합니다.',
    isNew: false,
  },
  {
    id: 'message-row-3',
    code: '',
    name: '',
    content: '',
    isNew: true,
  },
  {
    id: 'message-row-4',
    code: '',
    name: '',
    content: '',
    isNew: true,
  },
];

/**
 * 객체 배열을 그대로 재사용하지 않고 복사본으로 만든다.
 *
 * 원본과 편집본이 같은 참조를 바라보면
 * "수정 여부(isDirty)"를 올바르게 계산할 수 없기 때문이다.
 */
function cloneRows(rows: MessageRow[]) {
  return rows.map((row) => ({ ...row }));
}

/**
 * 저장 전 데이터와 현재 편집 데이터를 비교해 변경 여부를 계산한다.
 *
 * @returns {boolean} 하나라도 바뀌었으면 true
 */
function hasMessageChanges(baseRows: MessageRow[], draftRows: MessageRow[]) {
  return JSON.stringify(baseRows) !== JSON.stringify(draftRows);
}

/**
 * 메시지 관리 페이지 상태/액션 조합.
 *
 * @description
 * - 페이지는 이 훅이 반환하는 값만 받아 조립한다.
 * - 검색어 draft/applied 분리, 테이블 편집 상태, dirty guard를 한곳에서 관리한다.
 */
export function useMessagePage(): MessagePageViewModel {
  const { draftKeyword, appliedKeyword, setDraftKeyword, applyDraftKeyword, resetKeywords } =
    useFilterKeywordState('');
  /* baseRows: 마지막 저장 상태, draftRows: 현재 화면에서 수정 중인 상태 */
  const [baseRows, setBaseRows] = useState<MessageRow[]>(() => cloneRows(INITIAL_ROWS));
  const [draftRows, setDraftRows] = useState<MessageRow[]>(() => cloneRows(INITIAL_ROWS));
  const [selectedRowId, setSelectedRowId] = useState('message-row-4');
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [simpleModalState, setSimpleModalState] = useState<MessageSimpleModalState>(null);

  /* 저장 전후 비교 기준. true면 "저장되지 않은 내용"이 있다는 뜻이다. */
  const isDirty = useMemo(() => hasMessageChanges(baseRows, draftRows), [baseRows, draftRows]);

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
    setBaseRows(cloneRows(INITIAL_ROWS));
    setDraftRows(cloneRows(INITIAL_ROWS));
    setSelectedRowId('message-row-4');
  };

  /* dirty 상태에서 조회/초기화를 누르면 먼저 확인 모달을 띄운다. */
  const {
    pendingFilterAction,
    requestSearch,
    requestReset,
    confirmFilterAction,
    cancelFilterAction,
  } = useFilterDirtyCheck({
    isDirty,
    onSearch: applyDraftKeyword,
    onReset: resetMessageState,
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

    setDraftRows((prev) => prev.filter((row) => row.id !== selectedRowId));
    setSelectedRowId('');
  };

  /**
   * 현재 draftRows를 저장 완료 상태로 확정한다.
   *
   * 지금은 서버 호출 대신 baseRows만 갱신한다.
   * 나중에 API 연동 시 이 함수 안에서 mutation을 호출하면 된다.
   */
  const handleSave = () => {
    setIsSaveConfirmOpen(true);
  };

  /**
   * 저장 확인 모달에서 실제 저장을 확정한다.
   *
   * 변경된 내용이 없으면 안내만 보여주고,
   * 변경이 있으면 현재 draft를 저장 완료 상태로 바꾼다.
   */
  const confirmSave = () => {
    setIsSaveConfirmOpen(false);

    if (!isDirty) {
      setSimpleModalState({
        description: '변경된 내용이 없습니다.',
      });
      return;
    }

    setBaseRows(cloneRows(draftRows));
    setSimpleModalState({
      description: '저장되었습니다.',
    });
  };

  return {
    data: {
      rows,
    },
    status: {
      isLoading: false,
      isError: false,
      isSaving: false,
    },
    actions: {
      handleKeywordChange,
      handleSearch: requestSearch,
      handleReset: requestReset,
      handleSelectRow,
      handleChangeRowField,
      handleAddRow,
      handleDeleteRow,
      handleSave,
      confirmSave,
      closeSaveConfirm: () => setIsSaveConfirmOpen(false),
      closeSimpleModal: () => setSimpleModalState(null),
      confirmFilterAction,
      cancelFilterAction,
    },
    uiProps: {
      draftKeyword,
      selectedRowId,
      pendingFilterAction,
      isSaveConfirmOpen,
      simpleModalState,
    },
  };
}
