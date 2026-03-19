/**
 * @fileoverview 텍스트 인풋 완성형 컴포넌트
 *
 * @description
 * - InputBase(컨트롤 박스) + InputWrapper(레이아웃) 를 조합한 최종 컴포넌트
 * - 비밀번호 표시/숨기기 토글, 로딩 스피너 기능을 내장
 * - 모든 네이티브 input 이벤트(onChange, onFocus, onBlur, onKeyDown …)는
 *   InputBase 를 통해 `<input>` 으로 그대로 전달된다
 * - 동일 화면에서 여러 인스턴스를 독립적으로 사용할 수 있도록
 *   각 인스턴스는 별도 상태와 고유 id 를 가진다
 *
 * @module input/TextInput
 */

import { useState, useId } from 'react';
import { InputBase } from './InputBase';
import { InputWrapper } from './InputWrapper';
import type { TextInputProps, InputControlState, InputSize } from './types';


/* =====================================================
 * 내부 SVG 아이콘 (외부 아이콘 라이브러리 의존 없음)
 * ===================================================== */

/** 비밀번호 표시 아이콘 (눈 모양) */
function EyeIcon({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** 비밀번호 숨기기 아이콘 (눈에 선이 그어진 모양) */
function EyeOffIcon({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

/** 로딩 스피너 아이콘 */
function SpinnerIcon({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="input-spinner"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}


/* =====================================================
 * 크기별 아이콘 픽셀 크기
 * ===================================================== */

/** 비밀번호 토글 아이콘 크기 */
const PW_ICON_SIZE: Record<InputSize, number> = { sm: 12, md: 14, lg: 16 };

/** 로딩 스피너 아이콘 크기 */
const SPINNER_SIZE: Record<InputSize, number> = { sm: 12, md: 14, lg: 16 };


/* =====================================================
 * TextInput 컴포넌트
 * ===================================================== */

/**
 * 텍스트 인풋 완성형 컴포넌트
 *
 * @param {TextInputProps} props
 * @returns {JSX.Element}
 *
 * @example
 * // 기본 사용
 * <TextInput label="이름" placeholder="이름을 입력하세요" />
 *
 * @example
 * // 에러 상태
 * <TextInput label="이메일" errorText="올바른 이메일 형식이 아닙니다" />
 *
 * @example
 * // 고정 안내 메시지 (상태 무관하게 항상 표시)
 * <TextInput label="비밀번호" infoText="영문·숫자 조합 8자 이상" />
 *
 * @example
 * // 비밀번호 토글 (구조 동일, 기능 플래그로 활성화)
 * <TextInput label="비밀번호" type="password" showPasswordToggle />
 *
 * @example
 * // 왼쪽 아이콘 + 로딩
 * <TextInput leftIcon={<SearchIcon />} loading placeholder="검색" />
 *
 * @example
 * // 레이블 왼쪽 배치
 * <TextInput label="이름" labelPosition="left" labelWidth="5rem" />
 */
export function TextInput({
  /* 크기 */
  size = 'md',

  /* 래퍼 props (레이블·도움말) */
  label,
  required,
  labelPosition = 'top',
  labelWidth,
  hint,
  infoText,
  errorText,
  successText,

  /* 아이콘 */
  leftIcon,
  rightIcon,

  /* 기능 플래그 */
  loading = false,
  showPasswordToggle = false,

  /* 레이아웃 */
  className,

  /* 네이티브 input props (이벤트 포함) */
  disabled,
  readOnly,
  type,
  id,
  ...restInputProps
}: TextInputProps) {

  /**
   * 비밀번호 표시 여부
   * — 인스턴스마다 독립적으로 동작 (같은 화면에 여러 개 사용 가능)
   */
  const [showPw, setShowPw] = useState(false);

  /** 접근성용 고유 id — id prop 미입력 시 React 자동 생성값 사용 */
  const autoId = useId();
  const inputId = id ?? autoId;


  /* =====================================================
   * 컨트롤 시각적 상태 계산
   * 우선순위: disabled > readonly > error > success > 기본('')
   * hover · focus 는 CSS :hover / :focus-within 으로 처리
   * ===================================================== */
  const controlState: InputControlState = (() => {
    if (disabled)    return 'disabled';
    if (readOnly)    return 'readonly';
    if (errorText)   return 'error';
    if (successText) return 'success';
    return '';
  })();


  /* =====================================================
   * 오른쪽 슬롯 결정
   * 우선순위: loading > showPasswordToggle > rightIcon
   * ===================================================== */
  let rightSlot: React.ReactNode = rightIcon ?? null;

  if (loading) {
    rightSlot = <SpinnerIcon size={SPINNER_SIZE[size]} />;
  } else if (showPasswordToggle) {
    rightSlot = (
      <button
        type="button"
        tabIndex={-1}
        className="input-pw-toggle"
        onClick={() => setShowPw((prev) => !prev)}
        aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 표시'}
      >
        {showPw
          ? <EyeOffIcon size={PW_ICON_SIZE[size]} />
          : <EyeIcon    size={PW_ICON_SIZE[size]} />
        }
      </button>
    );
  }


  /* =====================================================
   * 렌더링
   * ===================================================== */
  return (
    <InputWrapper
      inputId={inputId}
      label={label}
      required={required}
      labelPosition={labelPosition}
      labelWidth={labelWidth}
      hint={hint}
      infoText={infoText}
      errorText={errorText}
      successText={successText}
      className={className}
    >
      <InputBase
        /* 크기 */
        size={size}

        /* 슬롯 */
        leftSlot={leftIcon}
        rightSlot={rightSlot}

        /* 상태 */
        controlState={controlState}

        /* 네이티브 input 속성 전체 전달 (onChange, onFocus, onBlur … 포함) */
        id={inputId}
        type={showPasswordToggle && showPw ? 'text' : (type ?? 'text')}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={errorText ? true : undefined}
        aria-describedby={
          errorText ? `${inputId}-error`
          : hint     ? `${inputId}-hint`
          : undefined
        }
        {...restInputProps}
      />
    </InputWrapper>
  );
}
