import { Button } from '@/shared/components/button';
import { CheckboxInput } from '@/shared/components/checkbox';
import { Icon } from '@/shared/assets/icons/Icon';
import { InputBase, SelectInput } from '@/shared/components/input';
import { DeleteConfirmModal } from '@/shared/components/modal/template/DeleteConfirmModal';
import { SaveConfirmModal } from '@/shared/components/modal/template/SaveConfirmModal';
import { WrapperModal } from '@/shared/components/modal/wrapper/WrapperModal';
import { useState } from 'react';
import type { MasterCode } from '../types';
import { SimpleDefaultModal } from '@/shared/components/modal';

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
  const [editingRow, setEditingRow] = useState<MasterCode | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [editorErrors, setEditorErrors] = useState<{
    code: boolean;
    name: boolean;
    useYn: boolean;
  }>({
    code: false,
    name: false,
    useYn: false,
  });
  const [wrapperNoticeState, setWrapperNoticeState] = useState<{
    title: string;
    description: string;
    helperText?: string;
  } | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const selectedDeleteCount = checkedMasterIds.length;
  const isCodeReadonly = !isCreateMode;
  const resetEditorErrors = () => {
    setEditorErrors({
      code: false,
      name: false,
      useYn: false,
    });
  };

  const openCreateModal = () => {
    setEditingRow({
      id: '',
      code: '',
      name: '',
      useYn: 'Y',
    });
    setIsCreateMode(true);
    resetEditorErrors();
    setIsEditorOpen(true);
  };

  const openEditModal = (row: MasterCode) => {
    setEditingRow({ ...row });
    setIsCreateMode(false);
    resetEditorErrors();
    setIsEditorOpen(true);
  };

  const closeEditorModal = () => {
    setIsEditorOpen(false);
    setEditingRow(null);
    setIsCreateMode(false);
    resetEditorErrors();
  };

  const handleSaveRequest = () => {
    const nextErrors = {
      code: !editingRow?.code.trim(),
      name: !editingRow?.name.trim(),
      useYn: editingRow?.useYn !== 'Y' && editingRow?.useYn !== 'N',
    };

    setEditorErrors(nextErrors);

    if (nextErrors.code || nextErrors.name || nextErrors.useYn) {
      return;
    }

    setIsEditorOpen(false);
    setIsSaveConfirmOpen(true);
  };

  const handleSaveConfirm = () => {
    setIsSaveConfirmOpen(false);
    setWrapperNoticeState({
      title: '저장되었습니다.',
      description: isCreateMode
        ? '공통코드 마스터가 등록되었습니다.'
        : '공통코드 마스터가 수정되었습니다.',
    });
    setEditingRow(null);
    setIsCreateMode(false);
    resetEditorErrors();
  };

  const handleDeleteRequest = () => {
    if (selectedDeleteCount === 0) {
      setWrapperNoticeState({
        title: '안내',
        description: '항목을 먼저 선택해주세요.',
        helperText: '삭제할 행을 선택 및 체크박스로 선택 후 진행하세요.',
      });
      return;
    }

    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    setIsDeleteConfirmOpen(false);
    setWrapperNoticeState({
      title:
        selectedDeleteCount > 1 ? `${selectedDeleteCount}건이 삭제되었습니다.` : '삭제되었습니다.',
      description: '삭제된 데이터는 복구할 수 없습니다.',
    });
  };

  const changeEditingField = (key: 'code' | 'name' | 'useYn', value: string) => {
    setEditorErrors((prev) => ({
      ...prev,
      [key]: false,
    }));
    setEditingRow((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <>
      <article className="common-code-card" aria-label="공통코드 마스터">
        <header className="common-code-card__header">
          <h2 className="common-code-card__title">공통코드 마스터</h2>
          <div className="common-code-card__actions">
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Icon id="i-plus" size={13} />}
              onClick={openCreateModal}
            >
              신규
            </Button>
            {/* 삭제버튼 :체크박스가 표시된 행이 없으면, notice 모달("항목을 먼저 선택해주세요", "삭제할 행을 선택 및 체크박스로 선택 후 진행하세요.") / 체크박스가 표시된 행이 있으면, 체크박스에 표시된 행을 삭제하는 모달 표시(삭제 모달) -> 단건 다건 알림 따로 있음 ("삭제되었습니다.","n건이 삭제되었습니다." 서브타이틀은 "삭제된 데이터는 복구할 수 없습니다" )*/}
            <Button type="button" variant="outline" size="sm" onClick={handleDeleteRequest}>
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
                      <Button
                        type="button"
                        variant="icon"
                        size="sm"
                        iconOnly={<Icon id="i-modal-pencil" size={12} />}
                        aria-label={`${row.code} 수정`}
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditModal(row);
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>

      {/* 모달 파트 */}
      <WrapperModal
        size="md"
        open={isEditorOpen}
        title="공통코드 마스터 수정/등록"
        subtitle="공통코드 정보를 입력하세요."
        primaryAction={{
          label: '확인',
          onClick: handleSaveRequest,
        }}
        secondaryAction={{
          label: '닫기',
          onClick: closeEditorModal,
        }}
        onClose={closeEditorModal}
      >
        <div className="common-code-modal-form">
          <div className="common-code-modal-form__field">
            <label className="common-code-modal-form__label" htmlFor="common-master-code">
              공통코드
              <span className="common-code-modal-form__required" aria-hidden="true">
                *
              </span>
            </label>
            <InputBase
              id="common-master-code"
              size="sm"
              value={editingRow?.code ?? ''}
              readOnly={isCodeReadonly}
              required
              controlState={editorErrors.code ? 'error' : isCodeReadonly ? 'readonly' : ''}
              className={isCodeReadonly ? 'common-code-modal-form__readonly' : undefined}
              placeholder={isCreateMode ? '공통코드를 입력하세요' : ''}
              onChange={(event) => changeEditingField('code', event.target.value)}
            />
          </div>
          <div className="common-code-modal-form__field">
            <label className="common-code-modal-form__label" htmlFor="common-master-name">
              공통코드명
              <span className="common-code-modal-form__required" aria-hidden="true">
                *
              </span>
            </label>
            <InputBase
              id="common-master-name"
              size="sm"
              value={editingRow?.name ?? ''}
              required
              controlState={editorErrors.name ? 'error' : ''}
              placeholder={isCreateMode ? '공통코드명을 입력하세요' : (editingRow?.name ?? '')}
              onChange={(event) => changeEditingField('name', event.target.value)}
            />
          </div>
          <div className="common-code-modal-form__field">
            <label className="common-code-modal-form__label" htmlFor="common-master-use-yn">
              사용여부
              <span className="common-code-modal-form__required" aria-hidden="true">
                *
              </span>
            </label>
            <SelectInput
              size="sm"
              className="common-code-modal-form__select-input"
              value={editingRow?.useYn ?? 'Y'}
              options={[
                { value: 'Y', label: '사용 (Y)' },
                { value: 'N', label: '미사용 (N)' },
              ]}
              required
              isError={editorErrors.useYn}
              onChange={(value) => changeEditingField('useYn', value)}
            />
          </div>
        </div>
      </WrapperModal>

      {/* 저장 확인 모달 */}
      <SaveConfirmModal
        open={isSaveConfirmOpen}
        title="저장 확인"
        description={
          isCreateMode ? '작성된 내용을 저장합니다.' : '수정된 공통코드 마스터를 저장하시겠습니까?'
        }
        primaryAction={{
          label: '확인',
          onClick: () => {
            setIsSaveConfirmOpen(false);
            setWrapperNoticeState({
              title: '알림',
              description: '저장되었습니다.',
            });
          },
        }}
        secondaryAction={{
          onClick: () => setIsSaveConfirmOpen(false),
        }}
        onClose={() => setIsSaveConfirmOpen(false)}
      />

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        open={isDeleteConfirmOpen}
        title="삭제 확인"
        description="선택한 공통코드 마스터를 삭제하시겠습니까?"
        primaryAction={{
          label: '삭제',
          onClick: handleDeleteConfirm,
        }}
        secondaryAction={{
          onClick: () => setIsDeleteConfirmOpen(false),
        }}
        onClose={() => setIsDeleteConfirmOpen(false)}
      />

      {/* 기본 알림 모달 */}
      <SimpleDefaultModal
        open={!!wrapperNoticeState}
        title={wrapperNoticeState?.title ?? '안내'}
        description={wrapperNoticeState?.description}
        helperText={wrapperNoticeState?.helperText}
        onClose={() => setWrapperNoticeState(null)}
      />
    </>
  );
}
