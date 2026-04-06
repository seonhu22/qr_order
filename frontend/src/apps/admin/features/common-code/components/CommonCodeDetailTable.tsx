import { Button } from '@/shared/components/button';
import { CheckboxInput } from '@/shared/components/checkbox';
import { InputBase } from '@/shared/components/input';
import { Icon } from '@/shared/assets/icons/Icon';
import { SaveConfirmModal } from '@/shared/components/modal/template/SaveConfirmModal';
import { SimpleDefaultModal } from '@/shared/components/modal';
import { CommonCodeFeedback } from '@/apps/admin/features/common-code/components/CommonCodeFeedback';
import { useState } from 'react';
import type { DetailCode, MasterCode } from '../types';

type CommonCodeDetailTableProps = {
  selectedMaster: MasterCode | null;
  rows: DetailCode[];
  isAllChecked: boolean;
  checkedCount: number;
  onToggleRow: (detailId: string) => void;
  onToggleAllRows: () => void;
  onFieldChange: (detailId: string, key: 'code' | 'name', value: string) => void;
  onUseYnChange: (detailId: string, checked: boolean) => void;
  onAddRow: () => void;
  onDeleteRows: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isSaving: boolean;
  onSaveRows: () => Promise<boolean>;
};

export function CommonCodeDetailTable({
  selectedMaster,
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
  const [notice, setNotice] = useState<{ title: string; description: string } | null>(null);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [rowErrors, setRowErrors] = useState<
    Record<string, { code?: boolean; name?: boolean }>
  >({});

  const clearRowError = (detailId: string, key: 'code' | 'name') => {
    setRowErrors((prev) => ({
      ...prev,
      [detailId]: {
        ...prev[detailId],
        [key]: false,
      },
    }));
  };

  const applyServerValidationErrors = (message: string) => {
    const nextErrors: Record<string, { code?: boolean; name?: boolean }> = {};
    const normalized = message.toLowerCase();

    if (normalized.includes('common_cd') || message.includes('공통코드')) {
      rows.forEach((row) => {
        nextErrors[row.id] = {
          ...nextErrors[row.id],
          code: true,
        };
      });
    }

    if (normalized.includes('common_nm') || message.includes('공통코드명')) {
      rows.forEach((row) => {
        nextErrors[row.id] = {
          ...nextErrors[row.id],
          name: true,
        };
      });
    }

    if (Object.keys(nextErrors).length > 0) {
      setRowErrors(nextErrors);
    }
  };

  const handleSaveRequest = () => {
    const nextErrors = Object.fromEntries(
      rows.map((row) => [
        row.id,
        {
          code: !row.code.trim(),
          name: !row.name.trim(),
        },
      ]),
    ) as Record<string, { code?: boolean; name?: boolean }>;

    setRowErrors(nextErrors);

    const hasErrors = Object.values(nextErrors).some((error) => error.code || error.name);

    if (hasErrors) {
      return;
    }

    setIsSaveConfirmOpen(true);
  };

  const handleSaveConfirm = async () => {
    try {
      const hasChanges = await onSaveRows();
      setIsSaveConfirmOpen(false);
      setRowErrors({});

      setNotice({
        title: '알림',
        description: hasChanges ? '저장되었습니다.' : '변경된 내용이 없습니다.',
      });
    } catch (error) {
      setIsSaveConfirmOpen(false);

      if (error instanceof Error) {
        applyServerValidationErrors(error.message);
      }

      setNotice({
        title: '오류',
        description: error instanceof Error ? error.message : '상세 저장 중 오류가 발생했습니다.',
      });
    }
  };

  return !selectedMaster ? (
    <CommonCodeFeedback />
  ) : (
    <>
      <article className="common-code-card" aria-label="공통코드 상세">
        <header className="common-code-card__header">
          <h2 className="common-code-card__title">공통코드 상세</h2>
          <div className="common-code-card__actions common-code-card__actions--detail">
            {/* 위 아래 이동 버튼 : 디테일의 순서 변경, 현재 클릭된(다수 포함)을 위 아래로 이동시킴*/}
            <Button
              variant="icon"
              size="sm"
              iconOnly={<Icon id="i-chevron-up" size={12} />}
              aria-label="위로 이동"
              disabled={!canMoveUp || isSaving}
              onClick={onMoveUp}
            />
            <Button
              variant="icon"
              size="sm"
              iconOnly={<Icon id="i-chevron-down" size={12} />}
              aria-label="아래로 이동"
              disabled={!canMoveDown || isSaving}
              onClick={onMoveDown}
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
              onClick={onDeleteRows}
              disabled={checkedCount === 0 || isSaving}
              style={{ padding: '0 var(--spacing-button-x-sm)' }}
            >
              - 행삭제
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={isSaving}
              onClick={handleSaveRequest}
            >
              저장
            </Button>
          </div>
        </header>

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
                <th>공통코드</th>
                <th>공통코드명</th>
                <th>사용여부</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={row.checked ? 'is-selected' : undefined}>
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
                      className="common-table__input"
                      controlState={rowErrors[row.id]?.code ? 'error' : ''}
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

        <p className="common-code-card__footnote">
          {selectedMaster
            ? `${selectedMaster.name} 상세 코드를 편집 중입니다.`
            : '선택된 공통코드가 없습니다.'}
        </p>
      </article>

      <SimpleDefaultModal
        open={!!notice}
        title={notice?.title ?? '안내'}
        description={notice?.description}
        onClose={() => setNotice(null)}
      />

      <SaveConfirmModal
        open={isSaveConfirmOpen}
        title="저장 확인"
        description="작성된 공통코드 상세를 저장하시겠습니까?"
        primaryAction={{
          label: '확인',
          loading: isSaving,
          onClick: handleSaveConfirm,
        }}
        secondaryAction={{
          disabled: isSaving,
          onClick: () => setIsSaveConfirmOpen(false),
        }}
        onClose={() => setIsSaveConfirmOpen(false)}
      />
    </>
  );
}
