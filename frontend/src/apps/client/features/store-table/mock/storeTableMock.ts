import type { TableInfoResponse } from '@/generated/types/tableInfoResponse';

export const STORE_TABLE_MOCK_ROWS: TableInfoResponse[] = [
  {
    sysId: 'table-001',
    tableNum: 1,
    tableName: '창가 1번',
    tableQty: 4,
    useYn: 'Y',
  },
  {
    sysId: 'table-002',
    tableNum: 2,
    tableName: '창가 2번',
    tableQty: 4,
    useYn: 'Y',
  },
  {
    sysId: 'table-003',
    tableNum: 3,
    tableName: '내부 1번',
    tableQty: 2,
    useYn: 'Y',
  },
  {
    sysId: 'table-004',
    tableNum: 4,
    tableName: '내부 2번',
    tableQty: 6,
    useYn: 'N',
  },
];
