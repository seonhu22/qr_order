import './BoardPages.css';
import { useState } from 'react';
import { EditTableButton } from '@/shared/components/button';
import { SimpleDefaultModal } from '@/shared/components/modal';
import { TableBodyRenderer, TableCard } from '@/shared/components/table';
import type { SharedTableColumn, SharedTableRow } from '@/shared/components/table';
import { CLIENT_NOTICE_ROWS } from '@/apps/client/features/board/mock/boardMock';
import type { ClientNotice } from '@/apps/client/features/board/types';

const COLUMNS: SharedTableColumn[] = [
  { key: 'title', label: '제목', tdClassName: 'common-table__cell--left' },
  { key: 'createdAt', label: '등록일', className: 'common-table__col--lg' },
  { key: 'writer', label: '작성자', className: 'common-table__col--md' },
  { key: 'useYn', label: '사용 여부', className: 'common-table__col--md' },
  { key: 'detail', label: '', className: 'common-table__col--action', ariaLabel: '조회' },
];

export function NoticeListPage() {
  const [selectedNotice, setSelectedNotice] = useState<ClientNotice | null>(null);
  const rows: SharedTableRow[] = CLIENT_NOTICE_ROWS.map((notice) => ({
    id: notice.id,
    cells: {
      title: { type: 'text', value: notice.title, title: notice.title, className: 'common-table__cell--truncate' },
      createdAt: { type: 'text', value: notice.createdAt },
      writer: { type: 'text', value: notice.writer },
      useYn: { type: 'useYnBadge', value: notice.useYn },
      detail: {
        type: 'custom',
        render: () => (
          <EditTableButton
            ariaLabel={`${notice.title} 조회`}
            onClick={() => setSelectedNotice(notice)}
          />
        ),
      },
    },
  }));

  return (
    <section className="board-page" aria-label="공지사항 조회">
      <TableCard title="공지사항 목록" ariaLabel="공지사항 목록">
        <TableBodyRenderer
          tableAriaLabel="공지사항 목록 테이블"
          tableClassName="common-table board-page__table"
          columns={COLUMNS}
          rows={rows}
          emptyMessage="조회된 공지사항이 없습니다."
        />
      </TableCard>
      <SimpleDefaultModal
        open={selectedNotice !== null}
        title="공지사항 조회"
        description={selectedNotice?.content ?? ''}
        primaryAction={{ label: '확인', onClick: () => setSelectedNotice(null) }}
        onClose={() => setSelectedNotice(null)}
      />
    </section>
  );
}
