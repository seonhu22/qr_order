/**
 * @fileoverview 버튼 컴포넌트
 *
 * @description
 * - 10가지 변형 × 3가지 크기 × 다양한 상태를 지원하는 공용 버튼
 * - `Button`     : `<button>` 태그 기반
 * - `LinkButton` : `<a>` 태그 기반 (target="_blank" 시 외부 링크 아이콘 자동 표시)
 *
 * @module button/Button
 */

import './Button.css';
import { Icon } from '@/shared/assets/icons/Icon';
import type { ButtonProps, LinkButtonProps, ButtonSize } from './types';


/* =====================================================
 * 크기별 아이콘 픽셀 크기
 * ===================================================== */

const iconSizeMap: Record<ButtonSize, number> = {
  sm: 13,
  md: 15,
  lg: 17,
};


/* =====================================================
 * Button
 * ===================================================== */

/**
 * 기본 버튼 컴포넌트
 *
 * @example
 * // 기본 (primary MD)
 * <Button>저장</Button>
 *
 * @example
 * // 아이콘 포함
 * <Button variant="primary" size="md" leftIcon={<Icon id="i-plus" size={15} />}>신규 등록</Button>
 *
 * @example
 * // 아이콘 전용 (icon 변형)
 * <Button variant="icon" size="md" iconOnly={<Icon id="i-search" size={15} />} />
 *
 * @example
 * // 토글
 * <Button variant="toggle" size="md" selected={active} onClick={toggle}>목록</Button>
 *
 * @example
 * // 로딩
 * <Button variant="primary" loading>처리중...</Button>
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  selected = false,
  leftIcon,
  rightIcon,
  iconOnly,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const isIconVariant = variant === 'icon';
  const iconSize = iconSizeMap[size];

  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    isIconVariant ? 'btn--icon-square' : '',
    loading ? 'btn--loading' : '',
    variant === 'toggle' && selected ? 'btn--selected' : '',
    isDisabled && !loading ? 'btn--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button {...props} disabled={isDisabled} className={classes}>
      {loading ? (
        <>
          <Icon id="i-loading" size={iconSize} className="btn__spinner" />
          {!isIconVariant && children != null && (
            <span className="btn__text">{children}</span>
          )}
        </>
      ) : isIconVariant ? (
        /* icon 변형 — iconOnly 우선, 없으면 children */
        <span className="btn__icon-left" aria-hidden="true">
          {iconOnly ?? children}
        </span>
      ) : (
        <>
          {leftIcon != null && (
            <span className="btn__icon-left" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          {children != null && (
            <span className="btn__text">{children}</span>
          )}
          {rightIcon != null && (
            <span className="btn__icon-right" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </>
      )}
    </button>
  );
}


/* =====================================================
 * LinkButton
 * ===================================================== */

/**
 * `<a>` 태그 기반 버튼 컴포넌트
 * URL 이동이 필요한 접속·미리보기·외부 링크 액션에 사용한다.
 * `target="_blank"` 설정 시 외부 링크 아이콘(`i-external-link`)이 자동으로 표시된다.
 *
 * @example
 * <LinkButton variant="primary" size="sm" href="/stores/1" target="_blank">접속</LinkButton>
 *
 * @example
 * // 비활성 — href 이동 차단
 * <LinkButton variant="outline" href="/preview" disabled>미리보기</LinkButton>
 */
export function LinkButton({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  disabled = false,
  children,
  className = '',
  target,
  href,
  ...props
}: LinkButtonProps) {
  const showExternal = target === '_blank' && rightIcon == null;
  const iconSize = iconSizeMap[size];

  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    disabled ? 'btn--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <a
      {...props}
      href={disabled ? undefined : href}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className={classes}
      aria-disabled={disabled || undefined}
    >
      {leftIcon != null && (
        <span className="btn__icon-left" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      {children != null && (
        <span className="btn__text">{children}</span>
      )}
      {showExternal && (
        <span className="btn__icon-right" style={{ opacity: 0.7 }}>
          <Icon id="i-external-link" size={iconSize - 2} />
        </span>
      )}
      {rightIcon != null && (
        <span className="btn__icon-right" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </a>
  );
}
