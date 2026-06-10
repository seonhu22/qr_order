import type { SharedTableColumn, SharedTableRow } from '@/shared/components/table';
import type { InquiryManageRow } from '../types';

const ANSWER_STATUS_LABEL: Record<InquiryManageRow['answerStatus'], string> = {
  answered: '답변완료',
  pending: '미답변',
};

export function createInquiryManageTableColumns(): SharedTableColumn[] {
  return [
    {
      key: 'title',
      label: '제목',
      className: 'inquiry-manage-table__col--title',
      tdClassName: 'common-table__cell--left',
    },
    { key: 'plant',       label: '사업장' },
    { key: 'registrant',  label: '등록자',  tdClassName: 'common-table__cell--center' },
    { key: 'registeredAt', label: '등록일자', tdClassName: 'common-table__cell--center' },
    { key: 'updatedAt',   label: '수정일자', tdClassName: 'common-table__cell--center' },
    { key: 'answeredAt',  label: '답변일자', tdClassName: 'common-table__cell--center' },
    { key: 'answerer',    label: '답변자',  tdClassName: 'common-table__cell--center' },
    { key: 'answerStatus', label: '답변상태', className: 'common-table__col--md' },
    { key: 'action',      label: '',        className: 'common-table__col--action' },
  ];
}

export function createInquiryManageTableRows(
  rows: InquiryManageRow[],
  onDetail: (row: InquiryManageRow) => void,
): SharedTableRow[] {
  return rows.map((row) => ({
    id: row.id,
    cells: {
      title: {
        type: 'text',
        value: row.title,
        className: 'common-table__cell--truncate inquiry-manage-table__title-text',
        title: row.title,
      },
      plant: {
        type: 'text',
        value: row.plant,
        className: 'common-table__cell--truncate',
        title: row.plant,
      },
      registrant: {
        type: 'text',
        value: row.registrant,
      },
      registeredAt: {
        type: 'text',
        value: row.registeredAt,
      },
      updatedAt: {
        type: 'text',
        value: row.updatedAt,
      },
      answeredAt: {
        type: 'text',
        value: row.answeredAt,
      },
      answerer: {
        type: 'text',
        value: row.answerer,
      },
      answerStatus: {
        type: 'custom',
        render: () => (
          <span className={`inquiry-answer-badge inquiry-answer-badge--${row.answerStatus}`}>
            {ANSWER_STATUS_LABEL[row.answerStatus]}
          </span>
        ),
      },
      action: {
        type: 'editButton',
        ariaLabel: `${row.title} 상세 보기`,
        onClick: () => onDetail(row),
      },
    },
  }));
}
