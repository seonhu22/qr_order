type PaymentSubmitErrorProps = {
  message: string | null;
};

/** 결제/미결제 API 실패를 모달 안에서 즉시 읽을 수 있게 표시한다. */
export function PaymentSubmitError({ message }: PaymentSubmitErrorProps) {
  if (!message) return null;

  return (
    <p className="order-cancel-modal__notice-desc" role="alert">
      {message}
    </p>
  );
}
