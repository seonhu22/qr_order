import './FacilityPlacedCard.css';
import { Icon } from '@/shared/assets/icons/Icon';
import type { LayoutSize } from '../types';

const FACILITY_ICON_SIZE: Record<LayoutSize, number> = {
  small: 16,
  medium: 18,
  large: 22,
};

type FacilityPlacedCardProps = {
  label: string;
  icon: string;
  size: LayoutSize;
  onRemove?: () => void;
};

export function FacilityPlacedCard({ label, icon, size, onRemove }: FacilityPlacedCardProps) {
  return (
    <div className={`facility-placed-card facility-placed-card--${size}`}>
      <Icon id={icon} size={FACILITY_ICON_SIZE[size]} />
      <span className="facility-placed-card__label">{label}</span>
      {onRemove && (
        <button
          type="button"
          className="facility-placed-card__remove"
          aria-label={`${label} 삭제`}
          onClick={onRemove}
        >
          ×
        </button>
      )}
    </div>
  );
}
