/**
 * @fileoverview 순수 인풋 컨트롤 박스 컴포넌트
 *
 * @description
 * - 테두리 · 배경 · 아이콘 슬롯 · `<input>` 만 담당
 * - 레이블 · 도움말 · 레이아웃은 InputWrapper 에 위임
 * - TextInput · (추후) Select 등에서 베이스로 재사용
 * - 모든 네이티브 input 이벤트(onChange, onFocus, onBlur, onKeyDown …)는
 *   그대로 `<input>` 으로 전달된다
 *
 * @module input/InputBase
 */

import './Input.css';
import type { InputBaseProps } from './types';


/**
 * 순수 인풋 컨트롤 박스
 *
 * @param {InputBaseProps} props
 * @returns {JSX.Element}
 *
 * @example
 * // 단독 사용 (레이블 없음)
 * <InputBase size="md" placeholder="검색어를 입력하세요" />
 *
 * @example
 * // 슬롯에 아이콘 주입
 * <InputBase
 *   size="lg"
 *   leftSlot={<SearchIcon />}
 *   controlState="error"
 *   placeholder="이메일"
 * />
 */
export function InputBase({
  size = 'md',
  leftSlot,
  rightSlot,
  controlState = '',
  className,
  ...inputProps
}: InputBaseProps) {
  return (
    <div
      className={`input-control input-control--${size}${className ? ` ${className}` : ''}`}
      data-state={controlState || undefined}
    >
      {/* 왼쪽 슬롯 — 아이콘 등 비인터랙티브 요소 */}
      {leftSlot != null && (
        <span className="input-control__slot-left" aria-hidden="true">
          {leftSlot}
        </span>
      )}

      {/* 네이티브 input — 모든 HTML 속성 및 이벤트 그대로 전달 */}
      <input
        {...inputProps}
        className="input-control__input"
      />

      {/* 오른쪽 슬롯 — 아이콘 · 버튼 · 스피너 */}
      {rightSlot != null && (
        <span className="input-control__slot-right">
          {rightSlot}
        </span>
      )}
    </div>
  );
}
