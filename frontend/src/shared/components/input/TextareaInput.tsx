/**
 * @fileoverview textarea 완성형 컴포넌트
 *
 * @description
 * - TextareaBase(컨트롤 박스) + InputWrapper(레이아웃) 를 조합한 최종 컴포넌트
 * - TextInput 과 동일한 상태·레이블·도움말 패턴을 따른다
 *
 * @module input/TextareaInput
 */

import { useId } from 'react';
import { TextareaBase } from './TextareaBase';
import { InputWrapper } from './InputWrapper';
import type { TextareaInputProps, InputControlState } from './types';

/**
 * textarea 완성형 컴포넌트
 *
 * @example
 * <TextareaInput label="메모" rows={4} placeholder="내용을 입력하세요" />
 *
 * @example
 * <TextareaInput label="사유" required errorText="필수 입력 항목입니다" rows={3} />
 *
 * @example
 * <TextareaInput label="설명" resize="vertical" hint="최대 500자" rows={5} />
 */
export function TextareaInput({
  /* 래퍼 props */
  label,
  required,
  labelPosition = 'top',
  labelWidth,
  hint,
  infoText,
  errorText,
  successText,

  /* textarea 전용 */
  resize = 'none',
  isError = false,

  /* 레이아웃 */
  className,

  /* 네이티브 textarea props */
  disabled,
  readOnly,
  id,
  ...restProps
}: TextareaInputProps) {
  const autoId = useId();
  const textareaId = id ?? autoId;

  const controlState: InputControlState = (() => {
    if (disabled)              return 'disabled';
    if (readOnly)              return 'readonly';
    if (errorText || isError)  return 'error';
    if (successText)           return 'success';
    return '';
  })();

  return (
    <InputWrapper
      inputId={textareaId}
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
      <TextareaBase
        controlState={controlState}
        resize={resize}
        id={textareaId}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={errorText ? true : undefined}
        aria-describedby={
          errorText ? `${textareaId}-error`
          : hint     ? `${textareaId}-hint`
          : undefined
        }
        {...restProps}
      />
    </InputWrapper>
  );
}
