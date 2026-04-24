import { TableBodyRenderer, TableCard, TableCardContentState } from '@/shared/components/table';
import type { InquiryManageRow } from '../types';
import {
  createInquiryManageTableColumns,
  createInquiryManageTableRows,
} from './inquiryManageTableModel';

type InquiryManageTableProps = {
  rows: InquiryManageRow[];
  isLoading: boolean;
  isError: boolean;
  onDetail: (row: InquiryManageRow) => void;
};

export function InquiryManageTable({ rows, isLoading, isError, onDetail }: InquiryManageTableProps) {
  const columns = createInquiryManageTableColumns();
  const tableRows = createInquiryManageTableRows(rows, onDetail);

  return (
    <TableCard title="문의사항 목록" ariaLabel="문의사항 목록" className="inquiry-manage-table">
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle="문의사항 목록을 불러오는 중입니다."
      >
        <TableBodyRenderer
          tableAriaLabel="문의사항 목록 테이블"
          columns={columns}
          rows={tableRows}
        />
      </TableCardContentState>
    </TableCard>
  );
}