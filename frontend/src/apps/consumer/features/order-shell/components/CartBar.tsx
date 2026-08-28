import { ConsumerIcon } from '@/apps/consumer/shared/icons/ConsumerIcon';
import './CartBar.css';

type CartBarProps = {
  totalQty: number;
  totalPrice: number;
  onOpenCart: () => void;
};

export function CartBar({ totalQty, totalPrice, onOpenCart }: CartBarProps) {
  if (totalQty === 0) {
    return null;
  }

  return (
    <button type="button" className="cart-bar" onClick={onOpenCart}>
      <span className="cart-bar__summary">
        <ConsumerIcon id="ci-shopping-cart" size={16} />
        {totalQty}개 담음
      </span>
      <span className="cart-bar__price">
        {totalPrice.toLocaleString()}원
        <ConsumerIcon id="ci-chevron-right" size={16} />
      </span>
    </button>
  );
}
