import './QRCodeManagePage.css';
import { useMemo, useState } from 'react';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';
import { QRCodeTable } from '@/apps/client/features/store-table/components/QRCodeTable';
import {
  STORE_QR_CODE_MOCK_ROWS,
  STORE_TABLE_INFO_MOCK_ROWS,
} from '@/apps/client/features/store-table/mock/storeTableMock';

function matchesKeyword(description: string, url: string, qrCode: string, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return true;

  return (
    description.toLowerCase().includes(normalizedKeyword) ||
    url.toLowerCase().includes(normalizedKeyword) ||
    qrCode.toLowerCase().includes(normalizedKeyword)
  );
}

export function QRCodeManagePage() {
  const [draftKeyword, setDraftKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [qrRows, setQrRows] = useState(STORE_QR_CODE_MOCK_ROWS);

  const rows = useMemo(
    () =>
      qrRows.filter((row) =>
        matchesKeyword(row.description, row.url, row.qrCode, appliedKeyword),
      ),
    [appliedKeyword, qrRows],
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

  const changeTableNumber = (rowId: string, tableNumber: number) => {
    setQrRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, tableNumber } : row)),
    );
  };

  const resetSearch = () => {
    setDraftKeyword('');
    setAppliedKeyword('');
    setSelectedRowIds(new Set());
  };

  return (
    <section className="qr-code-manage-page" aria-label="QR 코드 관리">
      <SearchFilterCard
        ariaLabel="QR 코드 검색"
        inputId="qr-code-search-keyword"
        inputAriaLabel="QR 코드 검색어"
        placeholder="QR 코드, 설명, URL로 검색"
        draftKeyword={draftKeyword}
        onKeywordChange={setDraftKeyword}
        onSearch={() => {
          setAppliedKeyword(draftKeyword);
          setSelectedRowIds(new Set());
        }}
        onReset={resetSearch}
      />

      <QRCodeTable
        rows={rows}
        tableRows={STORE_TABLE_INFO_MOCK_ROWS}
        selectedRowIds={selectedRowIds}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        onCreate={() => {}}
        onDelete={() => setSelectedRowIds(new Set())}
        onChangeTableNumber={changeTableNumber}
        onEdit={() => {}}
      />
    </section>
  );
}
