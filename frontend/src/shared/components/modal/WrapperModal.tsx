// src/shared/components/modal/WrapperModal.tsx

/**
 * @fileoverview 공용 모달 레이아웃 래퍼 컴포넌트
 *
 * @description
 * - 오버레이, 다이얼로그 박스, 헤더/본문/푸터의 공통 레이아웃을 담당한다.
 * - `layout="default"`일 때는 상단에 title + 닫기 버튼을 사용한다.
 * - `layout="notice"`일 때는 닫기 버튼을 숨기고 icon, title, subtitle을 가운데 정렬한다.
 * - footer는 body 종류와 무관하게 single 또는 double action 정책으로 렌더링한다.
 * - 추후 공용 Button/IconButton 컴포넌트가 완성되면 현재 버튼을 교체할 수 있도록 TODO를 남긴다.
 *
 * @example
 * <WrapperModal
 *   open={open}
 *   title="저장 완료"
 *   subtitle="정상적으로 저장되었습니다."
 *   onClose={() => setOpen(false)}
 * />
 *
 * @example
 * <WrapperModal
 *   open={open}
 *   layout="notice"
 *   actions="double"
 *   icon={<span>!</span>}
 *   title="삭제 확인"
 *   subtitle="선택한 항목을 삭제하시겠습니까?"
 *   primaryLabel="삭제"
 *   secondaryLabel="닫기"
 *   onClose={handleClose}
 *   onConfirm={handleDelete}
 * />
 */

import { useEffect } from 'react';
import './modal.css';

import type { ModalSize, WrapperModalProps } from './modalType';

const sizeClassMap: Record<ModalSize, string> = {
  sm: 'base-modal--sm',
  md: 'base-modal--md',
  lg: 'base-modal--lg',
  xl: 'base-modal--xl',
};

/**
 * 공용 모달 래퍼를 렌더링한다.
 *
 * @param {WrapperModalProps} props 모달 렌더링에 필요한 속성
 * @param {boolean} props.open 모달 노출 여부
 * @param {'default' | 'notice'} [props.layout='default'] 상단 레이아웃 방식
 * @param {'single' | 'double'} [props.actions='single'] footer 버튼 개수
 * @param {'sm' | 'md' | 'lg' | 'xl'} [props.size='sm'] 모달 폭 크기
 * @param {string} [props.title] 모달 제목
 * @param {string} [props.subtitle] 제목 아래 설명 문구
 * @param {import('react').ReactNode} [props.icon] notice 레이아웃에서 중앙 정렬로 보여줄 아이콘
 * @param {import('react').ReactNode} [props.children] 본문에 렌더링할 커스텀 콘텐츠
 * @param {boolean} [props.closeOnOverlayClick=true] 배경 클릭 시 닫기 허용 여부
 * @param {string} [props.primaryLabel='확인'] 기본 액션 버튼 라벨
 * @param {string} [props.secondaryLabel='닫기'] 보조 액션 버튼 라벨
 * @param {() => void} props.onClose 모달 닫기 핸들러
 * @param {() => void} [props.onConfirm] 기본 액션 버튼 클릭 핸들러
 * @param {() => void} [props.onSecondaryAction] 보조 액션 버튼 클릭 핸들러
 * @returns {JSX.Element | null} 모달이 열려 있으면 다이얼로그를, 닫혀 있으면 null을 반환한다.
 */
export function WrapperModal({
  open,
  layout = 'default',
  actions = 'single',
  size = 'sm',
  title,
  subtitle,
  icon,
  children,
  closeOnOverlayClick = true,
  primaryLabel = '확인',
  secondaryLabel = '닫기',
  onClose,
  onConfirm,
  onSecondaryAction,
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
   * 확인 버튼 클릭 시 onConfirm이 있으면 호출하고,
   * 없으면 onClose를 fallback으로 사용한다.
   *
   * @returns {void}
   */
  const handlePrimaryAction = () => {
    if (onConfirm) {
      onConfirm();
      return;
    }

    onClose();
  };

  /**
   * 보조 버튼 클릭 시 onSecondaryAction이 있으면 호출하고,
   * 없으면 onClose를 fallback으로 사용한다.
   *
   * @returns {void}
   */
  const handleSecondaryAction = () => {
    if (onSecondaryAction) {
      onSecondaryAction();
      return;
    }

    onClose();
  };

  const hasSubtitle = Boolean(subtitle?.trim());
  const isNoticeLayout = layout === 'notice';
  const shouldRenderDoubleActions = actions === 'double';
  const shouldRenderDescriptionBlock = !children && hasSubtitle;

  return (
    <div
      className="base-modal-overlay"
      role="presentation"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <section
        aria-label={title || subtitle || '모달'}
        aria-modal="true"
        className={`base-modal ${sizeClassMap[size]}${isNoticeLayout ? ' base-modal--notice' : ''}`}
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
              {title ? <h3 className="base-modal__title base-modal__title--center">{title}</h3> : null}
              {hasSubtitle ? (
                <p className="base-modal__description base-modal__description--center">{subtitle}</p>
              ) : null}
            </div>
          )}

          {!isNoticeLayout && shouldRenderDescriptionBlock && (
            <p className="base-modal__description">{subtitle}</p>
          )}

          {children ? <div className="base-modal__content">{children}</div> : null}
        </div>

        <footer className="base-modal__footer">
          {shouldRenderDoubleActions ? (
            <>
              {/* TODO: 공용 Button 컴포넌트 도입 시 보조 버튼으로 교체 */}
              <button
                className="base-modal__secondary"
                type="button"
                onClick={handleSecondaryAction}
              >
                {secondaryLabel}
              </button>
              {/* TODO: 공용 Button 컴포넌트 도입 시 기본 버튼으로 교체 */}
              <button className="base-modal__confirm" type="button" onClick={handlePrimaryAction}>
                {primaryLabel}
              </button>
            </>
          ) : (
            <>
              {/* TODO: 공용 Button 컴포넌트 도입 시 기본 버튼으로 교체 */}
              <button className="base-modal__confirm" type="button" onClick={handlePrimaryAction}>
                {primaryLabel}
              </button>
            </>
          )}
        </footer>
      </section>
    </div>
  );
}
