import { describe, expect, it } from 'vitest';
import { createTableInfoSaveRequest, validateTableInfoRows } from './tableInfoModel';
import type { TableInfoRow } from './types';

const baseRows: TableInfoRow[] = [
  {
    id: 'sys-1',
    sysId: 'sys-1',
    tableNum: '1',
    tableName: '테이블 1번',
    tableQty: '4',
    useYn: 'Y',
    isNew: false,
  },
  {
    id: 'sys-2',
    sysId: 'sys-2',
    tableNum: '2',
    tableName: '테이블 2번',
    tableQty: '4',
    useYn: 'N',
    isNew: false,
  },
];

describe('tableInfoModel', () => {
  it('detects duplicate table numbers after numeric normalization', () => {
    const rowErrors = validateTableInfoRows([
      baseRows[0],
      {
        ...baseRows[1],
        tableNum: '01',
      },
    ]);

    expect(rowErrors['sys-1'].tableNum).toBe(true);
    expect(rowErrors['sys-2'].tableNum).toBe(true);
  });

  it('builds save request by splitting new, updated, and deleted rows', () => {
    const request = createTableInfoSaveRequest(
      [
        {
          ...baseRows[0],
          tableName: '창가 테이블',
        },
        {
          id: 'new-1',
          tableNum: '3',
          tableName: '신규 테이블',
          tableQty: '6',
          useYn: 'Y',
          isNew: true,
        },
      ],
      baseRows,
      [baseRows[1]],
    );

    expect(request).toEqual({
      newItems: [{ tableNum: 3, tableName: '신규 테이블', tableQty: 6, useYn: 'Y' }],
      updateItems: [
        { sysId: 'sys-1', tableNum: 1, tableName: '창가 테이블', tableQty: 4, useYn: 'Y' },
      ],
      delItems: [
        { sysId: 'sys-2', tableNum: 2, tableName: '테이블 2번', tableQty: 4, useYn: 'N' },
      ],
    });
  });
});
