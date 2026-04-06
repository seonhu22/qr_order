import type { DetailCode, MasterCode } from '../types';

export const MASTER_ROWS: MasterCode[] = [
  { id: 'm1', code: 'ORDER_STATUS', name: '주문상태', useYn: 'Y' },
  { id: 'm2', code: 'ORDER_TYPE', name: '주문유형', useYn: 'Y' },
  { id: 'm3', code: 'PAYMENT_METHOD', name: '결제수단', useYn: 'Y' },
  { id: 'm4', code: 'DELIVERY_STATUS', name: '배송상태', useYn: 'N' },
];

export const DETAIL_ROWS_BY_MASTER: Record<string, DetailCode[]> = {
  m1: [
    { id: 'd1', linkSysId: 'm1', ordNo: 1, code: 'ORDER_STATUS', name: '접수', useYn: true, checked: false },
    { id: 'd2', linkSysId: 'm1', ordNo: 2, code: 'ORDER_STATUS', name: '조리중', useYn: true, checked: false },
    { id: 'd3', linkSysId: 'm1', ordNo: 3, code: 'ORDER_STATUS', name: '완료', useYn: true, checked: false },
  ],
  m2: [
    { id: 'd4', linkSysId: 'm2', ordNo: 1, code: 'ORDER_TYPE', name: '포장', useYn: true, checked: false },
    { id: 'd5', linkSysId: 'm2', ordNo: 2, code: 'ORDER_TYPE', name: '매장', useYn: true, checked: false },
  ],
  m3: [
    { id: 'd6', linkSysId: 'm3', ordNo: 1, code: 'PAYMENT_METHOD', name: '카드', useYn: true, checked: false },
    { id: 'd7', linkSysId: 'm3', ordNo: 2, code: 'PAYMENT_METHOD', name: '현금', useYn: false, checked: false },
  ],
  m4: [
    { id: 'd8', linkSysId: 'm4', ordNo: 1, code: 'DELIVERY_STATUS', name: '대기', useYn: true, checked: false },
    { id: 'd9', linkSysId: 'm4', ordNo: 2, code: 'DELIVERY_STATUS', name: '완료', useYn: true, checked: false },
  ],
};
