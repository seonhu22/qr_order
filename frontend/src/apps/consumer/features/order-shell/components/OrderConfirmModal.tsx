import { useEffect, useRef } from 'react';
import { Button } from '@/shared/components/button';
import { TextareaInput } from '@/shared/components/input';
import './OrderConfirmModal.css';

const REQUEST_NOTE_MAX_LENGTH = 200;

type OrderConfirmModalProps = {
  totalPrice: number;
  requestNote: string;
  onRequestNoteChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

/** SoldoutModal 포커스 트랩과 같은 기준 — 키보드로 도달 가능한 요소만 대상. */
const FOCUSABLE_SELECTOR = [
  'input:not([disabled]):not([readonly])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** 최초 포커스 대상에서는 textarea를 제외한다 — 모달이 열리자마자 요청사항에 포커스가 가서 모바일 키보드가 뜨는 것을 막는다. */
const INITIAL_FOCUS_SELECTOR = [
  'input:not([disabled]):not([readonly])',
  'select:not([disabled])',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * 주문 확인 모달 — 참고 저장소에는 없는 화면으로, 이번에 새로 설계했다(ADR-032).
 * SoldoutModal과 같은 중앙 카드형 다이얼로그 스타일을 그대로 따른다. "취소" 또는 "주문하기"로만
 * 닫힌다(배경 클릭으로 닫히지 않음) — SoldoutModal과 같은 이유로, 실수로 배경을 눌러 주문 여부가
 * 불명확한 상태가 되는 걸 막는다.
 */
export function OrderConfirmModal({
  totalPrice,
  requestNote,
  onRequestNoteChange,
  onConfirm,
  onCancel,
}: OrderConfirmModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    dialogRef.current?.querySelector<HTMLElement>(INITIAL_FOCUS_SELECTOR)?.focus();

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
    <div className="order-confirm-modal-overlay">
      <div
        ref={dialogRef}
        className="order-confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="order-confirm-modal-title"
      >
        <p id="order-confirm-modal-title" className="order-confirm-modal__title">
          주문하시겠습니까?
        </p>

        <div className="order-confirm-modal__total">
          <span className="order-confirm-modal__total-label">총 결제 금액</span>
          <span className="order-confirm-modal__total-price">{totalPrice.toLocaleString()}원</span>
        </div>

        <TextareaInput
          className="order-confirm-modal__request"
          label="요청사항"
          rows={3}
          maxLength={REQUEST_NOTE_MAX_LENGTH}
          placeholder="예: 맵기 조절, 알레르기 안내 등"
          value={requestNote}
          onChange={(event) => onRequestNoteChange(event.target.value)}
          hint={`${requestNote.length}/${REQUEST_NOTE_MAX_LENGTH}자`}
        />

        <div className="order-confirm-modal__actions">
          <Button type="button" variant="secondary" size="lg" className="order-confirm-modal__action" onClick={onCancel}>
            취소
          </Button>
          <Button type="button" variant="primary" size="lg" className="order-confirm-modal__action" onClick={onConfirm}>
            주문하기
          </Button>
        </div>
      </div>
    </div>
  );
}
