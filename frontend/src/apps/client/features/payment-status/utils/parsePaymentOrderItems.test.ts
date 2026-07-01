import { describe, expect, it } from 'vitest';
import { parsePaymentOrderItems } from './parsePaymentOrderItems';

describe('parsePaymentOrderItems', () => {
  it('parses JSON string items into structured order items', () => {
    const parsed = parsePaymentOrderItems(
      '[{"menuName":"불고기피자","qty":2,"price":12000,"totalPrice":24000,"paymentYn":"Y","options":[{"optionName":"치즈 추가","qty":2,"price":1000,"totalPrice":2000}]}]',
    );

    expect(parsed).toEqual({
      kind: 'structured',
      items: [
        {
          menuName: '불고기피자',
          qty: 2,
          price: 12000,
          totalPrice: 24000,
          paymentYn: 'Y',
          options: [
            {
              optionName: '치즈 추가',
              qty: 2,
              price: 1000,
              totalPrice: 2000,
            },
          ],
        },
      ],
    });
  });

  it('keeps existing newline text items as fallback lines', () => {
    expect(parsePaymentOrderItems('쌀국수 X 1 14,900원\n반미 X 1 6,900원')).toEqual({
      kind: 'text',
      lines: ['쌀국수 X 1 14,900원', '반미 X 1 6,900원'],
    });
  });

  it('falls back to raw text when JSON parsing fails', () => {
    expect(parsePaymentOrderItems('[{"menuName":')).toEqual({
      kind: 'text',
      lines: ['[{"menuName":'],
    });
  });
});
