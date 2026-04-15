/**
 * @fileoverview 공통코드 상세 테이블 UI
 *
 * @description
 * - 선택된 마스터의 상세 행 목록을 편집 가능한 테이블로 렌더링한다.
 * - 실제 저장 흐름과 모달은 page hook에 위임하고, 이 컴포넌트는 편집 UI만 담당한다.
 */

import { useState } from 'react';
import { Button } from '@/shared/components/button';
import { CheckboxInput } from '@/shared/components/checkbox';
import { InputBase } from '@/shared/components/input';
import { Icon } from '@/shared/assets/icons/Icon';
import { FeedbackState } from '@/shared/components/feedback';
import { TableCard } from '@/shared/components/table';
import { InputWrapper } from '@/shared/components/input';
import type { DetailRowErrorState } from '@/shared/hooks/useDetailTableSaveFlow';
import type { DetailCode, MasterCode } from '../types';

type CommonCodeDetailTableProps = {
  selectedMaster: MasterCode | null;
  isLoading: boolean;
  rows: DetailCode[];
  onFieldChange: (detailId: string, key: 'code' | 'name', value: string) => void;
  onUseYnChange: (detailId: string, checked: boolean) => void;
  onAddRow: () => void;
  onDeleteRows: (selectedId?: string) => void;
  onMoveUp: (selectedId?: string) => void;
  onMoveDown: (selectedId?: string) => void;
  isSaving: boolean;
  rowErrors: DetailRowErrorState;
  onClearRowError: (rowId: string, key: string) => void;
  onSave: () => void;
};

/**
 * 공통코드 상세 테이블을 렌더링한다.
 *
 * @description
 * - 선택된 마스터가 없으면 카드 안에 feedback을 보여준다.
 * - 저장 확인 모달은 page가 조립하고, 필수값/서버 validation 오류는 rowErrors로 전달받는다.
 */
export function CommonCodeDetailTable({
  selectedMaster,
  isLoading,
  rows,
  onFieldChange,
  onUseYnChange,
  onAddRow,
  onDeleteRows,
  onMoveUp,
  onMoveDown,
  isSaving,
  rowErrors,
  onClearRowError,
  onSave,
}: CommonCodeDetailTableProps) {
  /* 행 클릭 선택 상태 */
  const [selectedDetailId, setSelectedDetailId] = useState<string>('');

  /* 클릭 선택된 행의 인덱스 — 이동 가능 여부 계산에 사용 */
  const selectedIndex = rows.findIndex((row) => row.id === selectedDetailId);
  const effectiveCanMoveUp = selectedDetailId !== '' && selectedIndex > 0;
  const effectiveCanMoveDown = selectedDetailId !== '' && selectedIndex < rows.length - 1;

  const detailActions = selectedMaster ? (
    <>
      <Button
        variant="icon"
        size="sm"
        iconOnly={<Icon id="i-chevron-up" size={12} />}
        aria-label="위로 이동"
        disabled={!effectiveCanMoveUp || isSaving}
        onClick={() => onMoveUp(selectedDetailId || undefined)}
      />
      <Button
        variant="icon"
        size="sm"
        iconOnly={<Icon id="i-chevron-down" size={12} />}
        aria-label="아래로 이동"
        disabled={!effectiveCanMoveDown || isSaving}
        onClick={() => onMoveDown(selectedDetailId || undefined)}
      />
      <Button
        type="button"
        variant="text"
        size="sm"
        onClick={onAddRow}
        disabled={isSaving}
        className="common-code-card__text-action"
      >
        + 행추가
      </Button>
      <Button
        type="button"
        variant="text"
        size="sm"
        onClick={() => {
          onDeleteRows(selectedDetailId || undefined);
          setSelectedDetailId('');
        }}
        disabled={!selectedDetailId || isSaving}
        className="common-code-card__text-action"
      >
        - 행삭제
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        loading={isSaving}
        onClick={onSave}
      >
        저장
      </Button>
    </>
  ) : undefined;

  return (
    <>
      <TableCard
        title={selectedMaster ? '공통코드 상세' : undefined}
        ariaLabel="공통코드 상세"
        actions={detailActions}
        actionsClassName="common-code-card__actions--detail"
      >
        {!selectedMaster ? (
          <FeedbackState
            variant="empty"
            title="목록을 선택해주세요"
            description="위 목록에서 행을 클릭하면 상세 코드가 표시됩니다."
            className="common-code-card__empty"
          />
        ) : (
          <>
            {isLoading ? (
              <FeedbackState variant="loading" title="상세 코드를 불러오는 중입니다." />
            ) : (
            <div className="common-table-wrap">
              <table className="common-table common-table--detail" aria-label="공통코드 상세 테이블">
                <colgroup>
                  <col />
                  <col />
                  <col style={{ width: '8rem' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className="common-table__cell--left">공통코드</th>
                    <th className="common-table__cell--left">공통코드명</th>
                    <th>사용여부</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className={selectedDetailId === row.id ? 'is-selected' : undefined}
                      onClick={() => setSelectedDetailId(row.id)}
                    >
                      <td>
                        <InputWrapper inputId={`${row.id}-common-detail-code`}>
                          <InputBase
                            id={`${row.id}-common-detail-code`}
                            size="sm"
                            className={`common-table__input${row.isNew ? '' : ' common-table__input--readonly-code'}`}
                            controlState={!row.isNew ? 'readonly' : rowErrors[row.id]?.code ? 'error' : ''}
                            readOnly={!row.isNew}
                            value={row.code}
                            onChange={(event) => {
                              onClearRowError(row.id, 'code');
                              onFieldChange(row.id, 'code', event.target.value);
                            }}
                            aria-label={`${row.code} 코드`}
                          />
                        </InputWrapper>
                      </td>
                      <td>
                        <InputWrapper inputId={`${row.id}-common-detail-name`}>
                          <InputBase
                            id={`${row.id}-common-detail-name`}
                            size="sm"
                            className="common-table__input"
                            controlState={rowErrors[row.id]?.name ? 'error' : ''}
                            value={row.name}
                            onChange={(event) => {
                              onClearRowError(row.id, 'name');
                              onFieldChange(row.id, 'name', event.target.value);
                            }}
                            aria-label={`${row.code} 코드명`}
                          />
                        </InputWrapper>
                      </td>
                      {/* 사용여부: tr onClick(행 선택)과 공존 — onChange로 useYn 토글, 클릭은 tr까지 버블링 */}
                      <td>
                        <CheckboxInput
                          checked={row.useYn}
                          onChange={(checked) => onUseYnChange(row.id, checked)}
                          aria-label={`${row.code} 사용 여부`}
                          size="sm"
                          className="common-table__checkbox"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}

            {!isLoading && (
              <p className="common-code-card__footnote">
                {`${selectedMaster.name} 상세 코드를 편집 중입니다.`}
              </p>
            )}
          </>
        )}
      </TableCard>
    </>
  );
}
