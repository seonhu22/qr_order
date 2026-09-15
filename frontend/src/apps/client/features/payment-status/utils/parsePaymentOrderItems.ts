import type { ParsedPaymentOrderItems, PaymentOrderItem, PaymentOrderOption } from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function parseOption(value: unknown): PaymentOrderOption | null {
  if (!isRecord(value)) return null;

  return {
    optionName: toString(value.optionName),
    qty: toNumber(value.qty),
    price: toNumber(value.price),
    totalPrice: toNumber(value.totalPrice),
  };
}

function parseItem(value: unknown): PaymentOrderItem | null {
  if (!isRecord(value)) return null;

  const rawOptions = Array.isArray(value.options) ? value.options : [];
  const cancelReason = toString(value.cancelReason);
  const orderNo = toString(value.orderNo);

  return {
    ...(orderNo ? { orderNo } : {}),
    menuName: toString(value.menuName),
    qty: toNumber(value.qty),
    price: toNumber(value.price),
    totalPrice: toNumber(value.totalPrice),
    paymentYn: toString(value.paymentYn),
    ...(cancelReason ? { cancelReason } : {}),
    options: rawOptions.map(parseOption).filter((option): option is PaymentOrderOption => option !== null),
  };
}

function parseTextItems(rawItems: string): ParsedPaymentOrderItems {
  return {
    kind: 'text',
    lines: rawItems
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  };
}

export function parsePaymentOrderItems(rawItems: string): ParsedPaymentOrderItems {
  const trimmedItems = rawItems.trim();

  if (!trimmedItems) {
    return { kind: 'text', lines: [] };
  }

  try {
    const parsed = JSON.parse(trimmedItems) as unknown;

    if (Array.isArray(parsed)) {
      const items = parsed.map(parseItem).filter((item): item is PaymentOrderItem => item !== null);

      if (items.length > 0) {
        return { kind: 'structured', items };
      }
    }
  } catch {
    // 기존 mock처럼 일반 문자열로 내려오는 응답은 줄 단위 fallback으로 표시한다.
  }

  return parseTextItems(trimmedItems);
}
