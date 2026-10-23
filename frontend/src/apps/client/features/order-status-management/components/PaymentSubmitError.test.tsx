import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PaymentSubmitError } from './PaymentSubmitError';

describe('PaymentSubmitError', () => {
  it('결제 API 실패 메시지를 사용자가 확인할 수 있는 alert로 표시한다', () => {
    render(<PaymentSubmitError message="모든 주문의 서빙이 완료된 후 결제할 수 있습니다." />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      '모든 주문의 서빙이 완료된 후 결제할 수 있습니다.',
    );
  });

  it('실패 메시지가 없으면 아무것도 표시하지 않는다', () => {
    const { container } = render(<PaymentSubmitError message={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
