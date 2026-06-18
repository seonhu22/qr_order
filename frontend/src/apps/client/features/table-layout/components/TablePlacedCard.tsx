import './TablePlacedCard.css';
import { Icon } from '@/shared/assets/icons/Icon';
import type { LayoutSize } from '../types';

const SEAT_ICON_SIZE: Record<LayoutSize, number> = {
  small: 14,
  medium: 16,
  large: 18,
};

type TablePlacedCardProps = {
  index: number;
  name: string;
  seatCount: number;
  size: LayoutSize;
  onRemove?: () => void;
};

export function TablePlacedCard({ index, name, seatCount, size, onRemove }: TablePlacedCardProps) {
  return (
    <div className={`table-placed-card table-placed-card--${size}`}>
      <button
        type="button"
        className="table-placed-card__remove"
        aria-label={`${name} 삭제`}
        onClick={onRemove}
      >
        ×
      </button>
      <span className="table-placed-card__index">{index}</span>
      <span className="table-placed-card__name">{name}</span>
      <span className="table-placed-card__seat">
        <Icon id="i-seat" size={SEAT_ICON_SIZE[size]} />
        {seatCount}
      </span>
    </div>
  );
}
