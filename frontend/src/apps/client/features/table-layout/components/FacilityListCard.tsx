import './FacilityListCard.css';
import { useDraggable } from '@dnd-kit/core';
import { Icon } from '@/shared/assets/icons/Icon';
import { TableCard } from '@/shared/components/table';
import { FACILITY_CATALOG } from '../constants';
import type { DraggedItemData, FacilityKind } from '../types';

type FacilityCatalogItemProps = {
  kind: FacilityKind;
  label: string;
  icon: string;
  disabled: boolean;
};

function FacilityCatalogItem({ kind, label, icon, disabled }: FacilityCatalogItemProps) {
  const data: DraggedItemData = { origin: 'facility-catalog', kind };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `facility-catalog-${kind}`,
    data,
    disabled,
  });

  const className = [
    'facility-list-card__item',
    isDragging ? 'facility-list-card__item--dragging' : '',
    disabled ? 'facility-list-card__item--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li ref={setNodeRef} className={className} {...attributes} {...listeners}>
      <span className="facility-list-card__icon">
        <Icon id={icon} size={18} />
      </span>
      <span className="facility-list-card__label">{label}</span>
      <span className="facility-list-card__drag-handle" aria-hidden="true">
        <Icon id="i-drag-handle" size={20} />
      </span>
    </li>
  );
}

type FacilityListCardProps = {
  disabled?: boolean;
};

export function FacilityListCard({ disabled = false }: FacilityListCardProps) {
  return (
    <TableCard title="내부시설" ariaLabel="내부시설" className="facility-list-card">
      <ul className="facility-list-card__list">
        {FACILITY_CATALOG.map((facility) => (
          <FacilityCatalogItem key={facility.kind} {...facility} disabled={disabled} />
        ))}
      </ul>
    </TableCard>
  );
}
