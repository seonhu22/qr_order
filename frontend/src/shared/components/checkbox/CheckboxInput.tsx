/**
 * @fileoverview 체크박스 인풋 완성형 컴포넌트
 *
 * @description
 * - 커스텀 체크박스 박스 + 인라인 레이블 + 도움말 텍스트를 조합한 최종 컴포넌트
 * - indeterminate(부분 선택) 상태 지원
 * - 제어/비제어 양쪽 모드 지원
 * - 아이콘은 sprite.svg 의 i-check / i-minus 사용
 *
 * @module checkbox/CheckboxInput
 */

import './Checkbox.css';
import { useState, useRef, useEffect, useId } from 'react';
import { Icon } from '@/shared/assets/icons/Icon';
import type { CheckboxInputProps, CheckboxGroupProps, CheckboxSize } from './types';

/* =====================================================
 * 크기별 아이콘 픽셀 크기
 * ===================================================== */

const ICON_SIZE: Record<CheckboxSize, number> = { sm: 10, md: 13, lg: 16 };

/* =====================================================
 * CheckboxInput 컴포넌트
 * ===================================================== */

/**
 * 체크박스 인풋 완성형 컴포넌트
 *
 * @param {CheckboxInputProps} props
 * @returns {JSX.Element}
 *
 * @example
 * // 기본 사용
 * <CheckboxInput label="이용약관에 동의합니다" onChange={(v) => console.log(v)} />
 *
 * @example
 * // 에러 상태
 * <CheckboxInput label="필수 항목" errorText="필수 항목을 선택해주세요" />
 *
 * @example
 * // indeterminate — 전체 선택 체크박스
 * <CheckboxInput label="전체 선택" indeterminate={someChecked && !allChecked} checked={allChecked} />
 *
 * @example
 * // 설명 포함
 * <CheckboxInput
 *   label="마케팅 정보 수신 동의"
 *   description="이벤트·혜택 정보를 이메일·SMS로 받습니다"
 * />
 */
export function CheckboxInput({
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  label,
  description,
  size = 'md',
  disabled = false,
  indeterminate = false,
  hint,
  errorText,
  successText,
  className,
}: CheckboxInputProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalChecked, setInternalChecked] = useState(defaultChecked);

  /** 제어/비제어 통합 체크 여부 */
  const isChecked = controlledChecked !== undefined ? controlledChecked : internalChecked;

  const iconSize = ICON_SIZE[size];
  const hasError = !!errorText;
  const hasSuccess = !!successText && !errorText;

  /* =====================================================
   * indeterminate 는 DOM 속성으로만 설정 가능 (HTML attribute 없음)
   * ===================================================== */
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  /* =====================================================
   * 이벤트 핸들러
   * ===================================================== */

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const next = e.target.checked;
    if (controlledChecked === undefined) setInternalChecked(next);
    onChange?.(next);
  };

  /* =====================================================
   * 렌더링
   * ===================================================== */
  return (
    <div
      className={[
        'checkbox-control',
        `checkbox-control--${size}`,
        disabled  ? 'checkbox-control--disabled' : '',
        hasError  ? 'checkbox-control--error'    : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* ── 체크박스 행 ── */}
      <label className="checkbox-control__row">
        {/* 히든 네이티브 input */}
        <input
          ref={inputRef}
          id={id}
          type="checkbox"
          className="checkbox-control__native"
          checked={isChecked}
          disabled={disabled}
          aria-invalid={hasError ? true : undefined}
          aria-describedby={
            errorText ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          onChange={handleChange}
        />

        {/* 커스텀 박스 */}
        <span className="checkbox-control__box" aria-hidden="true">
          {indeterminate ? (
            <Icon id="i-minus" size={iconSize} className="checkbox-control__icon" />
          ) : isChecked ? (
            <Icon id="i-check" size={iconSize} className="checkbox-control__icon" />
          ) : null}
        </span>

        {/* 레이블 + 설명 */}
        {(label || description) && (
          <span className="checkbox-control__label-wrap">
            {label      && <span className="checkbox-control__label">{label}</span>}
            {description && <span className="checkbox-control__desc">{description}</span>}
          </span>
        )}
      </label>

      {/* ── 도움말 영역 ── */}
      {(hint || errorText || successText) && (
        <span className="checkbox-control__helper">
          {errorText && (
            <span id={`${id}-error`} role="alert" className="checkbox-control__error">
              {errorText}
            </span>
          )}
          {hasSuccess && (
            <span className="checkbox-control__success">{successText}</span>
          )}
          {hint && !errorText && !successText && (
            <span id={`${id}-hint`} className="checkbox-control__hint">
              {hint}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

/* =====================================================
 * CheckboxGroup 컴포넌트
 * ===================================================== */

/**
 * 체크박스 그룹 래퍼
 * — 여러 CheckboxInput 을 수직/수평으로 묶을 때 사용
 *
 * @param {CheckboxGroupProps} props
 * @returns {JSX.Element}
 *
 * @example
 * <CheckboxGroup label="관심 카테고리" direction="row">
 *   <CheckboxInput label="음식" />
 *   <CheckboxInput label="음료" />
 *   <CheckboxInput label="디저트" />
 * </CheckboxGroup>
 */
export function CheckboxGroup({
  label,
  direction = 'col',
  children,
  className,
}: CheckboxGroupProps) {
  return (
    <div className={['checkbox-group', className ?? ''].filter(Boolean).join(' ')}>
      {label && <p className="checkbox-group__label">{label}</p>}
      <div className={`checkbox-group__list checkbox-group__list--${direction}`}>
        {children}
      </div>
    </div>
  );
}
