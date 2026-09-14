/**
 * @fileoverview Consumer 전용 SVG 스프라이트 아이콘 컴포넌트
 *
 * @description
 * - `consumerSprite.svg`는 참고 저장소(git)가 실제 쓰는 lucide 아이콘의 path를 재현한 것이라
 *   Admin/Client가 쓰는 `shared/assets/icons/sprite.svg`(Material 느낌)와는 다른 파일로 분리했다.
 * - API는 `shared/assets/icons/Icon`과 동일하다 — `id`만 `ci-` 접두사를 쓴다.
 *
 * @example
 * <ConsumerIcon id="ci-search" size={16} />
 */
import consumerSpriteUrl from './consumerSprite.svg?url';

export interface ConsumerIconProps {
  /** consumerSprite.svg 내 symbol id (예: 'ci-search', 'ci-bell') */
  id: string;
  /** 아이콘 크기 (px). width/height 동일하게 설정 */
  size?: number;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 접근성: 스크린리더에 전달할 텍스트 (기본: aria-hidden) */
  label?: string;
}

export function ConsumerIcon({ id, size = 16, className, label }: ConsumerIconProps) {
  const symbolHref = `${consumerSpriteUrl}#${id}`;
  const a11yProps = label ? { 'aria-label': label } : { 'aria-hidden': true };

  return (
    <svg width={size} height={size} className={className} focusable="false" {...a11yProps}>
      <use href={symbolHref} xlinkHref={symbolHref} width="100%" height="100%" />
    </svg>
  );
}
