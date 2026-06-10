/**
 * @fileoverview 매장 > 유저 관리 > 유저 정보 관리 페이지
 *
 * @description
 * - 화면 조립 + 정적 상태(검색어 / 선택 행)만 담당한다.
 * - API 연동, 저장 흐름, 모달은 후속 단계(Phase 1 chunk 1.1)에서 feature hook으로 이관한다.
 */

import './ClientUserPage.css';
import { useMemo, useState } from 'react';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';
import { ClientUserTable } from '@/apps/client/features/client-user/components/ClientUserTable';
import { CLIENT_USER_MOCK_ROWS } from '@/apps/client/features/client-user/mock/clientUserMock';

export function ClientUserPage() {
  const [keyword, setKeyword] = useState('');
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  const rows = useMemo(() => CLIENT_USER_MOCK_ROWS, []);

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

  return (
    <section className="client-user-page" aria-label="유저 정보 관리">
      <SearchFilterCard
        ariaLabel="유저 검색"
        inputId="client-user-search-keyword"
        inputAriaLabel="유저 검색어"
        placeholder="아이디, 이름 명으로 검색"
        draftKeyword={keyword}
        onKeywordChange={setKeyword}
        onSearch={() => {}}
        onReset={() => setKeyword('')}
      />

      <ClientUserTable
        rows={rows}
        selectedRowIds={selectedRowIds}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        onCreate={() => {}}
        onDelete={() => setSelectedRowIds(new Set())}
        onResetPassword={() => {}}
        onEdit={() => {}}
      />
    </section>
  );
}
