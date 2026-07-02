import type { TableGuiResponseWire } from '../api/tableLayoutApi';

// table_info(STORE_TABLE_MOCK_ROWS)에서 useYn='Y'이고 QR코드가 등록된 테이블만 반영한다(table-004는 useYn='N'이라 제외).
// objectType: 01=테이블(명시 안 하면 기본값, tableLayoutApi.isTableGuiRow 참고), 02=내부시설(고정 8종 —
// 종류는 tableType이 아니라 공통코드 이름(common_nm)이 실리는 tableName으로 매칭한다, 아래 facility-mock-1
// 참고), 03=기타(커스텀 시설, tableName에 유저가 입력한 이름).
export const TABLE_GUI_MOCK_ROWS: TableGuiResponseWire[] = [
  { sysId: 'table-001', tableName: '창가 1번', tableNum: 1, tableQty: 4 },
  { sysId: 'table-002', tableName: '창가 2번', tableNum: 2, tableQty: 4 },
  { sysId: 'table-003', tableName: '내부 1번', tableNum: 3, tableQty: 2 },
  {
    sysId: 'facility-mock-1',
    objectType: '02',
    tableName: '주방',
    xcoordinate: 400,
    ycoordinate: 40,
    width: 140,
    height: 56,
  },
];
