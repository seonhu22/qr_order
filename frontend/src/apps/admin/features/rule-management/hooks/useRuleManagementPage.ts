import { useMemo, useState } from 'react';
import { useOrderedRowEditor } from '@/shared/hooks/useOrderedRowEditor';
import type { RuleDetailColumn, RuleDetailRow, RuleDetailSchema, RuleMasterRow } from '../types';

/**
 * 규칙 관리 화면의 마스터 목록 초기값.
 *
 * @description
 * - 화면 구조 확인을 위한 mock 데이터다.
 * - API 연동 전까지는 이 값을 기반으로 편집 플로우를 검증한다.
 * - TODO : 실제 API 연동 후에는 삭제한다.
 */

const INITIAL_MASTER_ROWS: RuleMasterRow[] = [
  { id: 'rule-master-1', code: 'ORDER_STATUS', name: '주문상태', useYn: 'Y' },
  { id: 'rule-master-2', code: 'PAYMENT_STATUS', name: '결제상태', useYn: 'Y' },
  { id: 'rule-master-3', code: 'ORDER_CHANNEL', name: '주문채널', useYn: 'Y' },
  { id: 'rule-master-4', code: 'DELIVERY_STATUS', name: '배달상태', useYn: 'N' },
];

const DEFAULT_DETAIL_COLUMNS: RuleDetailColumn[] = [
  { key: 'detailCode', label: '상세코드', type: 'text', required: true, readOnlyOnExisting: true },
  { key: 'detailName', label: '상세명', type: 'text', required: true },
  { key: 'useYn', label: '사용여부', type: 'boolean' },
];

/**
 * 마스터별 상세 테이블 스키마/초기 데이터.
 *
 * @description
 * selectedMasterId를 키로 사용해 마스터-상세 관계를 메모리에서 관리한다.
 */

const INITIAL_DETAIL_SCHEMAS: Record<string, RuleDetailSchema> = {
  'rule-master-1': {
    columns: DEFAULT_DETAIL_COLUMNS,
    rows: [
      {
        id: 'rule-detail-1',
        masterId: 'rule-master-1',
        ordNo: 1,
        values: {
          detailCode: 'REQUESTED',
          detailName: '주문요청',
          useYn: true,
        },
      },
      {
        id: 'rule-detail-2',
        masterId: 'rule-master-1',
        ordNo: 2,
        values: {
          detailCode: 'COOKING',
          detailName: '조리중',
          useYn: true,
        },
      },
    ],
  },
  'rule-master-2': {
    columns: DEFAULT_DETAIL_COLUMNS,
    rows: [
      {
        id: 'rule-detail-3',
        masterId: 'rule-master-2',
        ordNo: 1,
        values: {
          detailCode: 'READY',
          detailName: '결제대기',
          useYn: true,
        },
      },
    ],
  },
  'rule-master-3': {
    columns: DEFAULT_DETAIL_COLUMNS,
    rows: [
      {
        id: 'rule-detail-4',
        masterId: 'rule-master-3',
        ordNo: 1,
        values: {
          detailCode: 'STORE',
          detailName: '매장주문',
          useYn: true,
        },
      },
    ],
  },
  'rule-master-4': {
    columns: DEFAULT_DETAIL_COLUMNS,
    rows: [
      {
        id: 'rule-detail-5',
        masterId: 'rule-master-4',
        ordNo: 1,
        values: {
          detailCode: 'READY',
          detailName: '배달준비',
          useYn: false,
        },
      },
    ],
  },
};

function cloneSchemaMap(source: Record<string, RuleDetailSchema>) {
  return Object.fromEntries(
    Object.entries(source).map(([masterId, schema]) => [
      masterId,
      {
        columns: schema.columns.map((column) => ({ ...column })),
        rows: schema.rows.map((row) => ({
          ...row,
          values: { ...row.values },
        })),
      },
    ]),
  );
}

/**
 * 상세 행 신규 추가 시 사용할 기본 values를 만든다.
 *
 * @description
 * - boolean 컬럼은 기본 true
 * - text 컬럼은 기본 빈 문자열
 */
function createBlankDetailValues(columns: RuleDetailColumn[]) {
  return Object.fromEntries(
    columns.map((column) => [column.key, column.type === 'boolean' ? true : '']),
  );
}

