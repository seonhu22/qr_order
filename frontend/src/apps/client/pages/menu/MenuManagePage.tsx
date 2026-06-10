import './MenuManagePage.css';
import { useMemo, useState } from 'react';
import { Button, EditTableButton } from '@/shared/components/button';
import { SearchFilterCard } from '@/shared/components/filter/SearchFilterCard';
import { TextInput } from '@/shared/components/input';
import { SimpleDefaultModal } from '@/shared/components/modal';
import { TableBodyRenderer, TableCard } from '@/shared/components/table';
import type { SharedTableColumn, SharedTableRow } from '@/shared/components/table';
import { MENU_CATEGORY_ROWS, MENU_ITEM_ROWS } from '@/apps/client/features/menu-manage/mock/menuManageMock';

const CATEGORY_COLUMNS: SharedTableColumn[] = [
  { key: 'name', label: '카테고리 명', tdClassName: 'common-table__cell--left' },
  { key: 'displayOrder', label: '노출 순서', className: 'common-table__col--md' },
  { key: 'useYn', label: '사용 여부', className: 'common-table__col--md' },
  { key: 'edit', label: '', className: 'common-table__col--action', ariaLabel: '수정' },
];

const MENU_COLUMNS: SharedTableColumn[] = [
  { key: 'name', label: '메뉴 명', tdClassName: 'common-table__cell--left' },
  { key: 'category', label: '카테고리', className: 'common-table__col--md' },
  { key: 'price', label: '가격', className: 'common-table__col--md' },
  { key: 'status', label: '판매 상태', className: 'common-table__col--md' },
  { key: 'useYn', label: '사용 여부', className: 'common-table__col--md' },
  { key: 'edit', label: '', className: 'common-table__col--action', ariaLabel: '수정' },
];

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase();
}

export function MenuManagePage() {
  const [draftKeyword, setDraftKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [modalType, setModalType] = useState<'category' | 'menu' | null>(null);

  const categoryNameById = useMemo(
    () => new Map(MENU_CATEGORY_ROWS.map((category) => [category.id, category.name])),
    [],
  );
  const normalizedKeyword = normalizeKeyword(appliedKeyword);

  const categoryRows: SharedTableRow[] = MENU_CATEGORY_ROWS.map((category) => ({
    id: category.id,
    cells: {
      name: { type: 'text', value: category.name, title: category.name, className: 'common-table__cell--truncate' },
      displayOrder: { type: 'text', value: String(category.displayOrder) },
      useYn: { type: 'useYnBadge', value: category.useYn },
      edit: { type: 'custom', render: () => <EditTableButton ariaLabel={`${category.name} 수정`} onClick={() => setModalType('category')} /> },
    },
  }));

  const menuRows: SharedTableRow[] = MENU_ITEM_ROWS
    .filter((menu) => {
      if (!normalizedKeyword) return true;
      return (
        menu.name.toLowerCase().includes(normalizedKeyword) ||
        (categoryNameById.get(menu.categoryId) ?? '').toLowerCase().includes(normalizedKeyword)
      );
    })
    .map((menu) => ({
      id: menu.id,
      cells: {
        name: { type: 'text', value: menu.name, title: menu.name, className: 'common-table__cell--truncate' },
        category: { type: 'text', value: categoryNameById.get(menu.categoryId) ?? '-' },
        price: { type: 'text', value: menu.price.toLocaleString() },
        status: { type: 'text', value: menu.status },
        useYn: { type: 'useYnBadge', value: menu.useYn },
        edit: { type: 'custom', render: () => <EditTableButton ariaLabel={`${menu.name} 수정`} onClick={() => setModalType('menu')} /> },
      },
    }));

  return (
    <section className="menu-manage-page" aria-label="메뉴 관리">
      <SearchFilterCard
        ariaLabel="메뉴 검색"
        inputId="menu-manage-search-keyword"
        inputAriaLabel="메뉴 검색어"
        placeholder="메뉴 명, 카테고리 명으로 검색"
        draftKeyword={draftKeyword}
        onKeywordChange={setDraftKeyword}
        onSearch={() => setAppliedKeyword(draftKeyword)}
        onReset={() => {
          setDraftKeyword('');
          setAppliedKeyword('');
        }}
      />

      <div className="menu-manage-page__grid">
        <TableCard
          title="카테고리 목록"
          ariaLabel="카테고리 목록"
          actions={<Button size="sm" onClick={() => setModalType('category')}>카테고리 신규</Button>}
          actionsClassName="menu-manage-page__table-actions"
        >
          <TableBodyRenderer
            tableAriaLabel="카테고리 목록 테이블"
            tableClassName="common-table menu-manage-page__category-table"
            columns={CATEGORY_COLUMNS}
            rows={categoryRows}
            emptyMessage="조회된 카테고리가 없습니다."
          />
        </TableCard>

        <TableCard
          title="메뉴 목록"
          ariaLabel="메뉴 목록"
          actions={<Button size="sm" onClick={() => setModalType('menu')}>메뉴 신규</Button>}
          actionsClassName="menu-manage-page__table-actions"
        >
          <TableBodyRenderer
            tableAriaLabel="메뉴 목록 테이블"
            tableClassName="common-table menu-manage-page__menu-table"
            columns={MENU_COLUMNS}
            rows={menuRows}
            emptyMessage="조회된 메뉴가 없습니다."
          />
        </TableCard>
      </div>

      <SimpleDefaultModal
        open={modalType === 'category'}
        title="카테고리 신규/수정"
        description={<TextInput label="카테고리 명" defaultValue="커피" size="md" />}
        primaryAction={{ label: '저장', onClick: () => setModalType(null) }}
        secondaryAction={{ onClick: () => setModalType(null) }}
        onClose={() => setModalType(null)}
      />
      <SimpleDefaultModal
        open={modalType === 'menu'}
        title="메뉴 신규/수정"
        description={<TextInput label="메뉴 명" defaultValue="아메리카노" size="md" />}
        primaryAction={{ label: '저장', onClick: () => setModalType(null) }}
        secondaryAction={{ onClick: () => setModalType(null) }}
        onClose={() => setModalType(null)}
      />
    </section>
  );
}
