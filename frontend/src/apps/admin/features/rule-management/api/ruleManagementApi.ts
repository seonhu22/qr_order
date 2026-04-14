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
 *
 * @description
 * 원본(base)과 편집본(draft)이 같은 객체를 바라보면
 * 변경 여부 비교가 무의미해지므로 항상 복사본을 만들어 사용한다.
 */
export function cloneRuleDetailSchema(schema: RuleDetailSchema): RuleDetailSchema {
  return {
    columns: cloneDetailColumns(schema.columns),
    rows: cloneDetailRows(schema.rows),
  };
}

/**
 * 마스터 ID 기준 상세 스키마 맵을 깊은 복사한다.
 *
 * @description
 * `rule-master-1 -> 상세 rows`, `rule-master-2 -> 상세 rows`
 * 같은 구조를 통째로 복사할 때 사용한다.
 */
export function cloneRuleDetailSchemaMap(source: Record<string, RuleDetailSchema>) {
  return Object.fromEntries(
    Object.entries(source).map(([masterId, schema]) => [masterId, cloneRuleDetailSchema(schema)]),
  );
}

/**
 * 마스터 초기 목록의 복사본을 생성한다.
 *
 * @description
 * 현재는 mock 데이터지만, 나중에는 실제 목록 조회 응답을
 * 화면 모델로 바꾸는 지점으로 교체될 수 있다.
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
 *
 * @description
 * 새 마스터를 만들면 아직 상세 행이 없으므로
 * "컬럼만 있고 rows는 빈 상태"를 만들어 연결한다.
 */
export function createEmptyRuleDetailSchema(): RuleDetailSchema {
  return {
    columns: cloneDetailColumns(DEFAULT_DETAIL_COLUMNS),
    rows: [],
  };
}

/**
 * 컬럼 정의를 기반으로 신규 상세 행의 초기 values를 만든다.
 *
 * @description
 * 컬럼이 나중에 DB에서 동적으로 오더라도
 * 같은 규칙으로 기본값을 만들 수 있게 하기 위한 함수다.
 */
export function createBlankRuleDetailValues(columns: RuleDetailColumn[]) {
  return Object.fromEntries(
    columns.map((column) => [column.key, column.type === 'boolean' ? true : '']),
  );
}

/**
 * 추후 실제 저장 API로 교체될 마스터 저장 adapter.
 *
 * @description
 * 지금은 mock이지만, 화면 훅이 이 함수만 호출하도록 분리해 두었기 때문에
 * 실제 API로 바꿀 때 hook 구조를 크게 바꾸지 않아도 된다.
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
 *
 * @description
 * 현재는 mock 단계라 간단히 rows 직렬화 비교를 사용한다.
 * 추후 서버 저장 규칙이 복잡해지면 이 함수 내부만 교체하면 된다.
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
