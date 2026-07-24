import './FacilityListCard.css';
import { Icon } from '@/shared/assets/icons/Icon';
import { TableCard } from '@/shared/components/table';
import { FACILITY_CATALOG } from '../constants';
import type { FacilityKind } from '../types';

type FacilityCatalogItemProps = {
  kind: FacilityKind;
  label: string;
  icon: string;
  disabled: boolean;
  onPlaceFacility: (kind: FacilityKind) => void;
};

function FacilityCatalogItem({ kind, label, icon, disabled, onPlaceFacility }: FacilityCatalogItemProps) {
  const className = [
    'facility-list-card__item',
    disabled ? 'facility-list-card__item--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li className={className} onClick={() => onPlaceFacility(kind)}>
      <span className="facility-list-card__icon">
        <Icon id={icon} size={18} />
      </span>
      <span className="facility-list-card__label">{label}</span>
      <span className="facility-list-card__drag-handle" aria-hidden="true">
        <Icon id="i-plus" size={14} />
      </span>
    </li>
  );
}

type FacilityListCardProps = {
  disabled?: boolean;
  onPlaceFacility: (kind: FacilityKind) => void;
};

export function FacilityListCard({ disabled = false, onPlaceFacility }: FacilityListCardProps) {
  return (
    <TableCard title="내부시설" ariaLabel="내부시설" className="facility-list-card">
      <ul className="facility-list-card__list">
        {FACILITY_CATALOG.map((facility) => (
          <FacilityCatalogItem
            key={facility.kind}
            kind={facility.kind}
            label={facility.label}
            icon={facility.icon}
            disabled={disabled}
            onPlaceFacility={onPlaceFacility}
          />
        ))}
      </ul>
    </TableCard>
  );
}
