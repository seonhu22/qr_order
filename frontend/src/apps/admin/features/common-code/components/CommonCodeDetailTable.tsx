/**
 * @fileoverview 공통코드 상세 테이블 UI
 *
 * @description
 * - 선택된 마스터의 상세 행 목록을 편집 가능한 테이블로 렌더링한다.
 * - 입력 검증, 저장 확인 모달, 저장 결과 안내 모달은 이 컴포넌트에서 처리한다.
 * - 실제 저장/순번 이동/삭제/체크 상태의 원본 데이터 관리는 상위 훅에 위임한다.
 */

import { useState } from 'react';
import { Button } from '@/shared/components/button';
import { CheckboxInput } from '@/shared/components/checkbox';
import { InputBase } from '@/shared/components/input';
import { Icon } from '@/shared/assets/icons/Icon';
import { SaveConfirmModal } from '@/shared/components/modal/template/SaveConfirmModal';
import { SimpleDefaultModal } from '@/shared/components/modal';
import { FeedbackState } from '@/shared/components/feedback';
import type { DetailCode, MasterCode } from '../types';
import { useCommonCodeDetailTableFlow } from '../hooks/useCommonCodeDetailTableFlow';

type CommonCodeDetailTableProps = {
  selectedMaster: MasterCode | null;
  isLoading: boolean;
  rows: DetailCode[];
  isAllChecked: boolean;
  checkedCount: number;
  onToggleRow: (detailId: string) => void;
  onToggleAllRows: () => void;
  onFieldChange: (detailId: string, key: 'code' | 'name', value: string) => void;
  onUseYnChange: (detailId: string, checked: boolean) => void;
  onAddRow: () => void;
  onDeleteRows: (selectedId?: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: (selectedId?: string) => void;
  onMoveDown: (selectedId?: string) => void;
  isSaving: boolean;
  onSaveRows: () => Promise<boolean>;
};

/**
 * 공통코드 상세 테이블을 렌더링한다.
 *
 * @description
 * - 선택된 마스터가 없으면 카드 안에 feedback을 보여준다.
 * - 저장 버튼은 즉시 서버 전송하지 않고 SaveConfirmModal을 거친다.
 * - 필수값 누락과 서버 validation 오류는 각 행 인풋의 error 상태로 표시한다.
 */
export function CommonCodeDetailTable({
  selectedMaster,
  isLoading,
  rows,
  isAllChecked,
  checkedCount,
  onToggleRow,
  onToggleAllRows,
  onFieldChange,
  onUseYnChange,
  onAddRow,
  onDeleteRows,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  isSaving,
  onSaveRows,
}: CommonCodeDetailTableProps) {
  /* 행 클릭 선택 상태 — 체크박스(row.checked)와 완전히 분리된 별도 state */
  const [selectedDetailId, setSelectedDetailId] = useState<string>('');

  /* 클릭 선택된 행의 인덱스 — 이동 가능 여부 계산에 사용 */
  const selectedIndex = rows.findIndex((row) => row.id === selectedDetailId);
  const effectiveCanMoveUp = canMoveUp || (selectedDetailId !== '' && selectedIndex > 0);
  const effectiveCanMoveDown =
    canMoveDown || (selectedDetailId !== '' && selectedIndex < rows.length - 1);

  const {
    rowErrors,
    notice,
    isSaveConfirmOpen,
    clearRowError,
    requestSave,
    confirmSave,
    closeSaveConfirm,
    closeNotice,
  } = useCommonCodeDetailTableFlow({
    rows,
    onSaveRows,
  });

  return (
    <>
      <article className="common-code-card" aria-label="공통코드 상세">
        {!selectedMaster ? (
          <FeedbackState
            variant="empty"
            title="목록을 선택해주세요"
            description="위 목록에서 행을 클릭하면 상세 코드가 표시됩니다."
            className="common-code-card__empty"
          />
        ) : (
          <>
            <header className="common-code-card__header">
              <h2 className="common-code-card__title">공통코드 상세</h2>
              <div className="common-code-card__actions common-code-card__actions--detail">
                {/* 위 아래 이동 버튼 : 디테일의 순서 변경, 현재 클릭된(다수 포함)을 위 아래로 이동시킴*/}
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
                  style={{ padding: '0 var(--spacing-button-x-sm)' }}
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
                  disabled={(checkedCount === 0 && !selectedDetailId) || isSaving}
                  style={{ padding: '0 var(--spacing-button-x-sm)' }}
                >
                  - 행삭제
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={isSaving}
                  onClick={requestSave}
                >
                  저장
                </Button>
              </div>
            </header>

            {isLoading ? (
              <FeedbackState variant="loading" title="상세 코드를 불러오는 중입니다." />
            ) : (
            <div className="common-table-wrap">
              <table className="common-table common-table--detail" aria-label="공통코드 상세 테이블">
                <colgroup>
                  <col style={{ width: '3rem' }} />
                  <col />
                  <col />
                  <col style={{ width: '8rem' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>
                      <CheckboxInput
                        checked={isAllChecked}
                        onChange={onToggleAllRows}
                        aria-label="공통코드 상세 전체 선택"
                        size="sm"
                        className="common-table__checkbox"
                      />
                    </th>
                    <th className="common-table__cell--left">공통코드</th>
                    <th className="common-table__cell--left">공통코드명</th>
                    <th>사용여부</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    /* 행 클릭으로 체크박스 토글 */
                    <tr
                      key={row.id}
                      className={selectedDetailId === row.id ? 'is-selected' : undefined}
                      onClick={() => setSelectedDetailId(row.id)}
                    >
                      {/* 선택 체크박스: tr onClick(행 선택)과 독립 — onChange만으로 처리 */}
                      <td>
                        <CheckboxInput
                          checked={row.checked}
                          onChange={() => onToggleRow(row.id)}
                          aria-label={`${row.code} 선택`}
                          size="sm"
                          className="common-table__checkbox"
                        />
                      </td>
                      <td>
                        <InputBase
                          size="sm"
                          className={`common-table__input${row.isNew ? '' : ' common-table__input--readonly-code'}`}
                          controlState={!row.isNew ? 'readonly' : rowErrors[row.id]?.code ? 'error' : ''}
                          readOnly={!row.isNew}
                          value={row.code}
                          onChange={(event) => {
                            clearRowError(row.id, 'code');
                            onFieldChange(row.id, 'code', event.target.value);
                          }}
                          aria-label={`${row.code} 코드`}
                        />
                      </td>
                      <td>
                        <InputBase
                          size="sm"
                          className="common-table__input"
                          controlState={rowErrors[row.id]?.name ? 'error' : ''}
                          value={row.name}
                          onChange={(event) => {
                            clearRowError(row.id, 'name');
                            onFieldChange(row.id, 'name', event.target.value);
                          }}
                          aria-label={`${row.code} 코드명`}
                        />
                      </td>
                      {/* 사용여부: tr onClick(행 선택)과 독립 — stopPropagation으로 분리 */}
                      <td onClick={(e) => e.stopPropagation()}>
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
      </article>

      <SimpleDefaultModal
        open={!!notice}
        title={notice?.title ?? '안내'}
        description={notice?.description}
        onClose={closeNotice}
      />

      <SaveConfirmModal
        open={isSaveConfirmOpen}
        title="저장 확인"
        description="작성된 공통코드 상세를 저장하시겠습니까?"
        primaryAction={{
          label: '확인',
          loading: isSaving,
          onClick: confirmSave,
        }}
        secondaryAction={{
          disabled: isSaving,
          onClick: closeSaveConfirm,
        }}
        onClose={closeSaveConfirm}
      />
    </>
  );
}
