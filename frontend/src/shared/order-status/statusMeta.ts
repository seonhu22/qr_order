/**
 * 사장님(client) 칸반과 손님(consumer) 주문내역이 공유하는 주문 상태 표기 메타.
 *
 * 백엔드의 원시 코드 값(client: statusFlag 01/02/03/99!, consumer: string 'RECEIVED'…)은
 * 앱마다 다르므로 각 앱에서 canonical `OrderStatusKey`로 정규화한 뒤 여기서 라벨·배지 클래스를
 * 가져다 쓴다.
 */
export type OrderStatusKey = 'RECEIVED' | 'COOKING' | 'SERVED' | 'CANCELLED';

export const ORDER_STATUS_LABEL: Record<OrderStatusKey, string> = {
  RECEIVED: '접수',
  COOKING: '조리중',
  SERVED: '서빙완료',
  CANCELLED: '취소',
};

/** `.order-status-badge` 위에 얹는 상태별 색상 클래스. CSS는 `./orderStatusBadge.css`에 있다. */
export const ORDER_STATUS_BADGE_CLASS: Record<OrderStatusKey, string> = {
  RECEIVED: 'order-status-badge--received',
  COOKING: 'order-status-badge--cooking',
  SERVED: 'order-status-badge--served',
  CANCELLED: 'order-status-badge--cancelled',
};
