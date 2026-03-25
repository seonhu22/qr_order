// src/shared/components/modal/WrapperModal.tsx

/**
 * @fileoverview 공용 모달 레이아웃 래퍼 컴포넌트
 *
 * @description
 * - 오버레이, 다이얼로그 박스, 헤더/본문/푸터의 공통 레이아웃을 담당한다.
 * - `layout="default"`일 때는 상단에 title + 닫기 버튼을 사용한다.
 * - `layout="notice"`일 때는 닫기 버튼을 숨기고 icon, title, subtitle을 가운데 정렬한다.
 * - footer는 액션 객체 존재 여부에 따라 버튼을 렌더링한다.
 * - 버튼의 외형은 공용 Button이 담당하고, modal은 배치용 스타일만 유지한다.
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
 *   layout="notice"
 *   icon={<span>!</span>}
 *   title="삭제 확인"
 *   subtitle="선택한 항목을 삭제하시겠습니까?"
 *   primaryAction={{ label: '삭제', variant: 'danger', onClick: handleDelete }}
 *   secondaryAction={{ label: '닫기', onClick: handleClose }}
 *   onClose={handleClose}
 * />
 */

import { useEffect } from 'react';
import { Button } from '@/shared/components/button';
import { MODAL_BUTTON_SIZE_MAP, MODAL_SIZE_CLASS_MAP } from './modal.constants';
import './modal.css';

import type { WrapperModalProps } from './modalType';

/**
 * 공용 모달 래퍼를 렌더링한다.
 *
 * @param {WrapperModalProps} props 모달 렌더링에 필요한 속성
 * @param {boolean} props.open 모달 노출 여부
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
  layout = 'default',
  size = 'sm',
  title,
  subtitle,
  icon,
  children,
  closeOnOverlayClick = true,
  primaryAction,
  secondaryAction,
  onClose,
}: WrapperModalProps) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    /**
     * ESC 입력 시 모달을 닫는다.
     *
     * @param {KeyboardEvent} event 키보드 이벤트 객체
     * @returns {void}
     */
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

  /**
   * 기본 버튼 클릭 시 primaryAction.onClick이 있으면 호출하고,
   * 없으면 onClose를 fallback으로 사용한다.
   *
   * @returns {void}
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
   *
   * @returns {void}
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
  const buttonSize = MODAL_BUTTON_SIZE_MAP[size];
  const resolvedPrimaryAction = primaryAction ?? { label: '확인', variant: 'primary' as const };
  const resolvedSecondaryAction = secondaryAction ?? {
    label: '닫기',
    variant: 'secondary' as const,
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
            </div>
          )}

          {!isNoticeLayout && shouldRenderDescriptionBlock && (
            <p className="base-modal__description">{subtitle}</p>
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
                variant={resolvedSecondaryAction.variant ?? 'secondary'}
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
