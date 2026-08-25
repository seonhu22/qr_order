import { ConsumerIcon } from '@/apps/consumer/shared/icons/ConsumerIcon';
import './QuantityStepperButton.css';

type QuantityStepperButtonIcon = 'minus' | 'plus' | 'remove';

type QuantityStepperButtonProps = {
  icon: QuantityStepperButtonIcon;
  onClick: () => void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
  iconSize?: number;
};

const ICON_ID: Record<QuantityStepperButtonIcon, string> = {
  minus: 'ci-minus',
  plus: 'ci-plus',
  remove: 'ci-x',
};

/**
 * 수량 증가·감소(및 장바구니의 삭제 전환)에 쓰는 정사각형 아이콘 버튼.
 * 메뉴 상세의 전체 수량, 옵션 리스트의 항목별 수량, 장바구니 줄 수량이 이 버튼을 공유하고
 * 배경·크기 같은 컨테이너 스타일만 각 화면의 CSS(className)로 다르게 입힌다.
 */
export function QuantityStepperButton({
  icon,
  onClick,
  ariaLabel,
  disabled = false,
  className,
  iconSize = 13,
}: QuantityStepperButtonProps) {
  return (
    <button
      type="button"
      className={`quantity-stepper-button${className ? ` ${className}` : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      <ConsumerIcon id={ICON_ID[icon]} size={iconSize} />
    </button>
  );
}