/**
 * 규칙 관리 페이지의 마스터/상세 상태를 조합한다.
 *
 * @description
 * 지금은 mock 데이터를 사용하지만, 목록/상세/저장 함수가 분리되어 있어
 * 추후 실제 API adapter로 치환하기 쉽게 구성한다.
 */
export function useRuleManagementPage() {
  const orderedRowEditor = useOrderedRowEditor<RuleDetailRow>();
  const [masterRows, setMasterRows] = useState<RuleMasterRow[]>(() =>
    INITIAL_MASTER_ROWS.map((row) => ({ ...row })),
  );
  const [checkedMasterIds, setCheckedMasterIds] = useState<string[]>([]);
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [baseDetailSchemasByMaster, setBaseDetailSchemasByMaster] = useState(() =>
    cloneSchemaMap(INITIAL_DETAIL_SCHEMAS),
  );
  const [draftDetailSchemasByMaster, setDraftDetailSchemasByMaster] = useState(() =>
    cloneSchemaMap(INITIAL_DETAIL_SCHEMAS),
  );

  const selectedMaster = useMemo(
    () => masterRows.find((row) => row.id === selectedMasterId) ?? null,
    [masterRows, selectedMasterId],
  );
  const selectedDetailSchema = selectedMaster
    ? (draftDetailSchemasByMaster[selectedMaster.id] ?? {
        columns: DEFAULT_DETAIL_COLUMNS,
        rows: [],
      })
    : null;
  const baseSelectedDetailSchema = selectedMaster
    ? (baseDetailSchemasByMaster[selectedMaster.id] ?? {
        columns: DEFAULT_DETAIL_COLUMNS,
        rows: [],
      })
    : null;
  const isAllMastersChecked =
    masterRows.length > 0 && checkedMasterIds.length === masterRows.length;

  const setSelectedDetailRows = (updater: (rows: RuleDetailRow[]) => RuleDetailRow[]) => {
    if (!selectedMaster) {
      return;
    }

    setDraftDetailSchemasByMaster((prev) => {
      const currentSchema = prev[selectedMaster.id] ?? {
        columns: DEFAULT_DETAIL_COLUMNS,
        rows: [],
      };

      return {
        ...prev,
        [selectedMaster.id]: {
          ...currentSchema,
          rows: updater(currentSchema.rows),
        },
      };
    });
  };

  /**
   * 마스터 행 선택 상태를 변경한다.
   */
  const handleSelectMaster = (masterId: string) => {
    setSelectedMasterId(masterId);
  };

  /**
   * 마스터 행 체크박스를 토글한다.
   */
  const handleToggleMaster = (masterId: string) => {
    setCheckedMasterIds((prev) =>
      prev.includes(masterId) ? prev.filter((id) => id !== masterId) : [...prev, masterId],
    );
  };

  /**
   * 마스터 전체 선택을 토글한다.
   */
  const handleToggleAllMasters = () => {
    setCheckedMasterIds(isAllMastersChecked ? [] : masterRows.map((row) => row.id));
  };

  /**
   * 마스터 저장 처리.
   *
   * @description
   * - 생성 모드면 새 ID를 발급하고 상세 스키마를 함께 초기화한다.
   * - 수정 모드면 대상 행만 치환한다.
   */
  const handleSaveMaster = async (row: RuleMasterRow, isCreateMode: boolean) => {
    if (isCreateMode) {
      const nextId = `rule-master-${Date.now()}`;
      const nextRow = { ...row, id: nextId };

      setMasterRows((prev) => [...prev, nextRow]);
      setBaseDetailSchemasByMaster((prev) => ({
        ...prev,
        [nextId]: {
          columns: DEFAULT_DETAIL_COLUMNS,
          rows: [],
        },
      }));
      setDraftDetailSchemasByMaster((prev) => ({
        ...prev,
        [nextId]: {
          columns: DEFAULT_DETAIL_COLUMNS,
          rows: [],
        },
      }));
      return;
    }

    setMasterRows((prev) => prev.map((item) => (item.id === row.id ? { ...row } : item)));
  };

  /**
   * 체크된 마스터 행을 일괄 삭제한다.
   *
   * @returns 실제 삭제된 행 개수
   */
  const handleDeleteMasters = async () => {
    const deletedIds = new Set(checkedMasterIds);

    if (!deletedIds.size) {
      return 0;
    }

    setMasterRows((prev) => prev.filter((row) => !deletedIds.has(row.id)));
    setCheckedMasterIds([]);

    if (selectedMasterId && deletedIds.has(selectedMasterId)) {
      setSelectedMasterId('');
    }

    setBaseDetailSchemasByMaster((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([masterId]) => !deletedIds.has(masterId))),
    );
    setDraftDetailSchemasByMaster((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([masterId]) => !deletedIds.has(masterId))),
    );

    return deletedIds.size;
  };

  /**
   * 상세 행의 특정 필드를 변경한다.
   */
  const handleChangeDetailValue = (rowId: string, columnKey: string, value: string | boolean) => {
    setSelectedDetailRows((rows) =>
      rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              values: {
                ...row.values,
                [columnKey]: value,
              },
            }
          : row,
      ),
    );
  };

  /**
   * 선택된 마스터의 상세 행을 마지막에 추가한다.
   */
  const handleAddDetailRow = () => {
    if (!selectedMaster || !selectedDetailSchema) {
      return;
    }

    const nextRow: RuleDetailRow = {
      id: `rule-detail-${Date.now()}`,
      masterId: selectedMaster.id,
      ordNo: selectedDetailSchema.rows.length + 1,
      isNew: true,
      values: createBlankDetailValues(selectedDetailSchema.columns),
    };

    setSelectedDetailRows((rows) => orderedRowEditor.appendRow(rows, nextRow));
  };

  /**
   * 상세 행을 삭제한다.
   *
   * @param rowId 삭제할 행 ID. 없으면 editor 훅의 기본 선택 규칙을 따른다.
   */
  const handleDeleteDetailRow = (rowId?: string) => {
    setSelectedDetailRows((rows) => orderedRowEditor.removeRow(rows, rowId));
  };

  /**
   * 상세 행 순서를 한 칸 위로 이동한다.
   */
  const handleMoveDetailRowUp = (rowId?: string) => {
    setSelectedDetailRows((rows) => orderedRowEditor.moveRowUp(rows, rowId));
  };

  /**
   * 상세 행 순서를 한 칸 아래로 이동한다.
   */
  const handleMoveDetailRowDown = (rowId?: string) => {
    setSelectedDetailRows((rows) => orderedRowEditor.moveRowDown(rows, rowId));
  };

  /**
   * 상세 행 변경사항 저장 처리.
   *
   * @returns
   * - true: 변경사항이 있어 저장됨
   * - false: 변경사항 없음
   */
  const handleSaveDetailRows = async () => {
    if (!selectedMaster || !selectedDetailSchema || !baseSelectedDetailSchema) {
      return false;
    }

    const hasChanges =
      JSON.stringify(baseSelectedDetailSchema.rows) !== JSON.stringify(selectedDetailSchema.rows);

    if (!hasChanges) {
      return false;
    }

    const snapshot = {
      columns: selectedDetailSchema.columns.map((column) => ({ ...column })),
      rows: selectedDetailSchema.rows.map((row) => ({
        ...row,
        values: { ...row.values },
        isNew: false,
      })),
    };

    setBaseDetailSchemasByMaster((prev) => ({
      ...prev,
      [selectedMaster.id]: snapshot,
    }));
    setDraftDetailSchemasByMaster((prev) => ({
      ...prev,
      [selectedMaster.id]: snapshot,
    }));

    return true;
  };

  return {
    data: {
      masterRows,
      selectedMaster,
      detailColumns: selectedDetailSchema?.columns ?? [],
      detailRows: selectedDetailSchema?.rows ?? [],
    },
    status: {
      isLoadingMasters: false,
      isErrorMasters: false,
      isLoadingDetails: false,
      isSavingDetails: false,
    },
    actions: {
      handleSelectMaster,
      handleToggleMaster,
      handleToggleAllMasters,
      handleSaveMaster,
      handleDeleteMasters,
      handleChangeDetailValue,
      handleAddDetailRow,
      handleDeleteDetailRow,
      handleMoveDetailRowUp,
      handleMoveDetailRowDown,
      handleSaveDetailRows,
    },
    uiProps: {
      selectedMasterId,
      checkedMasterIds,
      isAllMastersChecked,
    },
  };
}
