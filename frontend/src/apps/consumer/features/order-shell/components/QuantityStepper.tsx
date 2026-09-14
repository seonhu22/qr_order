import { QuantityStepperButton } from './QuantityStepperButton';
import './QuantityStepper.css';

type QuantityStepperProps = {
  qty: number;
  onIncrease: () => void;
  onDecrease: () => void;
  /** 감소 버튼을 비활성화할 하한 (기본 1) */
  min?: number;
  /** 증가 버튼을 비활성화할 상한 */
  max?: number;
  label?: string;
};

/**
 * 고정 라벨 + 증감 버튼으로 이뤄진 수량 선택 줄.
 * 수량 값 자체는 호출부(`useMenuDetailSheet`)가 소유하고 여기서는 표시와 이벤트만 담당한다.
 */
export function QuantityStepper({
  qty,
  onIncrease,
  onDecrease,
  min = 1,
  max,
  label = '수량',
}: QuantityStepperProps) {
  return (
    <div className="quantity-stepper">
      <span className="quantity-stepper__label">{label}</span>
      <div className="quantity-stepper__control">
        <QuantityStepperButton
          icon="minus"
          className="quantity-stepper__button"
          onClick={onDecrease}
          disabled={qty <= min}
          ariaLabel="수량 줄이기"
        />
        <output className="quantity-stepper__value" aria-label="선택한 수량">
          {qty}
        </output>
        <QuantityStepperButton
          icon="plus"
          className="quantity-stepper__button"
          onClick={onIncrease}
          disabled={max !== undefined && qty >= max}
          ariaLabel="수량 늘리기"
        />
      </div>
    </div>
  );
}
