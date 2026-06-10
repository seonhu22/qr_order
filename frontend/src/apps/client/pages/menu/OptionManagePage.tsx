import './OptionManagePage.css';
import { useMemo, useState } from 'react';
import { EditTableButton } from '@/shared/components/button';
import { TextInput } from '@/shared/components/input';
import { SimpleDefaultModal } from '@/shared/components/modal';
import { TableBodyRenderer, TableCard } from '@/shared/components/table';
import type { SharedTableColumn, SharedTableRow } from '@/shared/components/table';
import {
  MENU_OPTION_GROUP_ROWS,
  MENU_OPTION_ITEM_ROWS,
} from '@/apps/client/features/menu-manage/mock/menuManageMock';
import type { MenuOptionItem } from '@/apps/client/features/menu-manage/types';

const GROUP_COLUMNS: SharedTableColumn[] = [
  { key: 'name', label: '옵션 그룹', tdClassName: 'common-table__cell--left' },
  { key: 'valueType', label: '옵션/수량', className: 'common-table__col--md' },
  { key: 'required', label: '필수 여부', className: 'common-table__col--md' },
  { key: 'useYn', label: '사용 여부', className: 'common-table__col--md' },
];

const ITEM_COLUMNS: SharedTableColumn[] = [
  { key: 'name', label: '옵션 항목', tdClassName: 'common-table__cell--left' },
  { key: 'valueType', label: '옵션/수량', className: 'common-table__col--md' },
  { key: 'price', label: '추가 금액', className: 'common-table__col--md' },
  { key: 'quantity', label: '수량', className: 'common-table__col--md' },
  { key: 'useYn', label: '사용 여부', className: 'common-table__col--md' },
  { key: 'edit', label: '', className: 'common-table__col--action', ariaLabel: '수정' },
];

export function OptionManagePage() {
  const [selectedGroupId, setSelectedGroupId] = useState(MENU_OPTION_GROUP_ROWS[0]?.id ?? '');
  const [editingItem, setEditingItem] = useState<MenuOptionItem | null>(null);

  const groupRows: SharedTableRow[] = MENU_OPTION_GROUP_ROWS.map((group) => ({
    id: group.id,
    selected: selectedGroupId === group.id,
    onSelect: () => setSelectedGroupId(group.id),
    cells: {
      name: { type: 'text', value: group.name, className: 'common-table__cell--truncate', title: group.name },
      valueType: { type: 'text', value: group.valueType },
      required: { type: 'useYnBadge', value: group.required },
      useYn: { type: 'useYnBadge', value: group.useYn },
    },
  }));

  const itemRows = useMemo(
    () => MENU_OPTION_ITEM_ROWS.filter((item) => item.groupId === selectedGroupId),
    [selectedGroupId],
  );

  const optionRows: SharedTableRow[] = itemRows.map((item) => ({
    id: item.id,
    cells: {
      name: { type: 'text', value: item.name, className: 'common-table__cell--truncate', title: item.name },
      valueType: { type: 'text', value: item.valueType },
      price: { type: 'text', value: item.price.toLocaleString() },
      quantity: { type: 'text', value: String(item.quantity) },
      useYn: { type: 'useYnBadge', value: item.useYn },
      edit: {
        type: 'custom',
        render: () => (
          <EditTableButton
            ariaLabel={`${item.name} 수정`}
            onClick={() => setEditingItem(item)}
          />
        ),
      },
    },
  }));

  return (
    <section className="option-manage-page" aria-label="옵션 관리">
      <div className="option-manage-page__grid">
        <TableCard title="옵션 그룹 목록" ariaLabel="옵션 그룹 목록">
          <TableBodyRenderer
            tableAriaLabel="옵션 그룹 목록 테이블"
            tableClassName="common-table option-manage-page__group-table"
            columns={GROUP_COLUMNS}
            rows={groupRows}
            emptyMessage="조회된 옵션 그룹이 없습니다."
          />
        </TableCard>

        <TableCard title="옵션 항목 목록" ariaLabel="옵션 항목 목록">
          <TableBodyRenderer
            tableAriaLabel="옵션 항목 목록 테이블"
            tableClassName="common-table option-manage-page__item-table"
            columns={ITEM_COLUMNS}
            rows={optionRows}
            emptyMessage="조회된 옵션 항목이 없습니다."
          />
        </TableCard>
      </div>

      <SimpleDefaultModal
        open={editingItem !== null}
        title="옵션 항목 수정"
        description={
          <div className="option-manage-page__modal-fields">
            <TextInput label="옵션 항목 명" value={editingItem?.name ?? ''} size="md" readOnly />
            <TextInput label="옵션/수량" value={editingItem?.valueType ?? ''} size="md" readOnly />
          </div>
        }
        primaryAction={{ label: '저장', onClick: () => setEditingItem(null) }}
        secondaryAction={{ onClick: () => setEditingItem(null) }}
        onClose={() => setEditingItem(null)}
      />
    </section>
  );
}
