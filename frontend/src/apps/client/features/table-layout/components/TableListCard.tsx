import './TableListCard.css';
import { Icon } from '@/shared/assets/icons/Icon';
import { TableCard, TableCardContentState } from '@/shared/components/table';
import { mapToStoreTableModel, useStoreTableQuery } from '@/apps/client/features/store-table/api/storeTableApi';

export function TableListCard() {
  const storeTableQuery = useStoreTableQuery();
  const rows = (storeTableQuery.data ?? []).map(mapToStoreTableModel);

  return (
    <TableCard title="테이블 리스트" ariaLabel="테이블 리스트" className="table-list-card">
      <TableCardContentState
        isLoading={storeTableQuery.isLoading}
        isError={storeTableQuery.isError}
        loadingTitle="테이블 목록을 불러오는 중입니다."
      >
        <ul className="table-list-card__list">
          {rows.map((row, index) => (
            <li key={row.id} className="table-list-card__item">
              <span className="table-list-card__main">
                <span className="table-list-card__index">{index + 1}</span>
                <span className="table-list-card__name">{row.tableName || '테이블 명칭'}</span>
              </span>
              <span className="table-list-card__qty">
                <Icon id="i-seat" size={16} />
                {row.tableQty}
              </span>
            </li>
          ))}
        </ul>
      </TableCardContentState>
    </TableCard>
  );
}
