import './TableLayoutPage.css';
import { useState } from 'react';
import { Button } from '@/shared/components/button';
import { LayoutSizeToggle } from '@/apps/client/features/table-layout/components/LayoutSizeToggle';
import { FacilityListCard } from '@/apps/client/features/table-layout/components/FacilityListCard';
import { TableListCard } from '@/apps/client/features/table-layout/components/TableListCard';
import { TableLayoutCanvas } from '@/apps/client/features/table-layout/components/TableLayoutCanvas';
import type { LayoutSize } from '@/apps/client/features/table-layout/types';

export function TableLayoutPage() {
  const [layoutSize, setLayoutSize] = useState<LayoutSize>('medium');

  return (
    <section className="table-layout-page" aria-label="테이블 배치 관리">
      <div className="table-layout-page__header">
        <div className="table-layout-page__title-group">
          <p className="table-layout-page__title">테이블 배치 관리</p>
          <p className="table-layout-page__subtitle">
            테이블 사용여부를 '활성'하고 'QR코드'를 등록해야 목록에 표시됩니다.
          </p>
        </div>
        <div className="table-layout-page__actions">
          <LayoutSizeToggle value={layoutSize} onChange={setLayoutSize} />
          <div className="table-layout-page__buttons">
            <Button variant="secondary">리셋</Button>
            <Button variant="outline">초기화</Button>
            <Button variant="primary">저장</Button>
          </div>
        </div>
      </div>

      <div className="table-layout-page__body">
        <div className="table-layout-page__sidebar">
          <FacilityListCard />
          <TableListCard />
        </div>
        <TableLayoutCanvas layoutSize={layoutSize} />
      </div>
    </section>
  );
}
