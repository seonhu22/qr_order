// src/shared/components/modal/wrapper/WrapperModal.tsx

// TODO : Portal 적용하여 DOM 트리 최상단에 렌더링하도록 개선
// TODO : Dimmed 기능 확인 필요
/**
 * @fileoverview 공용 모달 레이아웃 래퍼 컴포넌트
 *
 * @description
 * - 오버레이, 다이얼로그 박스, 헤더/본문/푸터의 공통 레이아웃을 담당한다.
 * - `layout="default"`일 때는 상단에 title + 닫기 버튼을 사용한다.
 * - `layout="notice"`일 때는 닫기 버튼을 숨기고 icon, title, subtitle을 가운데 정렬한다.
 * - footer는 액션 객체 존재 여부에 따라 버튼을 렌더링한다.
 * - 버튼의 외형은 공용 Button이 담당하고, modal은 배치용 스타일만 유지한다.
 * - `isDirty=true`이면 ESC·overlay 클릭으로 닫히지 않는다.
 *
 * @example
 * <WrapperModal
 *   open={open}
 *   title="저장 완료"
 *   subtitle="정상적으로 저장되었습니다."
 *   primaryAction={{ label: '확인', onClick: handleClose }}
 *   onClose={() => setOpen(false)}
 * />
 *
 * @example
 * <WrapperModal
 *   open={open}
 *   isDirty={isDirty}
 *   layout="notice"
 *   icon={<span>!</span>}
 *   title="삭제 확인"
 *   subtitle="선택한 항목을 삭제하시겠습니까?"
 *   primaryAction={{ label: '삭제', variant: 'danger', onClick: handleDelete }}
 *   secondaryAction={{ label: '닫기', onClick: handleClose }}
 *   onClose={handleClose}
 * />
 */

import { useEffect, useRef } from 'react';
import { Button } from '@/shared/components/button';
import { MODAL_SIZE_CLASS_MAP } from '../base/modal.constants';
import '../base/modal.css';

import type { WrapperModalProps } from '../base/modalType';

