import './TableListCard.css';
import { Icon } from '@/shared/assets/icons/Icon';
import { TableCard, TableCardContentState } from '@/shared/components/table';
import type { TableGuiResponse } from '@/generated/types/tableGuiResponse';

type TableListCardProps = {
  tables: TableGuiResponse[];
  placedTableSysIds: Set<string>;
  isLoading: boolean;
  isError: boolean;
  onPlaceTable: (table: TableGuiResponse) => void;
};

export function TableListCard({ tables, placedTableSysIds, isLoading, isError, onPlaceTable }: TableListCardProps) {
  return (
    <TableCard title="테이블 리스트" ariaLabel="테이블 리스트" className="table-list-card">
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle="테이블 목록을 불러오는 중입니다."
      >
        <ul className="table-list-card__list">
          {tables.map((table, index) => {
            const isPlaced = Boolean(table.sysId && placedTableSysIds.has(table.sysId));
            return (
              <li key={table.sysId ?? index} className="table-list-card__item">
                <button
                  type="button"
                  className="table-list-card__button"
                  disabled={isPlaced}
                  onClick={() => onPlaceTable(table)}
                >
                  <span className="table-list-card__main">
                    <span className="table-list-card__index">{index + 1}</span>
                    <span className="table-list-card__name">{table.tableName || '테이블 명칭'}</span>
                  </span>
                  <span className="table-list-card__qty">
                    <Icon id="i-seat" size={16} />
                    {table.tableQty}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </TableCardContentState>
    </TableCard>
  );
}
