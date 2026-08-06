import type { Body } from '@/generated/types/body';
import type { Header } from '@/generated/types/header';
import type { StatusResponse } from '@/generated/types/statusResponse';
import { buildOrderBoardDatetime } from '../utils';
import type {
  OrderBoardMenuItem,
  OrderBoardPaymentStatus,
  OrderBoardRow,
} from '../types';
import { toOrderBoardStatus } from './statusCodeMapper';

export type OrderStatusCompatibleHeader = Header & {
  orderNum?: number;
  tableNum?: number | string;
  orderStatus?: string;
  paymentStatus?: OrderBoardPaymentStatus;
  cancelDatetime?: string;
  cancelledAt?: string;
  statusChangedAt?: string;
};

export type OrderStatusCompatibleBody = Body & {
  unitPrice?: number;
};

export type OrderStatusCompatibleResponse = Omit<StatusResponse, 'statusList'> & {
  statusList?: Array<{
    orderNum?: number;
    header?: OrderStatusCompatibleHeader;
    body?: OrderStatusCompatibleBody[];
  }>;
};

function normalizeDatetime(value?: string): string {
  if (!value) return buildOrderBoardDatetime(new Date(), 0, 0);
  if (/^\d{2}:\d{2}$/.test(value)) {
    const [hours, minutes] = value.split(':').map(Number);
    return buildOrderBoardDatetime(new Date(), hours, minutes);
  }
  return value.includes(' ') ? value.replace(' ', 'T') : value;
}

function mapMenuItems(body: OrderStatusCompatibleBody[] = []): OrderBoardMenuItem[] {
  const menus = body.filter((item) => item.rowType === 'MENU');
  const options = body.filter((item) => item.rowType === 'OPTION');

  return menus.map((menu, index) => ({
    id: menu.detailSysId ?? `menu-${index}`,
    name: menu.itemName ?? '',
    quantity: menu.qty ?? 0,
    // TODO(order-status-contract): 백엔드 단가 필드 반영 후 Orval 재생성 시 0 fallback을 제거한다.
    unitPrice: menu.unitPrice ?? 0,
    options: options
      .filter((option) => option.parentDetailSysId === menu.detailSysId)
      .map((option, optionIndex) => ({
        id: option.detailSysId ?? `${menu.detailSysId ?? index}-option-${optionIndex}`,
        name: option.itemName ?? '',
        quantity: option.qty ?? 0,
        // TODO(order-status-contract): 백엔드 단가 필드 반영 후 Orval 재생성 시 0 fallback을 제거한다.
        unitPrice: option.unitPrice ?? 0,
      })),
  }));
}

export function mapStatusResponsesToOrderBoardRows(
  responses: OrderStatusCompatibleResponse[] = [],
): OrderBoardRow[] {
  return responses.flatMap((response) => {
    const groupedStatus = toOrderBoardStatus(response.statusFlag);

    return (response.statusList ?? []).flatMap((item) => {
      const header = item.header;
      const orderStatus = toOrderBoardStatus(header?.orderStatus) ?? groupedStatus;
      if (!header?.sysId || !orderStatus) return [];

      const orderNum = header.orderNum ?? item.orderNum;
      return [{
        id: header.sysId,
        orderNo: orderNum === undefined ? '' : String(orderNum).padStart(4, '0'),
        tableNum: String(header.tableNum ?? header.tableInfo ?? ''),
        orderStatus,
        paymentStatus: header.paymentStatus ?? 'PENDING',
        orderDatetime: normalizeDatetime(header.orderDatetime),
        // TODO(order-status-contract): 백엔드가 상태 변경 시각을 응답하면 실제 필드로 교체한다.
        statusChangedAt: header.statusChangedAt,
        // TODO(order-status-contract): 백엔드 cancelledAt 반영 후 Orval 재생성 시 optional 호환 필드를 제거한다.
        cancelledAt: header.cancelledAt ?? (
          header.cancelDatetime ? normalizeDatetime(header.cancelDatetime) : undefined
        ),
        menuItems: mapMenuItems(item.body),
      }];
    });
  });
}
