import './CustomFacilityPlacedCard.css';
import { Icon } from '@/shared/assets/icons/Icon';
import type { LayoutSize } from '../types';

const CUSTOM_FACILITY_ICON_SIZE: Record<LayoutSize, number> = {
  small: 16,
  medium: 18,
  large: 22,
};

type CustomFacilityPlacedCardProps = {
  label: string;
  size: LayoutSize;
  viewOnly?: boolean;
  onRemove?: () => void;
};

// 고정 8종 카탈로그에 없는, 유저가 이름을 직접 입력해 만든 시설(object_type '03') — 아이콘은 종류가
// 없어 공용 아이콘(i-more)을 쓰고, 점선 테두리(반투명)로 기존 8종 카드와 구분해 저장 전까지는 휘발되는
// 데이터라는 걸 보여준다. 전체보기(viewOnly)에서는 편집 중 상태 안내가 필요 없어 내부시설과 같은
// 스타일로 보여준다.
export function CustomFacilityPlacedCard({ label, size, viewOnly, onRemove }: CustomFacilityPlacedCardProps) {
  const className = [
    'custom-facility-placed-card',
    `custom-facility-placed-card--${size}`,
    viewOnly ? 'custom-facility-placed-card--view-only' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <Icon id="i-more" size={CUSTOM_FACILITY_ICON_SIZE[size]} />
      <span className="custom-facility-placed-card__label">{label}</span>
      {onRemove && (
        <button
          type="button"
          className="custom-facility-placed-card__remove"
          aria-label={`${label} 삭제`}
          onClick={onRemove}
        >
          ×
        </button>
      )}
    </div>
  );
}
