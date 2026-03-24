/**
 * @fileoverview SVG 스프라이트 기반 아이콘 컴포넌트
 *
 * @description
 * - `sprite.svg`의 `<symbol>` 아이디를 `id` prop 으로 지정
 * - `currentColor` 를 사용하므로 부모의 `color` CSS 로 색상 제어 가능
 *
 * @module assets/icons/Icon
 *
 * @example
 * <Icon id="i-search" size={16} />
 * <Icon id="i-trash" size={20} className="text-red-500" />
 */

import spriteUrl from './sprite.svg?url';

export interface IconProps {
  /** sprite.svg 내 symbol id (예: 'i-search', 'i-loading') */
  id: string;
  /** 아이콘 크기 (px). width/height 동일하게 설정 */
  size?: number;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 접근성: 스크린리더에 전달할 텍스트 (기본: aria-hidden) */
  label?: string;
}

export function Icon({ id, size = 16, className, label }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      focusable="false"
    >
      <use href={`${spriteUrl}#${id}`} />
    </svg>
  );
}
