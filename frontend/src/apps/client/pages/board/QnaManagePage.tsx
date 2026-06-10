import './BoardPages.css';
import { useState } from 'react';
import { Button, EditTableButton } from '@/shared/components/button';
import { FormAlert } from '@/shared/components/form-alert';
import { TextInput, TextareaInput } from '@/shared/components/input';
import { SimpleDefaultModal, WrapperModal } from '@/shared/components/modal';
import { TableBodyRenderer, TableCard } from '@/shared/components/table';
import type { SharedTableColumn, SharedTableRow } from '@/shared/components/table';
import { CLIENT_QNA_ROWS } from '@/apps/client/features/board/mock/boardMock';
import type { ClientQna } from '@/apps/client/features/board/types';

const COLUMNS: SharedTableColumn[] = [
  { key: 'title', label: '제목', tdClassName: 'common-table__cell--left' },
  { key: 'createdAt', label: '등록일', className: 'common-table__col--lg' },
  { key: 'status', label: '답변 상태', className: 'common-table__col--md' },
  { key: 'detail', label: '', className: 'common-table__col--action', ariaLabel: '조회' },
];

export function QnaManagePage() {
  const [selectedQna, setSelectedQna] = useState<ClientQna | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const rows: SharedTableRow[] = CLIENT_QNA_ROWS.map((qna) => ({
    id: qna.id,
    cells: {
      title: { type: 'text', value: qna.title, title: qna.title, className: 'common-table__cell--truncate' },
      createdAt: { type: 'text', value: qna.createdAt },
      status: { type: 'text', value: qna.status },
      detail: {
        type: 'custom',
        render: () => (
          <EditTableButton
            ariaLabel={`${qna.title} 조회`}
            onClick={() => setSelectedQna(qna)}
          />
        ),
      },
    },
  }));

  return (
    <section className="board-page" aria-label="문의사항 관리">
      <TableCard
        title="문의사항 목록"
        ariaLabel="문의사항 목록"
        actions={<Button size="sm" onClick={() => setIsCreateOpen(true)}>문의사항 신규</Button>}
      >
        <TableBodyRenderer
          tableAriaLabel="문의사항 목록 테이블"
          tableClassName="common-table board-page__table"
          columns={COLUMNS}
          rows={rows}
          emptyMessage="조회된 문의사항이 없습니다."
        />
      </TableCard>

      <WrapperModal
        open={selectedQna !== null}
        title="문의사항 조회"
        size="sm"
        primaryAction={{ label: '확인', onClick: () => setSelectedQna(null) }}
        onClose={() => setSelectedQna(null)}
      >
        <div className="board-page__modal-content">
          {selectedQna?.status === '답변완료' ? (
            <FormAlert type="success" title="답변 완료된 문의입니다." dismissible={false} />
          ) : null}
          <p>{selectedQna?.content}</p>
          {selectedQna?.answer ? <p>담당자 답변이 등록되었습니다.</p> : null}
        </div>
      </WrapperModal>

      <SimpleDefaultModal
        open={isCreateOpen}
        title="문의사항 신규"
        description={
          <div className="board-page__modal-fields">
            <TextInput label="문의 제목" size="md" />
            <TextareaInput label="문의 내용" resize="vertical" />
          </div>
        }
        primaryAction={{ label: '저장', onClick: () => setIsCreateOpen(false) }}
        secondaryAction={{ onClick: () => setIsCreateOpen(false) }}
        onClose={() => setIsCreateOpen(false)}
      />
    </section>
  );
}
