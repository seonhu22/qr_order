import './SettlementPage.css';
import { useMemo, useState } from 'react';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';
import { TableBodyRenderer, TableCard } from '@/shared/components/table';
import type { SharedTableColumn, SharedTableRow } from '@/shared/components/table';
import { SETTLEMENT_HISTORY_ROWS } from '@/apps/client/features/payment-status/mock/paymentStatusMock';

const COLUMNS: SharedTableColumn[] = [
  { key: 'settlementNo', label: '정산 번호', tdClassName: 'common-table__cell--left' },
  { key: 'businessDate', label: '영업일', className: 'common-table__col--lg' },
  { key: 'orderCount', label: '주문 건수', className: 'common-table__col--md' },
  { key: 'paymentAmount', label: '결제 금액', className: 'common-table__col--md' },
  { key: 'feeAmount', label: '수수료', className: 'common-table__col--md' },
  { key: 'settlementAmount', label: '정산 금액', className: 'common-table__col--md' },
];

function sumSettlementAmount() {
  return SETTLEMENT_HISTORY_ROWS.reduce((sum, row) => sum + row.settlementAmount, 0);
}

export function SettlementPage() {
  const [draftKeyword, setDraftKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const normalizedKeyword = appliedKeyword.trim().toLowerCase();
  const rows = useMemo(
    () =>
      SETTLEMENT_HISTORY_ROWS.filter((row) => {
        if (!normalizedKeyword) return true;
        return (
          row.settlementNo.toLowerCase().includes(normalizedKeyword) ||
          row.businessDate.includes(normalizedKeyword)
        );
      }),
    [normalizedKeyword],
  );

  const tableRows: SharedTableRow[] = rows.map((row) => ({
    id: row.id,
    cells: {
      settlementNo: { type: 'text', value: row.settlementNo, className: 'common-table__mono', title: row.settlementNo },
      businessDate: { type: 'text', value: row.businessDate },
      orderCount: { type: 'text', value: `${row.orderCount}건` },
      paymentAmount: { type: 'text', value: row.paymentAmount.toLocaleString() },
      feeAmount: { type: 'text', value: row.feeAmount.toLocaleString() },
      settlementAmount: { type: 'text', value: row.settlementAmount.toLocaleString() },
    },
  }));

  return (
    <section className="settlement-page" aria-label="정산 조회">
      <div className="settlement-page__summary" aria-label="정산 요약">
        <span>총 정산 금액</span>
        <strong>{sumSettlementAmount().toLocaleString()}</strong>
      </div>
      <SearchFilterCard
        ariaLabel="정산 검색"
        inputId="settlement-search-keyword"
        inputAriaLabel="정산 검색어"
        placeholder="정산 번호, 영업일로 검색"
        draftKeyword={draftKeyword}
        onKeywordChange={setDraftKeyword}
        onSearch={() => setAppliedKeyword(draftKeyword)}
        onReset={() => {
          setDraftKeyword('');
          setAppliedKeyword('');
        }}
      />
      <TableCard title="정산 목록" ariaLabel="정산 목록">
        <TableBodyRenderer
          tableAriaLabel="정산 목록 테이블"
          tableClassName="common-table settlement-page__table"
          columns={COLUMNS}
          rows={tableRows}
          emptyMessage="조회된 정산 내역이 없습니다."
        />
      </TableCard>
    </section>
  );
}
