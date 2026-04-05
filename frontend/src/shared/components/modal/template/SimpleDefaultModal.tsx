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
      subtitle={description}
      noticeMeta={
        helperText ? <span className="simple-default-modal__helper">{helperText}</span> : null
      }
      primaryAction={resolvedPrimaryAction}
      secondaryAction={secondaryAction}
      onClose={onClose}
    />
  );
}
