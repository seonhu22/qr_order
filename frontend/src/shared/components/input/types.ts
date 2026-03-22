/**
 * @fileoverview Input 계열 컴포넌트 공통 타입 정의
 *
 * @description
 * - InputBase · InputWrapper · TextInput · (추후) Select · Checkbox 에서 공유
 * - 이 파일의 타입은 직접 확장하거나 조합해서 사용한다
 *
 * @module input/types
 */

import type { InputHTMLAttributes, ReactNode } from 'react';


/* =====================================================
 * 공용 열거형 타입
 * ===================================================== */

/**
 * 인풋 크기
 * - `sm` : 30px — 인라인·조밀한 UI
 * - `md` : 36px — 기본값 (가장 많이 사용)
 * - `lg` : 44px — 주요 CTA·검색 인풋
 */
export type InputSize = 'sm' | 'md' | 'lg';

/**
 * 레이블 위치
 * - `top`    : 인풋 위 (기본값)
 * - `bottom` : 인풋 아래
 * - `left`   : 인풋 왼쪽 (수평 정렬)
 * - `right`  : 인풋 오른쪽 (수평 정렬)
 */
export type LabelPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * 인풋 컨트롤 시각적 상태
 * - hover · focus 는 CSS `:hover` / `:focus-within` 으로 처리하므로 제외
 * - `''` : 기본 상태 (data-state 속성 미부여)
 */
export type InputControlState =
  | 'disabled'
  | 'readonly'
  | 'error'
  | 'success'
  | '';


/* =====================================================
 * InputWrapper 공통 Props
 * Select · Checkbox 등 다양한 컨트롤과 함께 사용한다
 * ===================================================== */

/**
 * InputWrapper 가 요구하는 레이블·도움말 관련 Props
 */
export interface InputWrapperBaseProps {
  /** 레이블 텍스트 */
  label?: string;
  /** 필수 여부 — 빨간 * 표시 */
  required?: boolean;
  /**
   * 레이블 위치 (기본: `'top'`)
   * @default 'top'
   */
  labelPosition?: LabelPosition;
  /** left / right 레이블 고정 너비 (예: `'6rem'`, `'80px'`) */
  labelWidth?: string;
  /** 하단 도움말 텍스트 — errorText 가 없을 때 표시 */
  hint?: string;
  /**
   * 고정 안내 메시지 — 상태(에러·성공)에 무관하게 항상 표시되는 정보성 문구
   * 예) "영문·숫자 조합 8자 이상", "이메일로 인증 코드가 발송됩니다"
   */
  infoText?: string;
  /** 에러 메시지 — 설정 시 컨트롤이 에러 상태로 전환 */
  errorText?: string;
  /** 성공 메시지 — errorText 가 없을 때 표시, 설정 시 컨트롤이 성공 상태로 전환 */
  successText?: string;
}


/* =====================================================
 * InputBase Props
 * ===================================================== */

/**
 * 순수 인풋 컨트롤 박스(InputBase) Props
 *
 * @extends {Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>}
 */
export interface InputBaseProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * 인풋 크기 (기본: `'md'`)
   * @default 'md'
   */
  size?: InputSize;
  /** 왼쪽 슬롯 — 아이콘·장식 요소 (비인터랙티브) */
  leftSlot?: React.ReactNode;
  /**
   * 오른쪽 슬롯 — 아이콘·버튼·스피너
   * 인터랙티브 요소(버튼)를 넣을 경우 pointer-events 가 자동 허용됨
   */
  rightSlot?: React.ReactNode;
  /**
   * 컨트롤 시각적 상태
   * hover · focus 는 CSS 에서 처리하므로 제외
   * @default ''
   */
  controlState?: InputControlState;
}


/* =====================================================
 * SelectInput — 옵션 아이템
 * ===================================================== */

/**
 * 셀렉트 드롭다운 옵션 아이템
 */
export interface SelectOption {
  /** 선택 시 onChange 로 전달되는 값 */
  value: string;
  /** 드롭다운에 표시되는 텍스트 */
  label: string;
  /** 옵션 아래 부가 설명 (선택) */
  description?: string;
  /** 옵션 왼쪽 아이콘 (선택) */
  icon?: ReactNode;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 그룹핑 키 — 같은 값끼리 그룹 헤더 아래 묶임 */
  group?: string;
}


/* =====================================================
 * SelectInput Props
 * ===================================================== */

/**
 * 셀렉트 인풋 완성형 컴포넌트(SelectInput) Props
 *
 * InputWrapperBaseProps(레이블·도움말) 를 조합한다
 *
 * @extends {InputWrapperBaseProps}
 */
export interface SelectInputProps extends InputWrapperBaseProps {
  /** 드롭다운 옵션 목록 */
  options: SelectOption[];
  /**
   * 제어 컴포넌트용 선택 값
   * 미입력 시 비제어(defaultValue) 방식으로 동작
   */
  value?: string;
  /** 비제어 모드 초기값 */
  defaultValue?: string;
  /** 값 변경 콜백 */
  onChange?: (value: string) => void;
  /**
   * 미선택 시 표시 텍스트
   * @default '선택하세요'
   */
  placeholder?: string;
  /**
   * 컴포넌트 크기
   * @default 'md'
   */
  size?: InputSize;
  /**
   * 검색 기능 활성화 — 드롭다운 상단에 검색 인풋 표시
   * @default false
   */
  searchable?: boolean;
  /**
   * 로딩 스피너 표시 — 비동기 옵션 로딩 시 사용
   * @default false
   */
  loading?: boolean;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 읽기 전용 — 드롭다운이 열리지 않음 */
  readOnly?: boolean;
  /** 최상위 래퍼 div 에 추가할 CSS 클래스 */
  className?: string;
}


/* =====================================================
 * TextInput Props
 * ===================================================== */

/**
 * 텍스트 인풋 완성형 컴포넌트(TextInput) Props
 *
 * InputWrapperBaseProps(레이블·도움말) +
 * InputHTMLAttributes(네이티브 이벤트 전체 포함) 를 조합한다
 *
 * @extends {Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>}
 * @extends {InputWrapperBaseProps}
 */
export interface TextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    InputWrapperBaseProps {
  /**
   * 인풋 크기 (기본: `'md'`)
   * @default 'md'
   */
  size?: InputSize;
  /** 인풋 왼쪽 아이콘 */
  leftIcon?: React.ReactNode;
  /**
   * 인풋 오른쪽 아이콘
   * `loading` 또는 `showPasswordToggle` 이 활성화되면 무시됨
   */
  rightIcon?: React.ReactNode;
  /**
   * 로딩 스피너 표시 여부
   * @default false
   */
  loading?: boolean;
  /**
   * 비밀번호 표시/숨기기 토글 버튼 활성화
   * `type="password"` 와 함께 사용 권장
   * @default false
   */
  showPasswordToggle?: boolean;
  /** 최상위 래퍼 div 에 추가할 CSS 클래스 */
  className?: string;
}
