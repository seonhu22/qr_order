/**
 * @fileoverview Badge 컴포넌트 공통 타입 정의
 *
 * @module badge/types
 */

import type { ReactNode } from 'react';

/**
 * 배지 색상 톤
 * - `neutral`  : 중립 회색 — 기본값
 * - `brand`    : 브랜드 강조(필수 표시 등)
 * - `success`  : 성공/완료
 * - `warning`  : 경고/주의
 * - `error`    : 오류/거부
 */
export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'error';

/**
 * 배지 크기
 * - `sm` : 조밀한 UI(테이블 셀 등)
 * - `md` : 기본값
 */
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  /** 배지 안에 표시할 내용(대개 짧은 텍스트) */
  children: ReactNode;
  /**
   * 색상 톤
   * @default 'neutral'
   */
  tone?: BadgeTone;
  /**
   * 크기
   * @default 'md'
   */
  size?: BadgeSize;
  /** 최상위 요소에 추가할 CSS 클래스 */
  className?: string;
}
