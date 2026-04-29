/**
 * @fileoverview 403/404/500 에러 페이지 공통 레이아웃 컴포넌트.
 *
 * @description
 * 이미지·상태코드·제목·설명·버튼 영역을 공통으로 렌더링한다.
 * 상태코드별 문구와 앱별 이동 경로는 이 컴포넌트가 직접 알지 않는다.
 * 호출 측(shared/pages/error/*)에서 props로 주입한다.
 */
import './ErrorPageTemplate.css';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/shared/assets/icons/Icon';
import { Button } from '@/shared/components/button';
import type { ErrorPageAction, ErrorPageTemplateProps } from './types';

/**
 * 버튼 한 개를 렌더링하는 내부 컴포넌트.
 * - 항상 공용 Button으로 렌더링해 hover/focus/active 스타일을 공유한다.
 * - `to`가 있으면 react-router-dom navigate로 내부 이동한다.
 * - `onClick`만 있으면 커스텀 콜백을 실행한다.
 */
type ErrorPageActionButtonProps = ErrorPageAction & {
  variant?: 'primary' | 'outline';
};

function ActionButton({ label, to, onClick, variant = 'primary' }: ErrorPageActionButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
      return;
    }

    onClick?.();
  };

  return (
    <Button type="button" variant={variant} size="md" className="error-page__action" onClick={handleClick}>
      {label}
    </Button>
  );
}

/**
 * 에러 페이지 공통 레이아웃.
 *
 * @example
 * // 404 페이지
 * <ErrorPageTemplate
 *   statusCode="404"
 *   title="페이지를 찾을 수 없습니다."
 *   description="주소가 변경되었거나 삭제된 페이지입니다."
 *   imageVariant="not-found"
 *   primaryAction={{ label: '메인으로 이동', to: '/admin/main' }}
 * />
 *
 * @example
 * // 500 페이지 — 재시도 버튼 있음
 * <ErrorPageTemplate
 *   statusCode="500"
 *   title="서버 오류가 발생했습니다."
 *   imageVariant="server-error"
 *   primaryAction={{ label: '다시 시도', onClick: retryAction }}
 *   secondaryAction={{ label: '메인으로 이동', to: '/admin/main' }}
 * />
 */
export function ErrorPageTemplate({
  statusCode,
  title,
  description,
  imageVariant,
  layout = 'contained',
  primaryAction,
  secondaryAction,
}: ErrorPageTemplateProps) {
  return (
    <div className={`error-page error-page--${layout}`}>
      <div className={`error-page__image error-page__image--${imageVariant}`} aria-hidden="true">
        <Icon id="i-qr" size={64} className="error-page__icon" />
      </div>
      <p className="error-page__code">{statusCode}</p>
      <h1 className="error-page__title">{title}</h1>
      {description && <p className="error-page__description">{description}</p>}
      <div className="error-page__actions">
        <ActionButton {...primaryAction} />
        {secondaryAction && <ActionButton {...secondaryAction} variant="outline" />}
      </div>
    </div>
  );
}
