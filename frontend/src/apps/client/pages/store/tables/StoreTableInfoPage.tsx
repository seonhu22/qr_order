import './StoreTableInfoPage.css';
import { useMemo, useState } from 'react';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';
import { TextInput } from '@/shared/components/input';
import { SimpleDefaultModal } from '@/shared/components/modal';
import { StoreTableInfoTable } from '@/apps/client/features/store-table/components/StoreTableInfoTable';
import { STORE_TABLE_INFO_MOCK_ROWS } from '@/apps/client/features/store-table/mock/storeTableMock';
import type { StoreTableInfo } from '@/apps/client/features/store-table/types';

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
  const [tableRows, setTableRows] = useState<StoreTableInfo[]>(STORE_TABLE_INFO_MOCK_ROWS);
  const [editingRow, setEditingRow] = useState<StoreTableInfo | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const rows = useMemo(
    () =>
      tableRows.filter((row) =>
        matchesKeyword(row.tableName, row.tableNumber, appliedKeyword),
      ),
    [appliedKeyword, tableRows],
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
        onCreate={() => setIsCreateOpen(true)}
        onDelete={() => {
          setTableRows((prev) => prev.filter((row) => !selectedRowIds.has(row.id)));
          setSelectedRowIds(new Set());
        }}
        onEdit={(rowId) => {
          setEditingRow(tableRows.find((row) => row.id === rowId) ?? null);
        }}
      />

      <SimpleDefaultModal
        open={isCreateOpen}
        title="테이블 신규"
        description={
          <div className="store-table-info-page__modal-fields">
            <TextInput label="테이블 번호" defaultValue={String(tableRows.length + 1)} size="md" />
            <TextInput label="테이블 명" defaultValue="신규 테이블" size="md" />
          </div>
        }
        primaryAction={{
          label: '저장',
          onClick: () => {
            const nextNumber = Math.max(...tableRows.map((row) => row.tableNumber), 0) + 1;
            setTableRows((prev) => [
              ...prev,
              {
                id: `table-${nextNumber}`,
                tableNumber: nextNumber,
                tableName: '신규 테이블',
                seatCount: 4,
                useYn: 'Y',
              },
            ]);
            setIsCreateOpen(false);
          },
        }}
        secondaryAction={{ onClick: () => setIsCreateOpen(false) }}
        onClose={() => setIsCreateOpen(false)}
      />

      <SimpleDefaultModal
        open={editingRow !== null}
        title="테이블 수정"
        description={
          <div className="store-table-info-page__modal-fields">
            <TextInput label="테이블 번호" value={editingRow ? `${editingRow.tableNumber}번` : ''} size="md" readOnly />
            <TextInput label="테이블 명" value={editingRow?.tableName ?? ''} size="md" readOnly />
          </div>
        }
        primaryAction={{ label: '저장', onClick: () => setEditingRow(null) }}
        secondaryAction={{ onClick: () => setEditingRow(null) }}
        onClose={() => setEditingRow(null)}
      />
    </section>
  );
}
