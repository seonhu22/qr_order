import './TableLayoutCanvas.css';
import { TableCard } from '@/shared/components/table';
import { FacilityPlacedCard } from './FacilityPlacedCard';
import { TablePlacedCard } from './TablePlacedCard';
import type { LayoutSize } from '../types';

type TableLayoutCanvasProps = {
  layoutSize: LayoutSize;
};

/**
 * 배치 예시 — 실제 드래그/클릭 배치 상태 연동은 다음 단계에서 구현한다.
 * 지금은 사이즈별 카드 디자인이 캔버스에 어떻게 보이는지만 확인한다.
 */
export function TableLayoutCanvas({ layoutSize }: TableLayoutCanvasProps) {
  return (
    <TableCard title="테이블 배치" ariaLabel="테이블 배치" className="table-layout-canvas-card">
      <div className={`table-layout-canvas table-layout-canvas--${layoutSize}`}>
        <div className="table-layout-canvas__item table-layout-canvas__item--table-example">
          <TablePlacedCard index={1} name="테이블 명칭" seatCount={4} size={layoutSize} />
        </div>
        <div className="table-layout-canvas__item table-layout-canvas__item--facility-example">
          <FacilityPlacedCard label="화장실" icon="i-restroom" size={layoutSize} />
        </div>
      </div>
    </TableCard>
  );
}
