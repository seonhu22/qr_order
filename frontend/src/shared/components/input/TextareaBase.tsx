/**
 * @fileoverview 순수 textarea 컨트롤 박스 컴포넌트
 *
 * @description
 * - 테두리 · 배경 · `<textarea>` 만 담당
 * - 레이블 · 도움말 · 레이아웃은 InputWrapper 에 위임
 * - InputBase 와 동일한 상태·토큰 체계를 공유한다
 *
 * @module input/TextareaBase
 */

import './Input.css';
import type { TextareaBaseProps } from './types';

/**
 * 순수 textarea 컨트롤 박스
 *
 * @example
 * <TextareaBase rows={4} placeholder="내용을 입력하세요" />
 *
 * @example
 * <TextareaBase controlState="error" resize="vertical" rows={5} />
 */
export function TextareaBase({
  controlState = '',
  resize = 'none',
  className,
  ...textareaProps
}: TextareaBaseProps) {
  return (
    <div
      className={`textarea-control${className ? ` ${className}` : ''}`}
      data-state={controlState || undefined}
      data-resize={resize !== 'none' ? resize : undefined}
    >
      <textarea
        {...textareaProps}
        className="textarea-control__textarea"
      />
    </div>
  );
}
