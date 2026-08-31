import { useEffect, useRef } from 'react';
import type { OrderShellCartLine } from '../types';
import { Button } from '@/shared/components/button';
import './SoldoutModal.css';

type SoldoutModalProps = {
  items: OrderShellCartLine[];
  onConfirm: () => void;
};

/** shared/components/modal의 WrapperModal 포커스 트랩과 같은 기준 — 키보드로 도달 가능한 요소만 대상. */
const FOCUSABLE_SELECTOR = [
  'input:not([disabled]):not([readonly])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** 같은 메뉴를 옵션만 다르게 여러 줄 담았을 때 목록에서 서로 구분되도록 옵션명을 이어붙인다. */
function formatSoldoutItemLabel(item: OrderShellCartLine) {
  if (item.options.length === 0) return item.name;
  return `${item.name} (${item.options.map((option) => option.choiceName).join(', ')})`;
}

/**
 * 품절 확인 모달 — 참고 저장소(Qrorder)의 SoldoutModal과 동일한 구성을 이 프로젝트 토큰으로
 * 재현한다. 다른 order-shell 화면과 달리 전체화면이 아니라 어두운 배경 위 중앙 카드형 다이얼로그다.
 * "확인" 외에는 닫을 방법이 없다(배경 클릭으로 닫히지 않음) — 참고 저장소도 동일.
 */
export function SoldoutModal({ items, onConfirm }: SoldoutModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // 열릴 때 포커스를 모달 안으로 옮기고, Tab/Shift+Tab이 모달 밖(가려진 배경)으로 못
  // 빠져나가게 가둔다. 닫히면(언마운트) 모달을 열기 전 포커스로 되돌린다.
  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusable?.[0]?.focus();

    function handleTab(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const elements = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (elements.length === 0) return;

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
  }, []);

  return (
    <div className="soldout-modal-overlay">
      <div
        ref={dialogRef}
        className="soldout-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="soldout-modal-title"
      >
        <p id="soldout-modal-title" className="soldout-modal__title">
          주문할 수 없는 메뉴가 있습니다
        </p>
        <p className="soldout-modal__description">품절된 메뉴를 확인해 주세요.</p>

        {items.length > 0 && (
          <ul className="soldout-modal__list">
            {items.map((item) => (
              <li key={item.cartKey} className="soldout-modal__list-item">
                <span className="soldout-modal__dot" aria-hidden="true" />
                <span className="soldout-modal__list-name">{formatSoldoutItemLabel(item)}</span>
                <span className="soldout-modal__list-tag">품절</span>
              </li>
            ))}
          </ul>
        )}

        <Button type="button" variant="primary" size="lg" className="soldout-modal__action" onClick={onConfirm}>
          확인
        </Button>
      </div>
    </div>
  );
}
