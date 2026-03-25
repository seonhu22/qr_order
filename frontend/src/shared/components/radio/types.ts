/**
 * @fileoverview Radio 컴포넌트 공통 타입 정의
 *
 * @module radio/types
 */


/* =====================================================
 * 공용 열거형 타입
 * ===================================================== */

/**
 * 라디오 크기
 * - `sm` : 14px — 조밀한 UI
 * - `md` : 16px — 기본값 (가장 많이 사용)
 * - `lg` : 18px — 주요 폼·설정 화면
 */
export type RadioSize = 'sm' | 'md' | 'lg';


/* =====================================================
 * RadioInput Props
 * ===================================================== */

/**
 * 라디오 인풋 컴포넌트(RadioInput) Props
 */
export interface RadioInputProps {
  /**
   * 제어 컴포넌트용 체크 여부
   * 미입력 시 비제어(defaultChecked) 방식으로 동작
   */
  checked?: boolean;
  /** 비제어 모드 초기값 */
  defaultChecked?: boolean;
  /** 값 변경 콜백 */
  onChange?: (checked: boolean) => void;
  /** 라디오 오른쪽 인라인 레이블 텍스트 */
  label?: string;
  /** 레이블 아래 부가 설명 */
  description?: string;
  /**
   * 컴포넌트 크기
   * @default 'md'
   */
  size?: RadioSize;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 하단 도움말 텍스트 — errorText 가 없을 때 표시 */
  hint?: string;
  /** 에러 메시지 — 설정 시 라디오가 에러 상태로 전환 */
  errorText?: string;
  /** 성공 메시지 — errorText 가 없을 때 표시 */
  successText?: string;
  /** 최상위 래퍼 div 에 추가할 CSS 클래스 */
  className?: string;
  /** input name 속성 — 같은 그룹의 라디오끼리 동일해야 함 */
  name?: string;
  /** input value 속성 */
  value?: string;
  /** input id 속성 */
  id?: string;
}


/* =====================================================
 * RadioOption
 * ===================================================== */

/**
 * RadioGroup 옵션 아이템
 */
export interface RadioOption {
  /** 옵션 값 */
  value: string;
  /** 표시 텍스트 */
  label: string;
  /** 레이블 아래 부가 설명 */
  description?: string;
  /** 도움말 텍스트 */
  hint?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
}


/* =====================================================
 * RadioGroup Props
 * ===================================================== */

/**
 * 라디오 그룹 컴포넌트(RadioGroup) Props
 */
export interface RadioGroupProps {
  /** 그룹 상단 레이블 */
  label?: string;
  /**
   * input name 속성 — 그룹 내 모든 라디오에 적용
   * 같은 name 을 가진 라디오끼리 단일 선택 동작
   */
  name: string;
  /** 제어 컴포넌트용 선택값 */
  value?: string;
  /** 비제어 모드 초기값 */
  defaultValue?: string;
  /** 값 변경 콜백 */
  onChange?: (value: string) => void;
  /**
   * 정렬 방향
   * @default 'col'
   */
  direction?: 'row' | 'col';
  /**
   * 컴포넌트 크기
   * @default 'md'
   */
  size?: RadioSize;
  /** 라디오 옵션 목록 */
  options: RadioOption[];
  /** 에러 메시지 */
  errorText?: string;
  /** 성공 메시지 */
  successText?: string;
  /** 도움말 텍스트 */
  hint?: string;
  /** 최상위 래퍼 div 에 추가할 CSS 클래스 */
  className?: string;
}
