import { useEffect } from 'react';
import '@/shared/styles/modal.css';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface BaseModalProps {
  open: boolean;
  title?: string;
  primaryLabel?: string;
  primaryDescription?: string;
  secondaryDescription?: string;
  closeOnOverlayClick?: boolean;
  size?: ModalSize;
  onClose: () => void;
  onConfirm?: () => void;
}

const sizeClassMap: Record<ModalSize, string> = {
  sm: 'base-modal--sm',
  md: 'base-modal--md',
  lg: 'base-modal--lg',
  xl: 'base-modal--xl',
};

export function BaseModal({
  open,
  title = '알림',
  primaryLabel = '확인',
  primaryDescription,
  secondaryDescription,
  closeOnOverlayClick = true,
  size = 'sm',
  onClose,
  onConfirm,
}: BaseModalProps) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
      return;
    }

    onClose();
  };

  return (
    <div
      className="base-modal-overlay"
      role="presentation"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <section
        aria-modal="true"
        aria-label={title}
        className={`base-modal ${sizeClassMap[size]}`}
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="base-modal__header">
          <h3 className="base-modal__title">{title}</h3>
          <button
            aria-label="모달 닫기"
            className="base-modal__close"
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="base-modal__body">
          {primaryDescription && <p className="base-modal__description">{primaryDescription}</p>}
          {secondaryDescription && (
            <p className="base-modal__description base-modal__description--secondary">
              {secondaryDescription}
            </p>
          )}
        </div>

        <footer className="base-modal__footer">
          <button className="base-modal__confirm" type="button" onClick={handleConfirm}>
            {primaryLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}
