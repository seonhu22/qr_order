/**
 * @fileoverview 라디오 인풋 컴포넌트
 *
 * @description
 * - 커스텀 라디오 버튼 + 인라인 레이블 + 도움말 텍스트를 조합한 컴포넌트
 * - 제어/비제어 양쪽 모드 지원
 * - RadioGroup 과 함께 사용하거나 단독으로도 사용 가능
 *
 * @module radio/RadioInput
 */

import './Radio.css';
import { useState, useId } from 'react';
import type { RadioInputProps, RadioGroupProps } from './types';


/* =====================================================
 * RadioInput 컴포넌트
 * ===================================================== */

/**
 * 라디오 인풋 컴포넌트
 *
 * @param {RadioInputProps} props
 * @returns {JSX.Element}
 *
 * @example
 * // 기본 사용 (비제어)
 * <RadioInput name="size" value="sm" label="소형" defaultChecked />
 *
 * @example
 * // 제어 컴포넌트
 * <RadioInput name="size" value="md" label="중형" checked={selected === 'md'} onChange={() => setSelected('md')} />
 *
 * @example
 * // 에러 상태
 * <RadioInput name="agree" value="yes" label="동의합니다" errorText="필수 항목입니다" />
 *
 * @example
 * // 설명 포함
 * <RadioInput name="delivery" value="quick" label="빠른 배달" description="30분 내 도착 예상" />
 */
export function RadioInput({
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  label,
  description,
  size = 'md',
  disabled = false,
  hint,
  errorText,
  successText,
  className,
  name,
  value,
  id,
}: RadioInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);

  /** 제어/비제어 통합 체크 여부 */
  const isChecked = controlledChecked !== undefined ? controlledChecked : internalChecked;

  const hasError = !!errorText;
  const hasSuccess = !!successText && !errorText;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const next = e.target.checked;
    if (controlledChecked === undefined) setInternalChecked(next);
    onChange?.(next);
  };

  return (
    <div
      className={[
        'radio-control',
        `radio-control--${size}`,
        disabled ? 'radio-control--disabled' : '',
        hasError  ? 'radio-control--error'    : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* ── 라디오 행 ── */}
      <label className="radio-control__row" htmlFor={inputId}>
        {/* 히든 네이티브 input */}
        <input
          id={inputId}
          type="radio"
          className="radio-control__native"
          name={name}
          value={value}
          checked={isChecked}
          disabled={disabled}
          aria-invalid={hasError ? true : undefined}
          aria-describedby={
            errorText ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          onChange={handleChange}
        />

        {/* 커스텀 라디오 원 + 점 */}
        <span className="radio-control__box" aria-hidden="true">
          <span className="radio-control__dot" />
        </span>

        {/* 레이블 + 설명 */}
        {(label || description) && (
          <span className="radio-control__label-wrap">
            {label       && <span className="radio-control__label">{label}</span>}
            {description && <span className="radio-control__desc">{description}</span>}
          </span>
        )}
      </label>

      {/* ── 도움말 영역 ── */}
      {(hint || errorText || successText) && (
        <span className="radio-control__helper">
          {errorText && (
            <span id={`${inputId}-error`} role="alert" className="radio-control__error">
              {errorText}
            </span>
          )}
          {hasSuccess && (
            <span className="radio-control__success">{successText}</span>
          )}
          {hint && !errorText && !successText && (
            <span id={`${inputId}-hint`} className="radio-control__hint">
              {hint}
            </span>
          )}
        </span>
      )}
    </div>
  );
}


/* =====================================================
 * RadioGroup 컴포넌트
 * ===================================================== */

/**
 * 라디오 그룹 컴포넌트
 * — options 배열로 단일 선택 라디오 그룹을 생성
 *
 * @param {RadioGroupProps} props
 * @returns {JSX.Element}
 *
 * @example
 * // 기본 사용
 * <RadioGroup
 *   name="size"
 *   label="사이즈 선택"
 *   options={[
 *     { value: 'sm', label: '소형' },
 *     { value: 'md', label: '중형' },
 *     { value: 'lg', label: '대형' },
 *   ]}
 *   onChange={(value) => console.log(value)}
 * />
 *
 * @example
 * // 제어 컴포넌트
 * <RadioGroup
 *   name="delivery"
 *   value={deliveryType}
 *   onChange={setDeliveryType}
 *   options={deliveryOptions}
 * />
 *
 * @example
 * // 수평 배치
 * <RadioGroup name="gender" direction="row" options={genderOptions} />
 *
 * @example
 * // 에러 상태
 * <RadioGroup name="agree" options={options} errorText="항목을 선택해주세요" />
 */
export function RadioGroup({
  label,
  name,
  value: controlledValue,
  defaultValue = '',
  onChange,
  direction = 'col',
  size = 'md',
  options,
  errorText,
  successText,
  hint,
  className,
}: RadioGroupProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);

  const selectedValue = controlledValue !== undefined ? controlledValue : internalValue;

  const hasError = !!errorText;
  const hasSuccess = !!successText && !errorText;

  const handleChange = (optValue: string) => {
    if (controlledValue === undefined) setInternalValue(optValue);
    onChange?.(optValue);
  };

  return (
    <div className={['radio-group', className ?? ''].filter(Boolean).join(' ')}>
      {label && <p className="radio-group__label">{label}</p>}

      <div
        className={`radio-group__list radio-group__list--${direction}`}
        role="radiogroup"
        aria-label={label}
      >
        {options.map((opt) => (
          <RadioInput
            key={opt.value}
            name={name}
            value={opt.value}
            size={size}
            label={opt.label}
            description={opt.description}
            hint={opt.hint}
            disabled={opt.disabled}
            checked={selectedValue === opt.value}
            onChange={() => handleChange(opt.value)}
          />
        ))}
      </div>

      {(hint || errorText || successText) && (
        <span className="radio-group__helper">
          {errorText && (
            <span role="alert" className="radio-group__error">{errorText}</span>
          )}
          {hasSuccess && (
            <span className="radio-group__success">{successText}</span>
          )}
          {hint && !errorText && !successText && (
            <span className="radio-group__hint">{hint}</span>
          )}
        </span>
      )}
    </div>
  );
}
