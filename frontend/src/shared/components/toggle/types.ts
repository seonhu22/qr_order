/**
 * @fileoverview Toggle 컴포넌트 공통 타입 정의
 *
 * @module toggle/types
 */


/* =====================================================
 * 공용 열거형 타입
 * ===================================================== */

/**
 * 토글 크기
 * - `sm` : 트랙 32×24px — 조밀한 UI
 * - `md` : 트랙 40×28px — 기본값 (가장 많이 사용)
 * - `lg` : 트랙 44×30px — 주요 폼·설정 화면
 */
export type ToggleSize = 'sm' | 'md' | 'lg';

/**
 * 레이블 위치
 * - `left`  : 레이블이 트랙 왼쪽에 위치
 * - `right` : 레이블이 트랙 오른쪽에 위치 (기본값)
 */
export type ToggleLabelPosition = 'left' | 'right';


/* =====================================================
 * ToggleInput Props
 * ===================================================== */

/**
 * 토글 스위치 컴포넌트(ToggleInput) Props
 */
export interface ToggleInputProps {
  /**
   * 제어 컴포넌트용 켜짐 여부
   * 미입력 시 비제어(defaultChecked) 방식으로 동작
   */
  checked?: boolean;
  /** 비제어 모드 초기값 */
  defaultChecked?: boolean;
  /** 값 변경 콜백 */
  onChange?: (checked: boolean) => void;
  /**
   * 컴포넌트 크기
   * @default 'md'
   */
  size?: ToggleSize;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 로딩 중 여부 — 썸 내부에 스피너 표시 */
  loading?: boolean;
  /** 트랙 옆에 표시할 레이블 텍스트 */
  label?: string;
  /**
   * 레이블 위치
   * @default 'right'
   */
  labelPosition?: ToggleLabelPosition;
  /** 레이블 아래 도움말 텍스트 */
  hint?: string;
  /** 최상위 래퍼에 추가할 CSS 클래스 */
  className?: string;
}