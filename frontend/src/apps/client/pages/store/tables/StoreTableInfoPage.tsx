import './StoreTableInfoPage.css';
import { useMemo, useState } from 'react';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';
import { StoreTableInfoTable } from '@/apps/client/features/store-table/components/StoreTableInfoTable';
import { STORE_TABLE_INFO_MOCK_ROWS } from '@/apps/client/features/store-table/mock/storeTableMock';

function matchesKeyword(tableName: string, tableNumber: number, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return true;

  return (
    tableName.toLowerCase().includes(normalizedKeyword) ||
    String(tableNumber).includes(normalizedKeyword)
  );
}

export function StoreTableInfoPage() {
  const [draftKeyword, setDraftKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  const rows = useMemo(
    () =>
      STORE_TABLE_INFO_MOCK_ROWS.filter((row) =>
        matchesKeyword(row.tableName, row.tableNumber, appliedKeyword),
      ),
    [appliedKeyword],
  );

  const toggleRow = (rowId: string, checked: boolean) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(rowId);
      else next.delete(rowId);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedRowIds(checked ? new Set(rows.map((row) => row.id)) : new Set());
  };

  const resetSearch = () => {
    setDraftKeyword('');
    setAppliedKeyword('');
    setSelectedRowIds(new Set());
  };

  return (
    <section className="store-table-info-page" aria-label="테이블 관리">
      <SearchFilterCard
        ariaLabel="테이블 검색"
        inputId="store-table-info-search-keyword"
        inputAriaLabel="테이블 검색어"
        placeholder="테이블 번호, 테이블 명으로 검색"
        draftKeyword={draftKeyword}
        onKeywordChange={setDraftKeyword}
        onSearch={() => {
          setAppliedKeyword(draftKeyword);
          setSelectedRowIds(new Set());
        }}
        onReset={resetSearch}
      />

      <StoreTableInfoTable
        rows={rows}
        selectedRowIds={selectedRowIds}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        onCreate={() => {}}
        onDelete={() => setSelectedRowIds(new Set())}
        onEdit={() => {}}
      />
    </section>
  );
}
