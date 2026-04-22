import { CheckboxInput } from '@/shared/components/checkbox/CheckboxInput';
import { EditTableButton } from '@/shared/components/button';
import { MasterTableActions, TableCard, TableCardContentState } from '@/shared/components/table';
import type { NoticeManageRow } from '../types';

type NoticeManageTableProps = {
  rows: NoticeManageRow[];
  isLoading?: boolean;
  isError?: boolean;
  checkedIds: string[];
  isAllChecked: boolean;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  onCreate: () => void;
  onDelete: () => void;
  onEdit: (row: NoticeManageRow) => void;
};

export function NoticeManageTable({
  rows,
  isLoading = false,
  isError = false,
  checkedIds,
  isAllChecked,
  onToggleRow,
  onToggleAll,
  onCreate,
  onDelete,
  onEdit,
}: NoticeManageTableProps) {
  return (
    <TableCard
      title="공지사항 목록"
      ariaLabel="공지사항 목록"
      actions={<MasterTableActions onCreate={onCreate} onDelete={onDelete} />}
    >
      <TableCardContentState
        isLoading={isLoading}
        isError={isError}
        loadingTitle="공지사항 목록을 불러오는 중입니다."
        errorDescription="다시 한번 시도해주세요."
        isEmpty={!isLoading && !isError && rows.length === 0}
        emptyDescription="등록된 공지사항이 없습니다."
      >
        <div className="common-table-wrap">
          <table className="common-table" aria-label="공지사항 목록 테이블">
            <colgroup>
              <col className="common-table__col--checkbox" />
              <col style={{ width: '14rem' }} />
              <col />
              <col style={{ width: '8rem' }} />
              <col style={{ width: '9rem' }} />
              <col style={{ width: '9rem' }} />
              <col className="common-table__col--action" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" aria-label="선택">
                  <span className="common-table__checkbox">
                    <CheckboxInput
                      size="sm"
                      checked={isAllChecked}
                      indeterminate={checkedIds.length > 0 && !isAllChecked}
                      aria-label="전체 선택"
                      onChange={onToggleAll}
                    />
                  </span>
                </th>
                <th scope="col">제목</th>
                <th scope="col">내용</th>
                <th scope="col">등록자</th>
                <th scope="col">등록일자</th>
                <th scope="col">수정일자</th>
                <th scope="col" aria-label="수정" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="common-table__checkbox">
                      <CheckboxInput
                        size="sm"
                        checked={checkedIds.includes(row.id)}
                        aria-label={`${row.title} 선택`}
                        onChange={() => onToggleRow(row.id)}
                      />
                    </span>
                  </td>
                  <td className="common-table__cell--left common-table__cell--truncate" title={row.title}>
                    {row.title || '-'}
                  </td>
                  <td className="common-table__cell--left common-table__cell--truncate" title={row.content}>
                    {row.content || '-'}
                  </td>
                  <td className="common-table__cell--center">{row.registrant || '-'}</td>
                  <td className="common-table__cell--center">{row.registeredAt || '-'}</td>
                  <td className="common-table__cell--center">{row.updatedAt || '-'}</td>
                  <td>
                    <EditTableButton
                      ariaLabel={`${row.title} 수정`}
                      onClick={() => onEdit(row)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableCardContentState>
    </TableCard>
  );
}