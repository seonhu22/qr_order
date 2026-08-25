import { calcCartLinePrice, calcUnitPrice } from '../cartLine';
import type { OrderShellCartLine, OrderShellCartOption } from '../types';
import { QuantityStepperButton } from './QuantityStepperButton';
import './CartLineItem.css';

type CartLineItemProps = {
  line: OrderShellCartLine;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
};

/** "치즈 토핑 (+1,500원) ×2" — 추가금·개수가 있을 때만 붙인다. */
function formatOptionLine(option: OrderShellCartOption) {
  const parts = [option.choiceName];
  if (option.price > 0) parts.push(`(+${option.price.toLocaleString()}원)`);
  if ((option.qty ?? 1) > 1) parts.push(`×${option.qty}`);
  return parts.join(' ');
}

/**
 * 장바구니 줄 하나. 참고 저장소(Qrorder) `CartSheet`의 행 구조를 그대로 따른다 —
 * 이름+줄 합계, 옵션 라인들, 1개당 가격+수량 스텝퍼 순서의 세 블록.
 * 수량이 1일 때는 감소 버튼이 삭제 버튼(x)으로 바뀌어 눌렀을 때 줄 자체를 없앤다.
 */
export function CartLineItem({ line, onIncrease, onDecrease, onRemove }: CartLineItemProps) {
  const atMin = line.qty <= 1;
  const unitPrice = calcUnitPrice(line.price, line.options);

  return (
    <li className="cart-line-item">
      <div className="cart-line-item__top">
        <p className="cart-line-item__name">{line.name}</p>
        <p className="cart-line-item__total">{calcCartLinePrice(line).toLocaleString()}원</p>
      </div>

      {line.options.length > 0 && (
        <div className="cart-line-item__options">
          {line.options.map((option) => (
            <p key={option.choiceId}>{formatOptionLine(option)}</p>
          ))}
        </div>
      )}

      <div className="cart-line-item__bottom">
        <span className="cart-line-item__unit-price">{unitPrice.toLocaleString()}원</span>

        <div className="cart-line-item__qty">
          <QuantityStepperButton
            icon={atMin ? 'remove' : 'minus'}
            className={`cart-line-item__qty-button${atMin ? ' cart-line-item__qty-button--danger' : ''}`}
            iconSize={11}
            onClick={atMin ? onRemove : onDecrease}
            ariaLabel={atMin ? `${line.name} 삭제` : `${line.name} 수량 줄이기`}
          />
          <output className="cart-line-item__qty-value" aria-label={`${line.name} 수량`}>
            {line.qty}
          </output>
          <QuantityStepperButton
            icon="plus"
            className="cart-line-item__qty-button"
            iconSize={11}
            onClick={onIncrease}
            ariaLabel={`${line.name} 수량 늘리기`}
          />
        </div>
      </div>
    </li>
  );
}
