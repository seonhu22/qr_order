import { WrapperModal } from '../wrapper/WrapperModal';
import type { SimpleDefaultModalProps } from '../base/modalType';
import './SimpleDefaultModal.css';

export function SimpleDefaultModal({
  open,
  title = '안내',
  description,
  helperText,
  size = 'sm',
  primaryAction,
  secondaryAction,
  onClose,
}: SimpleDefaultModalProps) {
  const stringDescription = typeof description === 'string' ? description : undefined;
  const customDescription = typeof description === 'string' ? undefined : description;
  const resolvedPrimaryAction = {
    label: '확인',
    variant: 'primary' as const,
    ...primaryAction,
  };

  return (
    <WrapperModal
      layout="default"
      open={open}
      size={size}
      title={title}
      subtitle={stringDescription}
      noticeMeta={
        helperText ? <span className="simple-default-modal__helper">{helperText}</span> : null
      }
      primaryAction={resolvedPrimaryAction}
      secondaryAction={secondaryAction}
      onClose={onClose}
    >
      {customDescription ? (
        <p className="base-modal__description simple-default-modal__description">
          {customDescription}
        </p>
      ) : null}
    </WrapperModal>
  );
}
