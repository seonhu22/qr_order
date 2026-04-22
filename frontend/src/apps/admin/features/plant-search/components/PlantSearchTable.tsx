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

/**
 * 사업장 조회 결과 테이블
 *
 * @description
 * - 목록 렌더링과 상태별 메시지(로딩/에러/빈 결과)만 담당한다.
 * - 데이터 조회와 검색 조건 관리는 상위 hook에서 처리한다.
 */
export function PlantSearchTable({ rows, isLoading, isError }: PlantSearchTableProps) {
  const columns = createPlantSearchTableColumns();
  const tableRows = createPlantSearchTableRows(rows);

  return (
    <TableCard title="사업장 목록" ariaLabel="사업장 목록" className="plant-search-table">
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        isEmpty={rows.length === 0}
        loadingTitle="사업장 목록을 불러오는 중입니다."
        errorTitle="불러오는데 실패했습니다"
        emptyTitle="검색 결과가 없습니다."
      >
        <TableBodyRenderer
          tableAriaLabel="사업장 목록 테이블"
          columns={columns}
          rows={tableRows}
          emptyMessage="검색 결과가 없습니다."
        />
      </TableCardContentState>
    </TableCard>
  );
}
