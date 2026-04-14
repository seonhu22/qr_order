import { Button } from '@/shared/components/button';
import { FeedbackState } from '@/shared/components/feedback';
import { InputBase, InputWrapper } from '@/shared/components/input';
import { TableCard } from '@/shared/components/table';
import type { MessageRow } from '../types';

type MessageTableProps = {
  rows: MessageRow[];
  selectedRowId: string;
  isLoading: boolean;
  isError: boolean;
  isSaving: boolean;
  onSelectRow: (rowId: string) => void;
  onChangeRowField: (rowId: string, key: 'code' | 'name' | 'content', value: string) => void;
  onAddRow: () => void;
  onDeleteRow: () => void;
  onSave: () => void;
};

/**
 * 테이블 헤더에서 필수 항목 표시를 통일한다.
 *
 * @param {string} label 기본 헤더 텍스트
 * @returns {JSX.Element} `라벨 + *` 형태의 노드
 */
function renderRequiredLabel(label: string) {
  return (
    <>
      {label}
      <span style={{ color: 'var(--color-brand-default)' }}>*</span>
    </>
  );
}

/**
 * 메시지 관리 인라인 편집 테이블.
 *
 * @description
 * - 행 선택, 셀 입력, 하단 액션 버튼 렌더링만 담당한다.
 * - 데이터 저장 여부나 검색 조건 같은 상태 판단은 상위 훅에 맡긴다.
 */
export function MessageTable({
  rows,
  selectedRowId,
  isLoading,
  isError,
  isSaving,
  onSelectRow,
  onChangeRowField,
  onAddRow,
  onDeleteRow,
  onSave,
}: MessageTableProps) {
  const renderBody = () => {
    if (!rows.length) {
      return (
        <tr>
          <td className="common-table__empty" colSpan={3}>
            검색 결과가 없습니다.
          </td>
        </tr>
      );
    }

    return rows.map((row) => (
      <tr
        key={row.id}
        className={selectedRowId === row.id ? 'is-selected' : undefined}
        /* AdminUserTable과 같은 선택 규약: mousedown 시점에 선택 상태를 반영한다. */
        onMouseDown={() => onSelectRow(row.id)}
      >
        <td>
          <InputWrapper inputId={`${row.id}-message-code`}>
            <InputBase
              id={`${row.id}-message-code`}
              size="sm"
              className={row.isNew ? 'common-table__input' : 'common-table__input common-table__input--readonly'}
              controlState={row.isNew ? '' : 'readonly'}
              readOnly={!row.isNew}
              value={row.code}
              placeholder="코드"
              /* 기존 행 코드는 읽기 전용, 신규 행만 입력 가능하다. */
              onChange={(event) => onChangeRowField(row.id, 'code', event.target.value)}
              aria-label={`${row.id} 메시지 코드`}
            />
          </InputWrapper>
        </td>
        <td>
          <InputWrapper inputId={`${row.id}-message-name`}>
            <InputBase
              id={`${row.id}-message-name`}
              size="sm"
              className="common-table__input"
              value={row.name}
              placeholder="메시지명"
              onChange={(event) => onChangeRowField(row.id, 'name', event.target.value)}
              aria-label={`${row.id} 메시지 명`}
            />
          </InputWrapper>
        </td>
        <td>
          <InputWrapper inputId={`${row.id}-message-content`}>
            <InputBase
              id={`${row.id}-message-content`}
              size="sm"
              className="common-table__input"
              value={row.content}
              placeholder="내용"
              onChange={(event) => onChangeRowField(row.id, 'content', event.target.value)}
              aria-label={`${row.id} 메시지 내용`}
            />
          </InputWrapper>
        </td>
      </tr>
    ));
  };

  const headerActions = (
    <>
      <Button
        type="button"
        variant="text"
        size="sm"
        className="common-code-card__text-action"
        disabled={isSaving}
        onClick={onAddRow}
      >
        + 행추가
      </Button>
      <Button
        type="button"
        variant="text"
        size="sm"
        className="common-code-card__text-action"
        disabled={!selectedRowId || isSaving}
        onClick={onDeleteRow}
      >
        - 행삭제
      </Button>
      <Button type="button" variant="outline" size="sm" loading={isSaving} onClick={onSave}>
        저장
      </Button>
    </>
  );

  return (
    <TableCard title="메세지 목록" ariaLabel="메세지 목록" actions={headerActions}>
      {isLoading ? (
        <FeedbackState variant="loading" title="메세지 목록을 불러오는 중입니다." />
      ) : isError ? (
        <FeedbackState variant="error" description="다시 한번 시도해주세요." />
      ) : (
        <div className="common-table-wrap">
          <table className="common-table" aria-label="메세지 관리 테이블">
            <colgroup>
              {/* Figma 비율에 맞춰 3개 컬럼 폭을 고정한다. */}
              <col style={{ width: '24%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '52%' }} />
            </colgroup>
            <thead>
              <tr>
                <th className="common-table__cell--left">{renderRequiredLabel('메시지 코드')}</th>
                <th className="common-table__cell--left">{renderRequiredLabel('메시지 명')}</th>
                <th className="common-table__cell--left">{renderRequiredLabel('메시지 내용')}</th>
              </tr>
            </thead>
            <tbody>{renderBody()}</tbody>
          </table>
        </div>
      )}
    </TableCard>
  );
}
