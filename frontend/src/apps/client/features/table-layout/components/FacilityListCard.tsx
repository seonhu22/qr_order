import './FacilityListCard.css';
import { Icon } from '@/shared/assets/icons/Icon';
import { TableCard } from '@/shared/components/table';
import { FACILITY_CATALOG } from '../constants';

export function FacilityListCard() {
  return (
    <TableCard title="내부시설" ariaLabel="내부시설" className="facility-list-card">
      <ul className="facility-list-card__list">
        {FACILITY_CATALOG.map((facility) => (
          <li key={facility.kind} className="facility-list-card__item">
            <span className="facility-list-card__icon">
              <Icon id={facility.icon} size={18} />
            </span>
            <span className="facility-list-card__label">{facility.label}</span>
            <span className="facility-list-card__drag-handle" aria-hidden="true">
              <Icon id="i-drag-handle" size={20} />
            </span>
          </li>
        ))}
      </ul>
    </TableCard>
  );
}
