// shared/components/modal/BaseModal.tsx

/**
 * @fileoverview 공용 베이스 모달 컴포넌트
 *
 * @description
 * - 오버레이 · 다이얼로그 레이아웃 · 헤더/본문/푸터 구조를 담당
 * - ESC 키 닫기, 오버레이 클릭 닫기, 확인 버튼 기본 동작(fallback)을 제공
 * - Alert/Confirm/Error 성격의 상위 모달에서 베이스로 재사용
 *
 * @module modal/BaseModal
 */

import { useEffect } from 'react';
import './modal.css';

import type { BaseModalProps, ModalSize } from './modalType';

const sizeClassMap: Record<ModalSize, string> = {
  sm: 'base-modal--sm',
  md: 'base-modal--md',
  lg: 'base-modal--lg',
  xl: 'base-modal--xl',
};

/**
 * 공용 베이스 모달
 *
 * @param {BaseModalProps} props 모달 구성 정보
 * @param {boolean} props.open 모달 노출 여부
 * @param {string} [props.title='알림'] 모달 제목
 * @param {string} [props.primaryLabel='확인'] 확인 버튼 라벨
 * @param {string} [props.primaryDescription] 본문 1차 설명
 * @param {string} [props.secondaryDescription=''] 본문 2차 설명
 * @param {boolean} [props.closeOnOverlayClick=true] 오버레이 클릭 닫기 허용 여부
 * @param {ModalSize} [props.size='sm'] 모달 크기
 * @param {() => void} props.onClose 모달 닫기 콜백
 * @param {() => void} [props.onConfirm] 확인 버튼 콜백 (미지정 시 onClose fallback)
 * @returns {JSX.Element | null}
 *
 * @example
 * <BaseModal
 *   open={open}
 *   title="삭제 확인"
 *   primaryDescription="선택한 항목을 삭제하시겠습니까?"
 *   secondaryDescription="삭제 후 복구할 수 없습니다."
 *   onClose={() => setOpen(false)}
 * />
 *
 * @example
 * <BaseModal
 *   open={open}
 *   size="lg"
 *   closeOnOverlayClick={false}
 *   primaryLabel="저장"
 *   onClose={handleClose}
 *   onConfirm={handleSave}
 * />
 */

export function BaseModal({
  open,
  title = '알림',
  primaryLabel = '확인',
  primaryDescription,
  secondaryDescription = '',
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

  // onConfirm이 지정되지 않은 경우 기본적으로 onClose를 호출하도록 처리
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
      return;
    }

    onClose();
  };

  // secondaryDescription이 빈 문자열이거나 공백만 있을 때는 렌더링하지 않도록 처리
  const hasSecondaryDescription =
    secondaryDescription !== undefined && secondaryDescription.trim() !== '';

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
          {/* TODO: 공용 Button/IconButton 컴포넌트 도입 시 닫기 버튼 교체 */}
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
          {hasSecondaryDescription && (
            <p className="base-modal__description base-modal__description--secondary">
              {secondaryDescription}
            </p>
          )}
        </div>

        <footer className="base-modal__footer">
          {/* TODO: 공용 Button 컴포넌트 도입 시 확인 버튼 교체 */}
          <button className="base-modal__confirm" type="button" onClick={handleConfirm}>
            {primaryLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}
