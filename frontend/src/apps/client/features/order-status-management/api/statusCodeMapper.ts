import type { OrderBoardStatus } from '../types';

const API_TO_BOARD_STATUS: Record<string, OrderBoardStatus> = {
  '01': 'RECEIVED',
  '02': 'COOKING',
  '03': 'SERVED',
  '99!': 'CANCELLED',
};

const BOARD_TO_API_STATUS: Record<OrderBoardStatus, string> = {
  RECEIVED: '01',
  COOKING: '02',
  SERVED: '03',
  CANCELLED: '99!',
};

export function toOrderBoardStatus(statusFlag?: string): OrderBoardStatus | undefined {
  return statusFlag ? API_TO_BOARD_STATUS[statusFlag] : undefined;
}

export function toApiOrderStatus(status: OrderBoardStatus): string {
  return BOARD_TO_API_STATUS[status];
}
