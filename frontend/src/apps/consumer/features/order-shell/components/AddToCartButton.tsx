import { Button } from '@/shared/components/button';
import './AddToCartButton.css';

type AddToCartButtonProps = {
  totalPrice: number;
  disabled?: boolean;
  onClick: () => void;
};

/**
 * 고정 문구와 총 금액을 양끝에 배치한 담기 버튼.
 * 총 금액은 호출부가 계산해 넘긴다((메뉴 기본가 + 옵션 추가 금액) × 수량).
 */
export function AddToCartButton({ totalPrice, disabled = false, onClick }: AddToCartButtonProps) {
  return (
    <Button
      type="button"
      variant="primary"
      size="lg"
      className="add-to-cart-button"
      disabled={disabled}
      onClick={onClick}
    >
      <span className="add-to-cart-button__label">장바구니에 담기</span>
      <span className="add-to-cart-button__price">{totalPrice.toLocaleString()}원</span>
    </Button>
  );
}
