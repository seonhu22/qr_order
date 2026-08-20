import type { Body } from '@/generated/types/body';
import type { Footer } from '@/generated/types/footer';
import type { StatusHeader } from '@/generated/types/statusHeader';
import type { StatusResponse } from '@/generated/types/statusResponse';
import { buildOrderBoardDatetime } from '../utils';
import type {
  OrderBoardMenuItem,
  OrderBoardPaymentStatus,
  OrderBoardRow,
} from '../types';
import { toOrderBoardStatus } from './statusCodeMapper';

export type OrderStatusCompatibleHeader = StatusHeader & {
  tableInfo?: string;
  paymentStatus?: OrderBoardPaymentStatus;
  cancelledAt?: string;
  statusChangedAt?: string;
};

export type OrderStatusCompatibleBody = Body;

export type OrderStatusCompatibleResponse = Omit<StatusResponse, 'statusList'> & {
  statusList?: Array<{
    orderNum?: number;
    header?: OrderStatusCompatibleHeader;
    body?: OrderStatusCompatibleBody[];
    footer?: Footer;
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

  return menus.map((menu, index) => {
    const menuOptions = options.filter((option) => option.parentDetailSysId === menu.detailSysId);
    const quantity = menu.qty ?? 0;

    return {
      id: menu.detailSysId ?? `menu-${index}`,
      name: menu.itemName ?? '',
      quantity,
      // price는 해당 MENU 행의 수량이 반영된 금액이므로 편집 화면에서 쓸 단가로 역산한다.
      unitPrice: quantity > 0 ? (menu.price ?? 0) / quantity : 0,
      options: menuOptions
      .map((option, optionIndex) => ({
        id: option.detailSysId ?? `${menu.detailSysId ?? index}-option-${optionIndex}`,
        name: option.itemName ?? '',
        quantity: option.qty ?? 0,
        unitPrice: (option.qty ?? 0) > 0 ? (option.price ?? 0) / (option.qty ?? 1) : 0,
      })),
    };
  });
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
        totalPrice: item.footer?.totalPrice ?? 0,
        orderDatetime: normalizeDatetime(header.orderDatetime),
        // TODO(order-status-contract): 백엔드가 상태 변경 시각을 응답하면 실제 필드로 교체한다.
        statusChangedAt: header.statusChangedAt,
        cancelledAt: header.cancelledAt ?? (
          header.cancelDatetime ? normalizeDatetime(header.cancelDatetime) : undefined
        ),
        menuItems: mapMenuItems(item.body),
      }];
    });
  });
}
