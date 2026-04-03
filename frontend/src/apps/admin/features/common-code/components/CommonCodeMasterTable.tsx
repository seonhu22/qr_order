import { Button } from '@/shared/components/button';
import { CheckboxInput } from '@/shared/components/checkbox';
import { Icon } from '@/shared/assets/icons/Icon';
import type { MasterCode } from '../types';

type CommonCodeMasterTableProps = {
  rows: MasterCode[];
  selectedMasterId: string;
  checkedMasterIds: string[];
  isAllChecked: boolean;
  onSelectRow: (masterId: string) => void;
  onToggleRow: (masterId: string) => void;
  onToggleAllRows: () => void;
};

export function CommonCodeMasterTable({
  rows,
  selectedMasterId,
  checkedMasterIds,
  isAllChecked,
  onSelectRow,
  onToggleRow,
  onToggleAllRows,
}: CommonCodeMasterTableProps) {
  return (
    <article className="common-code-card" aria-label="공통코드 마스터">
      <header className="common-code-card__header">
        <h2 className="common-code-card__title">공통코드 마스터</h2>
        <div className="common-code-card__actions">
          {/* 신규버튼을 누르면 수정/등록 모달 표시 내용은 밑의 주석과 같다. 대신, 확인 버튼을 누르면 저장 모달이 뜸 -> (확인 누르면) 저장되었습니다. 알림모달이 표시됨(수정 때와 같음) */}
          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<Icon id="i-plus" size={13} />}
          >
            신규
          </Button>
          {/* 삭제버튼 :체크박스가 표시된 행이 없으면, notice 모달("항목을 먼저 선택해주세요", "삭제할 행을 선택 및 체크박스로 선택 후 진행하세요.") / 체크박스가 표시된 행이 있으면, 체크박스에 표시된 행을 삭제하는 모달 표시(삭제 모달) -> 단건 다건 알림 따로 있음 ("삭제되었습니다.","n건이 삭제되었습니다." 서브타이틀은 "삭제된 데이터는 복구할 수 없습니다" )*/}
          <Button type="button" variant="outline" size="sm" disabled>
            삭제
          </Button>
        </div>
      </header>

      <div className="common-table-wrap">
        <table className="common-table" aria-label="공통코드 마스터 테이블">
          <colgroup>
            <col style={{ width: '3rem' }} />
            <col />
            <col />
            <col style={{ width: '8rem' }} />
            <col style={{ width: '4rem' }} />
          </colgroup>
          <thead>
            <tr>
              <th>
                <CheckboxInput
                  checked={isAllChecked}
                  onChange={onToggleAllRows}
                  aria-label="공통코드 마스터 전체 선택"
                  size="sm"
                  className="common-table__checkbox"
                />
              </th>
              <th>공통코드</th>
              <th>공통코드명</th>
              <th>사용여부</th>
              <th aria-label="수정" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isSelected = selectedMasterId === row.id;
              const isChecked = checkedMasterIds.includes(row.id);

              return (
                <tr
                  key={row.id}
                  className={isSelected ? 'is-selected' : undefined}
                  onClick={() => onSelectRow(row.id)}
                >
                  <td>
                    <CheckboxInput
                      checked={isChecked}
                      onChange={() => onToggleRow(row.id)}
                      aria-label={`${row.code} 선택`}
                      size="sm"
                      className="common-table__checkbox"
                    />
                  </td>
                  <td className="common-table__mono">{row.code}</td>
                  <td>{row.name}</td>
                  <td>
                    <span
                      className={`status-badge ${row.useYn === 'Y' ? 'status-badge--yes' : 'status-badge--no'}`}
                    >
                      {row.useYn}
                    </span>
                  </td>
                  <td>
                    {/* 수정 버튼 -> 수정/등록 모달 (타이틀은 "공통코드 마스터 수정/등록", 첫번째 열-공통코드는 읽기전용 나머지 모두 수정가능, 작성 필수, 두번째 열은 2번째 컬럼 placeholder는 "선택된 공통코드명", 세번째 열은 3번째 컬럼 사용여부이며, select이고 기본값은 Y 내용은 "사용 (Y)" ) ->(확인버튼누르면) 수정된 내용을 저장하시겠습니까? 수정 확인 모달 -> (확인버튼누르면) 알림 모달 표시(noticeModal, 저장되었습니다.) */}
                    <Button
                      type="button"
                      variant="icon"
                      size="sm"
                      iconOnly={<Icon id="i-modal-pencil" size={12} />}
                      aria-label={`${row.code} 수정`}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}
