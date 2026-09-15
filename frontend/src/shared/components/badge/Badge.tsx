/**
 * @fileoverview 배지 컴포넌트
 *
 * @description
 * - 짧은 텍스트를 강조해서 보여주는 라벨/태그 컴포넌트
 * - 알약형이 아니라 살짝만 둥근 사각형 — 기존 admin `.status-badge`, 참고 디자인의
 *   `rounded-[3px]` 배지와 톤을 맞췄다
 *
 * @module badge/Badge
 */

import './Badge.css';
import type { BadgeProps } from './types';

/**
 * 배지 컴포넌트
 *
 * @param {BadgeProps} props
 * @returns {JSX.Element}
 *
 * @example
 * <Badge tone="brand">필수</Badge>
 *
 * @example
 * <Badge tone="neutral">선택</Badge>
 *
 * @example
 * <Badge tone="error" size="sm">품절</Badge>
 */
export function Badge({ children, tone = 'neutral', size = 'md', className }: BadgeProps) {
  return (
    <span
      className={['badge', `badge--${tone}`, `badge--${size}`, className ?? '']
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}
