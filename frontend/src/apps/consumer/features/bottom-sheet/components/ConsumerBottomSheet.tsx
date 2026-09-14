import { useEffect, useRef, useState } from 'react';
import type { ReactNode, TouchEvent } from 'react';
import { createPortal } from 'react-dom';
import './ConsumerBottomSheet.css';

type ConsumerBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  /**
   * 시트 상단에 제목을 노출하지 않는 화면(예: 이미지가 맨 위에 오는 메뉴 상세)에서
   * 스크린리더용 이름만 따로 줄 때 사용한다. 없으면 `title`을 그대로 쓴다.
   */
  ariaLabel?: string;
  children: ReactNode;
};

const SWIPE_DOWN_CLOSE_THRESHOLD = 70;

/** SoldoutModal 포커스 트랩과 같은 기준 — 키보드로 도달 가능한 요소만 대상. */
const FOCUSABLE_SELECTOR = [
  'input:not([disabled]):not([readonly])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * 메뉴상세·장바구니·주문내역·직원호출이 공유하는 하단 시트 프리미티브.
 * 드래그 핸들 스와이프, 오버레이 클릭, ESC로 닫는다. 콘텐츠는 호출부(children)가 결정한다.
 */
export function ConsumerBottomSheet({
  open,
  onClose,
  title,
  ariaLabel,
  children,
}: ConsumerBottomSheetProps) {
  const touchStartYRef = useRef(0);
  const dialogRef = useRef<HTMLElement>(null);
  // open이 false가 돼도 닫힘 애니메이션(위→아래)이 끝날 때까지는 계속 렌더링한다.
  // effect가 아니라 렌더 중 prop 변경을 감지해 상태를 조정한다(React 권장 패턴) —
  // effect에서 setState하면 한 프레임 늦게 반영돼 깜빡임이 생길 수 있다.
  const [shouldRender, setShouldRender] = useState(open);
  const [isClosing, setIsClosing] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);

    if (open) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        setShouldRender(false);
      } else {
        setIsClosing(true);
      }
    }
  }

  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // 열릴 때 포커스를 시트 안으로 옮기고, Tab/Shift+Tab이 시트 밖(가려진 배경)으로 못
  // 빠져나가게 가둔다. 닫히면 시트를 열기 전 포커스로 되돌린다(SoldoutModal과 같은 기법).
  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusable && focusable.length > 0) {
      focusable[0].focus();
    } else {
      dialogRef.current?.focus();
    }

    function handleTab(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const elements = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      // 포커스 가능한 요소가 하나도 없으면(예: "준비 중입니다" 안내만 있는 직원호출) 순환시킬
      // 대상이 없으니, Tab 자체를 막아 시트(tabIndex=-1) 포커스에 계속 머무르게 한다.
      if (elements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', handleTab);
    return () => {
      window.removeEventListener('keydown', handleTab);
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  if (!shouldRender || typeof document === 'undefined') {
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
    <div
      className={`consumer-bottom-sheet-overlay${isClosing ? ' consumer-bottom-sheet-overlay--closing' : ''}`}
      role="presentation"
      onClick={onClose}
    >
      <section
        ref={dialogRef}
        className={`consumer-bottom-sheet${isClosing ? ' consumer-bottom-sheet--closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onAnimationEnd={() => {
          if (isClosing) setShouldRender(false);
        }}
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
