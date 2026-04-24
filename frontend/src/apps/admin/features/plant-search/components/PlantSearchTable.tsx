import { TableBodyRenderer, TableCard, TableCardContentState } from '@/shared/components/table';
import type { PlantSearchRow } from '../types';
import {
  createPlantSearchTableColumns,
  createPlantSearchTableRows,
} from './plantSearchTableModel';

type PlantSearchTableProps = {
  rows: PlantSearchRow[];
  isLoading: boolean;
  isError: boolean;
};

export function PlantSearchTable({ rows, isLoading, isError }: PlantSearchTableProps) {
  const columns = createPlantSearchTableColumns();
  const tableRows = createPlantSearchTableRows(rows);

  return (
    <TableCard title="사업장 목록" ariaLabel="사업장 목록" className="plant-search-table">
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle="사업장 목록을 불러오는 중입니다."
      >
        <TableBodyRenderer
          tableAriaLabel="사업장 목록 테이블"
          columns={columns}
          rows={tableRows}
        />
      </TableCardContentState>
    </TableCard>
  );
}
