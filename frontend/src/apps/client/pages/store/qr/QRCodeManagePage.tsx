import './QRCodeManagePage.css';
import { useMemo, useState } from 'react';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';
import { TextInput } from '@/shared/components/input';
import { SimpleDefaultModal } from '@/shared/components/modal';
import { QRCodeTable } from '@/apps/client/features/store-table/components/QRCodeTable';
import {
  STORE_QR_CODE_MOCK_ROWS,
  STORE_TABLE_INFO_MOCK_ROWS,
} from '@/apps/client/features/store-table/mock/storeTableMock';
import type { StoreQRCode } from '@/apps/client/features/store-table/types';

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
  const [editingRow, setEditingRow] = useState<StoreQRCode | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
        onCreate={() => setIsCreateOpen(true)}
        onDelete={() => {
          setQrRows((prev) => prev.filter((row) => !selectedRowIds.has(row.id)));
          setSelectedRowIds(new Set());
        }}
        onChangeTableNumber={changeTableNumber}
        onEdit={(rowId) => {
          setEditingRow(qrRows.find((row) => row.id === rowId) ?? null);
        }}
      />

      <SimpleDefaultModal
        open={isCreateOpen}
        title="QR 코드 신규"
        description={
          <div className="qr-code-manage-page__modal-fields">
            <TextInput label="QR 코드" defaultValue={`QR-${String(qrRows.length + 1).padStart(3, '0')}`} size="md" />
            <TextInput label="설명" defaultValue="신규 QR" size="md" />
          </div>
        }
        primaryAction={{
          label: '저장',
          onClick: () => {
            const nextNumber = qrRows.length + 1;
            setQrRows((prev) => [
              ...prev,
              {
                id: `qr-${nextNumber}`,
                qrCode: `QR-${String(nextNumber).padStart(3, '0')}`,
                tableNumber: STORE_TABLE_INFO_MOCK_ROWS[0]?.tableNumber ?? 1,
                description: '신규 QR',
                url: `https://qr.order.local/table/${nextNumber}`,
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
        title="QR 코드 수정"
        description={
          <div className="qr-code-manage-page__modal-fields">
            <TextInput label="QR 코드" value={editingRow?.qrCode ?? ''} size="md" readOnly />
            <TextInput label="설명" value={editingRow?.description ?? ''} size="md" readOnly />
          </div>
        }
        primaryAction={{ label: '저장', onClick: () => setEditingRow(null) }}
        secondaryAction={{ onClick: () => setEditingRow(null) }}
        onClose={() => setEditingRow(null)}
      />
    </section>
  );
}
