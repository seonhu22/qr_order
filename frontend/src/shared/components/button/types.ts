/**
 * @fileoverview Button 계열 컴포넌트 공통 타입 정의
 *
 * @description
 * - Button · LinkButton 에서 공유
 *
 * @module button/types
 */

import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';


/* =====================================================
 * 공용 열거형 타입
 * ===================================================== */

/**
 * 버튼 시각적 변형
 * - `primary`   : 브랜드 주황 — 주요 제출·CTA
 * - `secondary` : 슬레이트 배경 — 보조 액션
 * - `outline`   : 외곽선 — 조회·초기화
 * - `ghost`     : 배경 없음 — 취소·더 보기
 * - `danger`    : 빨간 배경 — 삭제·위험 액션
 * - `text`      : 패딩 없는 텍스트 링크 (슬레이트)
 * - `link`      : 패딩 없는 텍스트 링크 (브랜드)
 * - `icon`      : 정사각형 아이콘 전용 버튼
 * - `icon-text` : 아이콘 + 텍스트 조합 (secondary 스타일)
 * - `toggle`    : 선택 가능한 토글 버튼
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'text'
  | 'link'
  | 'icon'
  | 'icon-text'
  | 'toggle';

/**
 * 버튼 크기
 * - `sm` : 30px — 테이블 인라인 액션
 * - `md` : 36px — 기본값 (가장 많이 사용)
 * - `lg` : 44px — 주요 CTA
 */
export type ButtonSize = 'sm' | 'md' | 'lg';


/* =====================================================
 * Button Props
 * ===================================================== */

/**
 * Button 컴포넌트 Props
 *
 * @extends {ButtonHTMLAttributes<HTMLButtonElement>}
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 시각적 변형 (기본: `'primary'`)
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * 크기 (기본: `'md'`)
   * @default 'md'
   */
  size?: ButtonSize;
  /**
   * 로딩 스피너 표시 — true 이면 disabled 처리됨
   * @default false
   */
  loading?: boolean;
  /**
   * 선택 상태 — `toggle` 변형에서 사용
   * @default false
   */
  selected?: boolean;
  /** 버튼 텍스트 왼쪽 아이콘 */
  leftIcon?: ReactNode;
  /** 버튼 텍스트 오른쪽 아이콘 */
  rightIcon?: ReactNode;
  /**
   * 아이콘 전용 콘텐츠 — `icon` 변형에서 사용
   * children 대신 이 prop 으로 아이콘을 전달한다
   */
  iconOnly?: ReactNode;
}


/* =====================================================
 * LinkButton Props
 * ===================================================== */

/**
 * LinkButton 컴포넌트 Props
 * `<a>` 태그 기반 버튼. `target="_blank"` 시 외부 링크 아이콘 자동 표시.
 *
 * @extends {AnchorHTMLAttributes<HTMLAnchorElement>}
 */
export interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * 시각적 변형 (기본: `'primary'`)
   * icon · toggle 변형은 LinkButton 에서 사용하지 않음
   * @default 'primary'
   */
  variant?: Exclude<ButtonVariant, 'icon' | 'toggle'>;
  /**
   * 크기 (기본: `'md'`)
   * @default 'md'
   */
  size?: ButtonSize;
  /** 버튼 텍스트 왼쪽 아이콘 */
  leftIcon?: ReactNode;
  /** 버튼 텍스트 오른쪽 아이콘 */
  rightIcon?: ReactNode;
  /**
   * 비활성화 — href 이동을 막고 opacity 처리
   * @default false
   */
  disabled?: boolean;
}
