/**
 * @fileoverview 삭제 목록 포함 저장 확인 모달
 *
 * @description
 * - 저장 시 삭제될 항목 목록을 보여주고 진행 여부를 확인하는 모달이다.
 * - 삭제 대상이 있는 경우 일반 SaveConfirmModal 대신 사용한다.
 * - 목록은 code + name 쌍으로 렌더링한다.
 *
 * @example
 * <DeleteListConfirmModal
 *   open={open}
 *   items={[{ code: 'MENU_01', name: '주문 관리' }]}
 *   primaryAction={{ loading: isSaving, onClick: handleConfirm }}
 *   onClose={handleClose}
 * />
 */

import { WrapperModal } from '../wrapper/WrapperModal';
import type { ConfirmPrimaryAction, ConfirmSecondaryAction } from '../base/modalType';
import './DeleteListConfirmModal.css';

export type DeleteListConfirmModalProps = {
  open: boolean;
  /** 모달 제목 */
  title?: string;
  /** 목록 위에 표시할 안내 문구 */
  description?: string;
  /** 삭제될 항목 목록 */
  items: { code: string; name: string }[];
  primaryAction?: ConfirmPrimaryAction;
  secondaryAction?: ConfirmSecondaryAction;
  onClose: () => void;
};

export function DeleteListConfirmModal({
  open,
  title = '저장',
  description = '저장 시 다음 메뉴가 삭제됩니다. 계속 저장하시겠습니까?',
  items,
  primaryAction,
  secondaryAction,
  onClose,
}: DeleteListConfirmModalProps) {
  const resolvedPrimaryAction = {
    label: '확인',
    variant: 'danger' as const,
    ...primaryAction,
  };

  const resolvedSecondaryAction = {
    label: '닫기',
    onClick: onClose,
    ...secondaryAction,
  };

  return (
    <WrapperModal
      layout="default"
      open={open}
      title={title}
      primaryAction={resolvedPrimaryAction}
      secondaryAction={resolvedSecondaryAction}
      onClose={onClose}
    >
      <div className="delete-list-confirm-modal__body">
        <p className="delete-list-confirm-modal__description">{description}</p>
        <ul className="delete-list-confirm-modal__list">
          {items.map((item, i) => (
            <li
              key={`${item.code}-${i}`}
              className="delete-list-confirm-modal__item"
            >
              <span className="delete-list-confirm-modal__item-code">{item.code}</span>
              <span className="delete-list-confirm-modal__item-name">{item.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </WrapperModal>
  );
}
