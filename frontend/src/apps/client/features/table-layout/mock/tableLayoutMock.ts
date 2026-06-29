import type { TableGuiResponse } from '@/generated/types/tableGuiResponse';

// table_info(STORE_TABLE_MOCK_ROWS)에서 useYn='Y'이고 QR코드가 등록된 테이블만 반영한다(table-004는 useYn='N'이라 제외).
export const TABLE_GUI_MOCK_ROWS: TableGuiResponse[] = [
  { sysId: 'table-001', tableName: '창가 1번', tableNum: 1, tableQty: 4 },
  { sysId: 'table-002', tableName: '창가 2번', tableNum: 2, tableQty: 4 },
  { sysId: 'table-003', tableName: '내부 1번', tableNum: 3, tableQty: 2 },
];
