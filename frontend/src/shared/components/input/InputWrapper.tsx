/**
 * @fileoverview 인풋 레이아웃 래퍼 컴포넌트
 *
 * @description
 * - 레이블 · 도움말(hint/info/error/success) · 레이블 위치 레이아웃을 담당
 * - 인풋 컨트롤을 children 으로 받아 감싸는 구조
 * - TextInput 뿐만 아니라 추후 Select · Checkbox 등에서도 재사용 가능
 *
 * @module input/InputWrapper
 */

import type { ReactNode } from 'react';
import './Input.css';
import type { InputWrapperBaseProps, LabelPosition } from './types';


/**
 * InputWrapper 컴포넌트 Props
 */
interface InputWrapperProps extends InputWrapperBaseProps {
  /** label 의 htmlFor 에 연결할 input id */
  inputId: string;
  /** 래핑할 인풋 컨트롤 요소 */
  children: ReactNode;
  /** 최상위 래퍼 div 에 추가할 CSS 클래스 */
  className?: string;
}


/**
 * 인풋 레이아웃 래퍼
 *
 * @param {InputWrapperProps} props
 * @returns {JSX.Element}
 *
 * @example
 * // TextInput 내부에서 사용하는 방식
 * <InputWrapper inputId={id} label="이메일" hint="가입 시 사용한 이메일" errorText={error}>
 *   <InputBase ... />
 * </InputWrapper>
 *
 * @example
 * // Select 와 조합
 * <InputWrapper inputId={id} label="카테고리" labelPosition="left" labelWidth="5rem">
 *   <SelectControl ... />
 * </InputWrapper>
 */
export function InputWrapper({
  inputId,
  label,
  required,
  labelPosition = 'top',
  labelWidth,
  hint,
  infoText,
  errorText,
  successText,
  children,
  className,
}: InputWrapperProps) {

  /* =====================================================
   * 서브 요소 조립
   * ===================================================== */

  /** 레이블 요소 */
  const labelEl = label ? (
    <label
      htmlFor={inputId}
      className="input-wrapper__label"
      style={labelWidth ? { width: labelWidth, flexShrink: 0 } : undefined}
    >
      {label}
      {required && (
        <span className="input-wrapper__required" aria-hidden="true">*</span>
      )}
    </label>
  ) : null;

  /**
   * 도움말 영역
   *
   * 표시 우선순위:
   * 1. infoText  — 항상 표시 (에러·성공과 무관)
   * 2. errorText — 에러 상태일 때
   * 3. successText — 성공 상태일 때 (에러 없을 때만)
   * 4. hint      — 에러·성공 없을 때만
   */
  const helperEl = (infoText || errorText || successText || hint) ? (
    <span className="input-wrapper__helper">
      {/* 고정 안내 메시지 — 항상 표시 */}
      {infoText && (
        <span className="input-wrapper__info">{infoText}</span>
      )}
      {/* 에러 메시지 */}
      {errorText && (
        <span
          id={`${inputId}-error`}
          role="alert"
          className="input-wrapper__error"
        >
          {errorText}
        </span>
      )}
      {/* 성공 메시지 — 에러 없을 때만 */}
      {successText && !errorText && (
        <span className="input-wrapper__success">{successText}</span>
      )}
      {/* 힌트 — 에러·성공 없을 때만 */}
      {hint && !errorText && !successText && (
        <span id={`${inputId}-hint`} className="input-wrapper__hint">
          {hint}
        </span>
      )}
    </span>
  ) : null;


  /* =====================================================
   * 레이블 위치별 레이아웃 렌더링
   * ===================================================== */
  const rootClass = `input-wrapper${className ? ` ${className}` : ''}`;

  /** 레이블 왼쪽 — 가로 정렬 */
  if (labelPosition === 'left') {
    return (
      <div className={rootClass}>
        <div className="input-wrapper__row">
          {labelEl}
          <div className="input-wrapper__body">
            {children}
            {helperEl}
          </div>
        </div>
      </div>
    );
  }

  /** 레이블 오른쪽 — 가로 정렬 */
  if (labelPosition === 'right') {
    return (
      <div className={rootClass}>
        <div className="input-wrapper__row">
          <div className="input-wrapper__body">
            {children}
            {helperEl}
          </div>
          {labelEl}
        </div>
      </div>
    );
  }

  /** 레이블 아래 */
  if (labelPosition === 'bottom') {
    return (
      <div className={rootClass}>
        {children}
        {labelEl}
        {helperEl}
      </div>
    );
  }

  /** 레이블 위 (기본) */
  return (
    <div className={rootClass}>
      {labelEl}
      {children}
      {helperEl}
    </div>
  );
}


/* =====================================================
 * labelPosition 타입 재내보내기 (편의용)
 * ===================================================== */
export type { LabelPosition };