const FOCUSABLE_SELECTOR = [
  'input:not([disabled]):not([readonly])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * 공용 모달 래퍼를 렌더링한다.
 *
 * @param {WrapperModalProps} props 모달 렌더링에 필요한 속성
 * @param {boolean} props.open 모달 노출 여부
 * @param {boolean} [props.isDirty=false] 폼에 입력값이 있으면 true — ESC·overlay 닫기를 막는다
 * @param {'default' | 'notice'} [props.layout='default'] 상단 레이아웃 방식
 * @param {'sm' | 'md' | 'lg' | 'xl'} [props.size='sm'] 모달 폭 크기
 * @param {string} [props.title] 모달 제목
 * @param {string} [props.subtitle] 제목 아래 설명 문구
 * @param {import('react').ReactNode} [props.icon] notice 레이아웃에서 중앙 정렬로 보여줄 아이콘
 * @param {import('react').ReactNode} [props.children] 본문에 렌더링할 커스텀 콘텐츠
 * @param {boolean} [props.closeOnOverlayClick=true] 배경 클릭 시 닫기 허용 여부
 * @param {{ label?: string; disabled?: boolean; loading?: boolean; onClick?: () => void; variant?: 'primary' | 'danger' }} [props.primaryAction] 기본 액션 버튼 설정
 * @param {{ label?: string; disabled?: boolean; loading?: boolean; onClick?: () => void; variant?: 'secondary' }} [props.secondaryAction] 보조 액션 버튼 설정
 * @param {() => void} props.onClose 모달 닫기 핸들러
 * @returns {JSX.Element | null} 모달이 열려 있으면 다이얼로그를, 닫혀 있으면 null을 반환한다.
 */
export function WrapperModal({
  open,
  isDirty = false,
  layout = 'default',
  size = 'sm',
  title,
  subtitle,
  icon,
  noticeMeta,
  children,
  closeOnOverlayClick = true,
  buttonSize = 'md',
  primaryAction,
  secondaryAction,
  onClose,
}: WrapperModalProps) {
  const dialogRef = useRef<HTMLElement>(null);

  /* ─── ESC 닫기 — isDirty 시 차단 ─── */
  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, isDirty, onClose]);

  /* ─── 포커스 트랩 + 첫 입력 필드 자동 포커스 ─── */
  useEffect(() => {
    if (!open || !dialogRef.current) return undefined;

    const allFocusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    );

    // 닫기 버튼 제외한 첫 번째 입력 필드에 포커스
    const firstInput = allFocusable.find(
      (el) => !el.classList.contains('base-modal__close'),
    );
    firstInput?.focus();

    // Tab / Shift+Tab 포커스 트랩
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleTab);
    return () => window.removeEventListener('keydown', handleTab);
  }, [open]);

  if (!open) {
    return null;
  }

  /**
   * 기본 버튼 클릭 시 primaryAction.onClick이 있으면 호출하고,
   * 없으면 onClose를 fallback으로 사용한다.
   */
  const handlePrimaryAction = () => {
    if (primaryAction?.onClick) {
      primaryAction.onClick();
      return;
    }
    onClose();
  };

  /**
   * 보조 버튼 클릭 시 secondaryAction.onClick이 있으면 호출하고,
   * 없으면 onClose를 fallback으로 사용한다.
   */
  const handleSecondaryAction = () => {
    if (secondaryAction?.onClick) {
      secondaryAction.onClick();
      return;
    }
    onClose();
  };

  const hasSubtitle = Boolean(subtitle?.trim());
  const isNoticeLayout = layout === 'notice';
  const shouldRenderDescriptionBlock = !children && hasSubtitle;
  const resolvedPrimaryAction = primaryAction ?? { label: '확인', variant: 'primary' as const };
  const resolvedSecondaryAction = secondaryAction ?? {
    label: '닫기',
    variant: 'outline' as const,
    loading: false,
    disabled: false,
  };
  const hasPrimaryAction = Boolean(primaryAction);
  const hasSecondaryAction = Boolean(secondaryAction);

  return (
    <div
      className="base-modal-overlay"
      role="presentation"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <section
        ref={dialogRef}
        aria-label={title || subtitle || '모달'}
        aria-modal="true"
        className={`base-modal ${MODAL_SIZE_CLASS_MAP[size]}${isNoticeLayout ? ' base-modal--notice' : ''}`}
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        {!isNoticeLayout && (
          <header className="base-modal__header">
            {title ? <h3 className="base-modal__title">{title}</h3> : <div />}
            {/* TODO: 공용 IconButton 컴포넌트 도입 시 닫기 버튼 교체 */}
            <button
              aria-label="모달 닫기"
              className="base-modal__close"
              type="button"
              onClick={onClose}
            >
              ×
            </button>
          </header>
        )}

        <div className="base-modal__body">
          {isNoticeLayout && (
            <div className="base-modal__notice">
              {icon ? <div className="base-modal__notice-icon">{icon}</div> : null}
              {title ? (
                <h3 className="base-modal__title base-modal__title--center">{title}</h3>
              ) : null}
              {hasSubtitle ? (
                <p className="base-modal__description base-modal__description--center">
                  {subtitle}
                </p>
              ) : null}
              {noticeMeta ? <div className="base-modal__notice-meta">{noticeMeta}</div> : null}
            </div>
          )}

          {!isNoticeLayout && shouldRenderDescriptionBlock && (
            <>
              <p className="base-modal__description">{subtitle}</p>
              {noticeMeta ? <div className="base-modal__notice-meta">{noticeMeta}</div> : null}
            </>
          )}

          {children ? <div className="base-modal__content">{children}</div> : null}
        </div>

        <footer className="base-modal__footer">
          {hasPrimaryAction && hasSecondaryAction ? (
            <>
              <Button
                loading={resolvedPrimaryAction.loading}
                size={buttonSize}
                variant={resolvedPrimaryAction.variant ?? 'primary'}
                disabled={resolvedPrimaryAction.disabled}
                type="button"
                onClick={handlePrimaryAction}
              >
                {resolvedPrimaryAction.label ?? '확인'}
              </Button>
              <Button
                loading={resolvedSecondaryAction.loading}
                size={buttonSize}
                variant={resolvedSecondaryAction.variant ?? 'outline'}
                disabled={resolvedSecondaryAction.disabled}
                type="button"
                onClick={handleSecondaryAction}
              >
                {resolvedSecondaryAction.label ?? '닫기'}
              </Button>
            </>
          ) : hasPrimaryAction ? (
            <Button
              loading={resolvedPrimaryAction.loading}
              size={buttonSize}
              variant={resolvedPrimaryAction.variant ?? 'primary'}
              disabled={resolvedPrimaryAction.disabled}
              type="button"
              onClick={handlePrimaryAction}
            >
              {resolvedPrimaryAction.label ?? '확인'}
            </Button>
          ) : null}
        </footer>
      </section>
    </div>
  );
}
