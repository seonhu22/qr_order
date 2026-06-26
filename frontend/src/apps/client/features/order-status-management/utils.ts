import { ORDER_BOARD_COLUMNS, ORDER_CANCEL_REASON_OPTIONS, ORDER_CANCEL_REASON_OTHER_VALUE } from './constants';
import type { MenuCatalogItem, OrderBoardColumnData, OrderBoardMenuItem, OrderBoardRow } from './types';

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/** UTC 변환 없이 "YYYY-MM-DDTHH:mm:00" 형식의 로컬 시각 문자열을 만든다. */
export function buildOrderBoardDatetime(date: Date, hours: number, minutes: number): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hours)}:${pad(minutes)}:00`;
}

export function nowOrderBoardDatetime(): string {
  const now = new Date();
  return buildOrderBoardDatetime(now, now.getHours(), now.getMinutes());
}

export function formatOrderBoardTime(value: string): string {
  return value.slice(11, 16);
}

export function formatOrderBoardPrice(value: number): string {
  return `${value.toLocaleString('ko-KR')} 원`;
}

function isToday(value: string): boolean {
  const target = new Date(value);
  const now = new Date();
  return (
    target.getFullYear() === now.getFullYear() &&
    target.getMonth() === now.getMonth() &&
    target.getDate() === now.getDate()
  );
}

/**
 * 표기 규칙: 결제상태가 완료(PAID)인 주문은 제외하고, 취소된 주문은 취소 처리한 당일만 표시한다.
 */
export function filterVisibleOrderBoardRows(rows: OrderBoardRow[]): OrderBoardRow[] {
  return rows.filter((row) => {
    if (row.paymentStatus === 'PAID') return false;
    if (row.orderStatus === 'CANCELLED') {
      return isToday(row.cancelledAt ?? row.orderDatetime);
    }
    return true;
  });
}

/**
 * 저장된 취소사유를 "취소사유 보기" 모달에 표시할 한 줄짜리 문구로 바꾼다.
 * "기타"인 경우 상세사유를 괄호로 붙여 한 필드에 함께 보여준다(예: "기타 (배송 지연)").
 */
export function formatOrderCancelReasonDisplay(row: Pick<OrderBoardRow, 'cancelReason' | 'cancelDescription'>): string {
  const { cancelReason, cancelDescription } = row;
  if (!cancelReason) return '-';

  const label = ORDER_CANCEL_REASON_OPTIONS.find((option) => option.value === cancelReason)?.label ?? cancelReason;
  const description = cancelDescription?.trim();

  if (cancelReason === ORDER_CANCEL_REASON_OTHER_VALUE && description) {
    return `${label} (${description})`;
  }
  return label;
}

/**
 * 결제완료 처리 시 영수증에 합산할 같은 테이블의 주문들을 찾는다.
 * 서빙완료(`SERVED`) 상태이면서 아직 결제완료(`PAID`)되지 않은 주문만 포함한다(접수/조리중 주문은 아직 결제 대상이 아니다).
 */
export function getPayableOrdersForTable(rows: OrderBoardRow[], tableNum: string): OrderBoardRow[] {
  return rows
    .filter((row) => row.tableNum === tableNum && row.orderStatus === 'SERVED' && row.paymentStatus !== 'PAID')
    .sort((a, b) => a.orderDatetime.localeCompare(b.orderDatetime));
}

/**
 * 주문 수정 모달에서 같은 테이블의 수정 대상 주문들을 찾는다.
 * 결제완료(`PAID`)·취소(`CANCELLED`)된 주문은 더 이상 수정할 수 없어 제외하고,
 * 접수/조리중/서빙완료처럼 아직 진행 중인 주문은 상태와 무관하게 전부 포함한다.
 */
export function getEditableOrdersForTable(rows: OrderBoardRow[], tableNum: string): OrderBoardRow[] {
  return rows
    .filter(
      (row) => row.tableNum === tableNum && row.orderStatus !== 'CANCELLED' && row.paymentStatus !== 'PAID',
    )
    .sort((a, b) => a.orderDatetime.localeCompare(b.orderDatetime));
}

/** 메뉴 1줄의 합계(메뉴 단가 × 수량 + 옵션 단가 × 수량 합)를 계산한다. */
export function calculateMenuItemTotal(menu: OrderBoardMenuItem): number {
  const optionsTotal = menu.options.reduce((sum, option) => sum + option.unitPrice * option.quantity, 0);
  return menu.unitPrice * menu.quantity + optionsTotal;
}

/** 주문 1건의 총액을 메뉴/옵션 단가 기준으로 계산한다(저장된 합계 필드를 따로 두지 않고 항상 이 값을 쓴다). */
export function calculateOrderTotal(row: Pick<OrderBoardRow, 'menuItems'>): number {
  return row.menuItems.reduce((sum, menu) => sum + calculateMenuItemTotal(menu), 0);
}

/** 메뉴 추가 모달에서 카탈로그를 카테고리별로 묶어 보여줄 때 쓴다(처음 등장한 순서를 그대로 유지). */
export function groupMenuCatalogByCategory(
  catalog: MenuCatalogItem[],
): { category: string; items: MenuCatalogItem[] }[] {
  const categories: string[] = [];
  const itemsByCategory = new Map<string, MenuCatalogItem[]>();

  for (const item of catalog) {
    if (!itemsByCategory.has(item.category)) {
      categories.push(item.category);
      itemsByCategory.set(item.category, []);
    }
    itemsByCategory.get(item.category)!.push(item);
  }

  return categories.map((category) => ({ category, items: itemsByCategory.get(category)! }));
}

export function groupOrderBoardRowsByStatus(rows: OrderBoardRow[]): OrderBoardColumnData[] {
  return ORDER_BOARD_COLUMNS.map(({ status, label }) => ({
    status,
    label,
    rows: rows
      .filter((row) => row.orderStatus === status)
      .sort((a, b) => a.orderDatetime.localeCompare(b.orderDatetime)),
  }));
}
