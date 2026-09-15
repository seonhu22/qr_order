import { TableCard, TableCardContentState } from '@/shared/components/table';
import { CreateTableButton } from '@/shared/components/button';
import { useClickableRow } from '@/shared/hooks/useClickableRow';
import type { InquiryListRow } from '../types';

const ANSWER_STATUS_LABEL: Record<InquiryListRow['answerStatus'], string> = {
  answered: '답변',
  pending: '미답변',
};

type InquiryListTableProps = {
  rows: InquiryListRow[];
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
  onRowClick: (row: InquiryListRow) => void;
  onCreate: () => void;
};

export function InquiryListTable({
  rows,
  isLoading = false,
  isError = false,
  className,
  onRowClick,
  onCreate,
}: InquiryListTableProps) {
  const { getRowProps } = useClickableRow<InquiryListRow>(onRowClick);

  return (
    <TableCard
      title="문의사항 목록"
      ariaLabel="문의사항 목록"
      className={className}
      actions={<CreateTableButton onClick={onCreate} />}
    >
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle="문의사항 목록을 불러오는 중입니다."
      >
        <div className="common-table-wrap">
          <table className="common-table" aria-label="문의사항 목록 테이블">
            <colgroup>
              <col />
              <col style={{ width: '8rem' }} />
              <col style={{ width: '10rem' }} />
              <col style={{ width: '7rem' }} />
              <col style={{ width: '10rem' }} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">제목</th>
                <th scope="col">작성자</th>
                <th scope="col">등록일자</th>
                <th scope="col">답변상태</th>
                <th scope="col">답변일자</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="common-table__empty">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} {...getRowProps(row, `${row.title} 상세 보기`)}>
                    <td
                      className="common-table__cell--left common-table__cell--truncate"
                      title={row.title}
                    >
                      {row.title || '-'}
                    </td>
                    <td className="common-table__cell--center">{row.registrant || '-'}</td>
                    <td className="common-table__cell--center">{row.registeredAt || '-'}</td>
                    <td className="common-table__cell--center">
                      <span
                        className={`inquiry-answer-badge inquiry-answer-badge--${row.answerStatus}`}
                      >
                        {ANSWER_STATUS_LABEL[row.answerStatus]}
                      </span>
                    </td>
                    <td className="common-table__cell--center">{row.answeredAt || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </TableCardContentState>
    </TableCard>
  );
}
