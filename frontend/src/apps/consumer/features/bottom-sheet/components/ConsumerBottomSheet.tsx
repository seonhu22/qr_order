import { useEffect, useRef } from 'react';
import type { ReactNode, TouchEvent } from 'react';
import { createPortal } from 'react-dom';
import './ConsumerBottomSheet.css';

type ConsumerBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

const SWIPE_DOWN_CLOSE_THRESHOLD = 70;

/**
 * 메뉴상세·장바구니·주문내역·직원호출이 공유하는 하단 시트 프리미티브.
 * 드래그 핸들 스와이프, 오버레이 클릭, ESC로 닫는다. 콘텐츠는 호출부(children)가 결정한다.
 */
export function ConsumerBottomSheet({ open, onClose, title, children }: ConsumerBottomSheetProps) {
  const touchStartYRef = useRef(0);

  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartYRef.current = event.touches[0].clientY;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (event.changedTouches[0].clientY - touchStartYRef.current > SWIPE_DOWN_CLOSE_THRESHOLD) {
      onClose();
    }
  };

  return createPortal(
    <div className="consumer-bottom-sheet-overlay" role="presentation" onClick={onClose}>
      <section
        className="consumer-bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="consumer-bottom-sheet__handle-area"
          onClick={onClose}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <span className="consumer-bottom-sheet__handle" aria-hidden="true" />
        </div>
        {title && <h2 className="consumer-bottom-sheet__title">{title}</h2>}
        <div className="consumer-bottom-sheet__body">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
