/**
 * @fileoverview 검증 안내 목록 모달
 *
 * @description
 * - 저장 전 입력값 검증 실패 항목을 목록으로 보여준다.
 * - 여러 안내 문구가 동시에 필요한 화면에서 사용한다.
 */

import { WrapperModal } from '../wrapper/WrapperModal';
import type { ConfirmSecondaryAction, ModalPrimaryAction } from '../base/modalType';
import './ValidationNoticeModal.css';

export type ValidationNoticeModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  items: string[];
  primaryAction?: ModalPrimaryAction;
  secondaryAction?: ConfirmSecondaryAction;
  onClose: () => void;
};

export function ValidationNoticeModal({
  open,
  title = '알림',
  description,
  items,
  primaryAction,
  secondaryAction,
  onClose,
}: ValidationNoticeModalProps) {
  const resolvedPrimaryAction = {
    label: '확인',
    variant: 'primary' as const,
    onClick: onClose,
    ...primaryAction,
  };

  return (
    <WrapperModal
      layout="default"
      open={open}
      title={title}
      primaryAction={resolvedPrimaryAction}
      secondaryAction={secondaryAction}
      onClose={onClose}
    >
      <div className="validation-notice-modal__body">
        {description ? <p className="validation-notice-modal__description">{description}</p> : null}
        <ul className="validation-notice-modal__list">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="validation-notice-modal__item"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </WrapperModal>
  );
}
