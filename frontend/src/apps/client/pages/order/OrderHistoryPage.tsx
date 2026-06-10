import './OrderHistoryPage.css';
import { useMemo, useState } from 'react';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';
import { TableBodyRenderer, TableCard } from '@/shared/components/table';
import type { SharedTableColumn, SharedTableRow } from '@/shared/components/table';
import {
  ORDER_HISTORY_DETAIL_ROWS,
  ORDER_HISTORY_MASTER_ROWS,
} from '@/apps/client/features/order-history/mock/orderHistoryMock';

const MASTER_COLUMNS: SharedTableColumn[] = [
  { key: 'orderNo', label: '주문 번호', tdClassName: 'common-table__cell--left' },
  { key: 'tableNumber', label: '테이블 번호', className: 'common-table__col--md' },
  { key: 'orderedAt', label: '주문 일시', className: 'common-table__col--lg' },
  { key: 'totalAmount', label: '결제 금액', className: 'common-table__col--md' },
  { key: 'status', label: '상태', className: 'common-table__col--md' },
];

const DETAIL_COLUMNS: SharedTableColumn[] = [
  { key: 'menuName', label: '메뉴 명', tdClassName: 'common-table__cell--left' },
  { key: 'quantity', label: '수량', className: 'common-table__col--sm' },
  { key: 'optionSummary', label: '옵션', tdClassName: 'common-table__cell--left' },
  { key: 'amount', label: '금액', className: 'common-table__col--md' },
];

function includesKeyword(orderNo: string, tableNumber: number, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return true;
  return orderNo.toLowerCase().includes(normalizedKeyword) || `${tableNumber}번`.includes(normalizedKeyword);
}

export function OrderHistoryPage() {
  const [draftKeyword, setDraftKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');

  const masterRows = useMemo(
    () =>
      ORDER_HISTORY_MASTER_ROWS.filter((row) =>
        includesKeyword(row.orderNo, row.tableNumber, appliedKeyword),
      ),
    [appliedKeyword],
  );
  const [selectedOrderId, setSelectedOrderId] = useState(ORDER_HISTORY_MASTER_ROWS[0]?.id ?? '');
  const effectiveSelectedOrderId = masterRows.some((row) => row.id === selectedOrderId)
    ? selectedOrderId
    : masterRows[0]?.id;

  const tableRows: SharedTableRow[] = masterRows.map((row) => ({
    id: row.id,
    selected: row.id === effectiveSelectedOrderId,
    onSelect: () => setSelectedOrderId(row.id),
    cells: {
      orderNo: { type: 'text', value: row.orderNo, className: 'common-table__mono', title: row.orderNo },
      tableNumber: { type: 'text', value: `${row.tableNumber}번` },
      orderedAt: { type: 'text', value: row.orderedAt },
      totalAmount: { type: 'text', value: row.totalAmount.toLocaleString() },
      status: { type: 'text', value: row.status },
    },
  }));

  const detailRows: SharedTableRow[] = ORDER_HISTORY_DETAIL_ROWS
    .filter((row) => row.orderId === effectiveSelectedOrderId)
    .map((row) => ({
      id: row.id,
      cells: {
        menuName: { type: 'text', value: row.menuName, title: row.menuName, className: 'common-table__cell--truncate' },
        quantity: { type: 'text', value: String(row.quantity) },
        optionSummary: { type: 'text', value: row.optionSummary, title: row.optionSummary },
        amount: { type: 'text', value: row.amount.toLocaleString() },
      },
    }));

  return (
    <section className="order-history-page" aria-label="주문 이력 조회">
      <SearchFilterCard
        ariaLabel="주문 이력 검색"
        inputId="order-history-search-keyword"
        inputAriaLabel="주문 이력 검색어"
        placeholder="주문 번호, 테이블 번호로 검색"
        draftKeyword={draftKeyword}
        onKeywordChange={setDraftKeyword}
        onSearch={() => setAppliedKeyword(draftKeyword)}
        onReset={() => {
          setDraftKeyword('');
          setAppliedKeyword('');
          setSelectedOrderId(ORDER_HISTORY_MASTER_ROWS[0]?.id ?? '');
        }}
      />

      <div className="order-history-page__grid">
        <TableCard title="주문 이력 목록" ariaLabel="주문 이력 목록">
          <TableBodyRenderer
            tableAriaLabel="주문 이력 목록 테이블"
            tableClassName="common-table order-history-page__master-table"
            columns={MASTER_COLUMNS}
            rows={tableRows}
            emptyMessage="조회된 주문 이력이 없습니다."
          />
        </TableCard>
        <TableCard title="주문 상세 목록" ariaLabel="주문 상세 목록">
          <TableBodyRenderer
            tableAriaLabel="주문 상세 목록 테이블"
            tableClassName="common-table order-history-page__detail-table"
            columns={DETAIL_COLUMNS}
            rows={detailRows}
            emptyMessage="선택된 주문 상세가 없습니다."
          />
        </TableCard>
      </div>
    </section>
  );
}
