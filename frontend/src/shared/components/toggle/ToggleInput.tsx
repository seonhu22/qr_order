/**
 * @fileoverview 토글 스위치 컴포넌트
 *
 * @description
 * - 커스텀 토글 스위치 + 인라인 레이블 + 도움말 텍스트를 조합한 컴포넌트
 * - 제어/비제어 양쪽 모드 지원
 * - 로딩 상태 시 썸 내부에 스피너 표시
 *
 * @module toggle/ToggleInput
 */

import './Toggle.css';
import { useState } from 'react';
import type { ToggleInputProps } from './types';


/* =====================================================
 * ToggleInput 컴포넌트
 * ===================================================== */

/**
 * 토글 스위치 컴포넌트
 *
 *
 * @example
 * // 기본 사용 (비제어)
 * <ToggleInput label="알림 수신" defaultChecked />
 *
 * @example
 * // 제어 컴포넌트
 * <ToggleInput checked={enabled} onChange={setEnabled} label="자동 저장" />
 *
 * @example
 * // 로딩 상태
 * <ToggleInput loading label="저장 중..." />
 *
 * @example
 * // 레이블 왼쪽 배치
 * <ToggleInput label="다크 모드" labelPosition="left" hint="앱 전체에 적용됩니다" />
 */
export function ToggleInput({
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  size = 'md',
  disabled = false,
  loading = false,
  label,
  labelPosition = 'right',
  hint,
  className,
}: ToggleInputProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);

  /** 제어/비제어 통합 켜짐 여부 */
  const isOn = controlledChecked !== undefined ? controlledChecked : internalChecked;

  const isDisabled = disabled || loading;

  const handleClick = () => {
    if (isDisabled) return;
    const next = !isOn;
    if (controlledChecked === undefined) setInternalChecked(next);
    onChange?.(next);
  };

  /* ── 트랙 버튼 ── */
  const track = (
    <button
      type="button"
      role="switch"
      aria-checked={isOn ? 'true' : 'false'}
      disabled={isDisabled}
      onClick={handleClick}
      className={[
        'toggle-control__track',
        isOn ? 'toggle-control__track--on' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* 썸 */}
      <span
        className={[
          'toggle-control__thumb',
          isOn ? 'toggle-control__thumb--on' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden="true"
      >
        {loading && <span className="toggle-control__spinner" />}
      </span>
    </button>
  );

  /* ── 레이블 없는 경우 ── */
  if (!label && !hint) {
    return (
      <span
        className={[
          'toggle-control',
          `toggle-control--${size}`,
          'toggle-control--track-only',
          isDisabled ? 'toggle-control--disabled' : '',
          className ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {track}
      </span>
    );
  }

  /* ── 레이블 포함 ── */
  const labelWrap = (
    <span className="toggle-control__label-wrap" aria-hidden="true">
      {label && <span className="toggle-control__label">{label}</span>}
      {hint  && <span className="toggle-control__hint">{hint}</span>}
    </span>
  );

  return (
    <label
      className={[
        'toggle-control',
        `toggle-control--${size}`,
        isDisabled ? 'toggle-control--disabled' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleClick}
    >
      {labelPosition === 'left'  && labelWrap}
      {track}
      {labelPosition === 'right' && labelWrap}
    </label>
  );
}