/**
 * @fileoverview FormAlert 컴포넌트 공통 타입 정의
 *
 * @module form-alert/types
 */


/* =====================================================
 * 공용 열거형 타입
 * ===================================================== */

/**
 * 알림 유형
 * - `error`   : 에러·실패·위험 — 빨간색
 * - `info`    : 안내·참고 — 파란색
 * - `guide`   : 가이드·도움말·팁 — 노란색
 * - `success` : 성공·완료 — 초록색
 */
export type FormAlertType = 'error' | 'info' | 'guide' | 'success';


/* =====================================================
 * FormAlert Props
 * ===================================================== */

/**
 * FormAlert 컴포넌트 Props
 */
export interface FormAlertProps {
  /**
   * 알림 유형
   * @default 'error'
   */
  type?: FormAlertType;
  /** 굵게 표시되는 제목 */
  title?: string;
  /** 제목 아래 설명 텍스트 */
  description?: string | React.ReactNode;
  /** 필드별 에러 목록 — 불릿 리스트로 렌더링 */
  errors?: string[];
  /**
   * 닫기 버튼 표시 여부
   * @default true
   */
  dismissible?: boolean;
  /** 닫기 버튼 클릭 콜백 */
  onDismiss?: () => void;
  /** 최상위 래퍼에 추가할 CSS 클래스 */
  className?: string;
}


/* =====================================================
 * DismissibleFormAlert Props
 * ===================================================== */

/**
 * 자체 표시/숨김 상태를 관리하는 FormAlert 래퍼 Props
 */
export interface DismissibleFormAlertProps extends Omit<FormAlertProps, 'onDismiss'> {
  /**
   * 초기 표시 여부
   * @default true
   */
  defaultShow?: boolean;
}