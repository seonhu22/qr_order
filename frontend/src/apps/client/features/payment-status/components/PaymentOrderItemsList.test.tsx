import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PaymentOrderItemsList } from './PaymentOrderItemsList';

describe('PaymentOrderItemsList', () => {
  it('renders structured order items without exposing raw JSON', () => {
    const items =
      '[{"menuName":"불고기피자","qty":2,"price":12000,"totalPrice":24000,"paymentYn":"Y","options":[{"optionName":"치즈 추가","qty":2,"price":1000,"totalPrice":2000}]}]';

    render(<PaymentOrderItemsList items={items} />);

    expect(screen.getByText('불고기피자')).toBeInTheDocument();
    expect(screen.getByText('치즈 추가')).toBeInTheDocument();
    expect(screen.getByText('24,000원')).toBeInTheDocument();
    expect(screen.queryByText(items)).not.toBeInTheDocument();
  });

  it('renders text fallback lines for non-JSON items', () => {
    render(<PaymentOrderItemsList items={'쌀국수 X 1 14,900원\n반미 X 1 6,900원'} />);

    expect(screen.getByText('쌀국수 X 1 14,900원')).toBeInTheDocument();
    expect(screen.getByText('반미 X 1 6,900원')).toBeInTheDocument();
  });
});
