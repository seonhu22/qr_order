import type { RuleDetailColumn, RuleDetailRow, RuleDetailSchema, RuleMasterRow } from '../types';

const DEFAULT_DETAIL_COLUMNS: RuleDetailColumn[] = [
  { key: 'detailCode', label: '상세코드', type: 'text', required: true, readOnlyOnExisting: true },
  { key: 'detailName', label: '상세명', type: 'text', required: true },
  { key: 'useYn', label: '사용여부', type: 'boolean' },
];

const INITIAL_MASTER_ROWS: RuleMasterRow[] = [
  { id: 'rule-master-1', code: 'ORDER_STATUS', name: '주문상태', useYn: 'Y' },
  { id: 'rule-master-2', code: 'PAYMENT_STATUS', name: '결제상태', useYn: 'Y' },
  { id: 'rule-master-3', code: 'ORDER_CHANNEL', name: '주문채널', useYn: 'Y' },
  { id: 'rule-master-4', code: 'DELIVERY_STATUS', name: '배달상태', useYn: 'N' },
];

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

function cloneDetailColumns(columns: RuleDetailColumn[]) {
  return columns.map((column) => ({ ...column }));
}

function cloneDetailRows(rows: RuleDetailRow[]) {
  return rows.map((row) => ({
    ...row,
    values: { ...row.values },
  }));
}

/**
 * 상세 스키마를 깊은 복사한다.
 */
export function cloneRuleDetailSchema(schema: RuleDetailSchema): RuleDetailSchema {
  return {
    columns: cloneDetailColumns(schema.columns),
    rows: cloneDetailRows(schema.rows),
  };
}

/**
 * 마스터 ID 기준 상세 스키마 맵을 깊은 복사한다.
 */
export function cloneRuleDetailSchemaMap(source: Record<string, RuleDetailSchema>) {
  return Object.fromEntries(
    Object.entries(source).map(([masterId, schema]) => [masterId, cloneRuleDetailSchema(schema)]),
  );
}

/**
 * 마스터 초기 목록의 복사본을 생성한다.
 */
export function createInitialRuleMasterRows() {
  return INITIAL_MASTER_ROWS.map((row) => ({ ...row }));
}

/**
 * 상세 스키마 초기 맵의 복사본을 생성한다.
 */
export function createInitialRuleDetailSchemaMap() {
  return cloneRuleDetailSchemaMap(INITIAL_DETAIL_SCHEMAS);
}

/**
 * 비어있는 상세 스키마를 생성한다.
 */
export function createEmptyRuleDetailSchema(): RuleDetailSchema {
  return {
    columns: cloneDetailColumns(DEFAULT_DETAIL_COLUMNS),
    rows: [],
  };
}

/**
 * 컬럼 정의를 기반으로 신규 상세 행의 초기 values를 만든다.
 */
export function createBlankRuleDetailValues(columns: RuleDetailColumn[]) {
  return Object.fromEntries(
    columns.map((column) => [column.key, column.type === 'boolean' ? true : '']),
  );
}

/**
 * 추후 실제 저장 API로 교체될 마스터 저장 adapter.
 */
export async function saveRuleMasterMock(
  masterRows: RuleMasterRow[],
  row: RuleMasterRow,
  isCreateMode: boolean,
) {
  if (isCreateMode) {
    const nextId = `rule-master-${Date.now()}`;
    const savedRow = { ...row, id: nextId };

    return {
      nextMasterRows: [...masterRows, savedRow],
      savedRow,
      created: true,
    };
  }

  return {
    nextMasterRows: masterRows.map((item) => (item.id === row.id ? { ...row } : item)),
    savedRow: { ...row },
    created: false,
  };
}

/**
 * 추후 실제 삭제 API로 교체될 마스터 삭제 adapter.
 */
export async function deleteRuleMastersMock(
  masterRows: RuleMasterRow[],
  checkedMasterIds: string[],
) {
  const deletedIds = new Set(checkedMasterIds);

  return {
    nextMasterRows: masterRows.filter((row) => !deletedIds.has(row.id)),
    deletedIds,
    deletedCount: deletedIds.size,
  };
}

/**
 * 상세 행 배열 기준으로 변경 여부를 판단한다.
 */
export function hasRuleDetailChanges(baseSchema: RuleDetailSchema, draftSchema: RuleDetailSchema) {
  return JSON.stringify(baseSchema.rows) !== JSON.stringify(draftSchema.rows);
}

/**
 * 추후 실제 상세 저장 API로 교체될 상세 저장 adapter.
 */
export async function saveRuleDetailSchemaMock(schema: RuleDetailSchema) {
  return {
    savedSchema: {
      columns: cloneDetailColumns(schema.columns),
      rows: schema.rows.map((row) => ({
        ...row,
        values: { ...row.values },
        isNew: false,
      })),
    },
  };
}
