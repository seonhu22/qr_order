/**
 * @fileoverview 셀렉트 인풋 완성형 컴포넌트
 *
 * @description
 * - InputWrapper(레이아웃) + 자체 컨트롤 박스(select-control) 를 조합한 최종 컴포넌트
 * - InputBase 는 <input> 전용이므로 재사용하지 않음
 * - 검색(searchable), 그룹핑(group), 드롭다운 위치 자동 반전(dropUp) 기능 내장
 * - 외부 아이콘 라이브러리 없이 인라인 SVG 사용
 *
 * @module input/SelectInput
 */

import './Input.css';
import { useState, useId, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { InputWrapper } from './InputWrapper';
import { Icon } from '@/shared/assets/icons/Icon';
import type { SelectInputProps, SelectOption, InputControlState, InputSize } from './types';

/* =====================================================
 * 크기별 아이콘 픽셀 크기
 * ===================================================== */

const ICON_SIZE: Record<InputSize, number> = { sm: 12, md: 14, lg: 16 };

/* =====================================================
 * OptionItem 서브 컴포넌트
 * ===================================================== */

function OptionItem({
  opt,
  selected,
  onSelect,
}: {
  opt: SelectOption;
  selected: boolean;
  onSelect: (opt: SelectOption) => void;
}) {
  return (
    <li
      role="option"
      aria-selected={selected}
      aria-disabled={opt.disabled}
      onClick={() => onSelect(opt)}
      className={[
        'select-option',
        selected ? 'select-option--selected' : '',
        opt.disabled ? 'select-option--disabled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* 왼쪽 아이콘 */}
      {opt.icon && <span className="select-option__icon">{opt.icon}</span>}

      {/* 레이블 + 설명 */}
      <span className="select-option__body">
        <span className="select-option__label">{opt.label}</span>
        {opt.description && <span className="select-option__desc">{opt.description}</span>}
      </span>

      {/* 선택 체크 */}
      {selected && (
        <span className="select-option__check">
          <Icon id="i-check" size={13} />
        </span>
      )}
    </li>
  );
}

/* =====================================================
 * SelectInput 컴포넌트
 * ===================================================== */

/**
 * 셀렉트 인풋 완성형 컴포넌트
 *
 * @param {SelectInputProps} props
 * @returns {JSX.Element}
 *
 * @example
 * // 기본 사용
 * <SelectInput
 *   label="카테고리"
 *   options={[{ value: 'food', label: '음식' }, { value: 'drink', label: '음료' }]}
 *   onChange={(value) => console.log(value)}
 * />
 *
 * @example
 * // 에러 상태
 * <SelectInput label="카테고리" options={options} errorText="카테고리를 선택해주세요" />
 *
 * @example
 * // 검색 기능 활성화
 * <SelectInput label="메뉴" options={menuOptions} searchable />
 *
 * @example
 * // 그룹핑 — option.group 필드로 자동 구분
 * const options = [
 *   { value: 'a', label: '아메리카노', group: '커피' },
 *   { value: 'b', label: '라테',      group: '커피' },
 *   { value: 'c', label: '녹차',      group: '논커피' },
 * ];
 * <SelectInput label="음료" options={options} />
 *
 * @example
 * // 레이블 왼쪽 배치
 * <SelectInput label="카테고리" options={options} labelPosition="left" labelWidth="5rem" />
 */
export function SelectInput({
  options,
  value: controlledValue,
  defaultValue = '',
  onChange,
  placeholder = '선택하세요',
  size = 'md',
  label,
  required,
  labelPosition = 'top',
  labelWidth,
  hint,
  infoText,
  errorText,
  successText,
  searchable = false,
  loading = false,
  disabled = false,
  readOnly = false,
  isError = false,
  className,
}: SelectInputProps) {
  /** 접근성용 고유 id — label htmlFor 과 trigger button id 를 연결 */
  const triggerId = useId();
  const listboxId = `${triggerId}-listbox`;

  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropUp, setDropUp] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [anchorRect, setAnchorRect] = useState({ top: 0, bottom: 0, left: 0, width: 0 });

  const { normalizedOptions, droppedEmptyValues, droppedDuplicateValues } = useMemo(() => {
    const seen = new Set<string>();
    const normalized: SelectOption[] = [];
    let emptyCount = 0;
    let duplicateCount = 0;

    for (const option of options) {
      const value = option.value?.trim();

      if (!value) {
        emptyCount += 1;
        continue;
      }

      if (seen.has(value)) {
        duplicateCount += 1;
        continue;
      }

      seen.add(value);
      normalized.push({ ...option, value });
    }

    return {
      normalizedOptions: normalized,
      droppedEmptyValues: emptyCount,
      droppedDuplicateValues: duplicateCount,
    };
  }, [options]);

  /** 제어/비제어 통합 선택값 */
  const selectedValue = controlledValue !== undefined ? controlledValue : internalValue;
  const selectedOption = normalizedOptions.find((o) => o.value === selectedValue);
  const triggerAriaLabel =
    label?.trim() || selectedOption?.label?.trim() || placeholder?.trim() || '항목 선택';

  const iconSize = ICON_SIZE[size];

  /* =====================================================
   * 컨트롤 시각적 상태 계산
   * 우선순위: disabled > readonly > error > success > ''
   * hover · focus 는 CSS :hover / :focus-within / [data-open] 으로 처리
   * ===================================================== */
  const controlState: InputControlState = (() => {
    if (disabled) return 'disabled';
    if (readOnly) return 'readonly';
    if (errorText || isError) return 'error';
    if (successText) return 'success';
    return '';
  })();

  /* =====================================================
   * 외부 클릭 시 드롭다운 닫기
   * ===================================================== */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        !containerRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* =====================================================
   * 드롭다운 열릴 때 검색 인풋 자동 포커스
   * ===================================================== */
  useEffect(() => {
    if (open && searchable) searchRef.current?.focus();
  }, [open, searchable]);

  /* =====================================================
   * 화면 하단 여백 부족 시 드롭다운을 위로 열기 + 포털 위치 계산
   * ===================================================== */
  useEffect(() => {
    if (!open || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    setDropUp(spaceBelow < 260 && spaceAbove > spaceBelow);
    setAnchorRect({ top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width });
  }, [open]);

  /* =====================================================
   * 스크롤 시 드롭다운 닫기
   * ===================================================== */
  useEffect(() => {
    if (!open) return;
    const close = () => { setOpen(false); setSearch(''); };
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, [open]);

  useEffect(() => {
    if (import.meta.env.DEV && (droppedEmptyValues > 0 || droppedDuplicateValues > 0)) {
      console.warn('[SelectInput] Invalid options were ignored.', {
        droppedEmptyValues,
        droppedDuplicateValues,
      });
    }
  }, [droppedDuplicateValues, droppedEmptyValues]);

  /* =====================================================
   * 이벤트 핸들러
   * ===================================================== */

  const handleToggle = () => {
    if (disabled || readOnly || loading) return;
    setOpen((prev) => !prev);
  };

  const handleSelect = (opt: SelectOption) => {
    if (opt.disabled) return;
    if (controlledValue === undefined) setInternalValue(opt.value);
    onChange?.(opt.value);
    setOpen(false);
    setSearch('');
  };

  /** Escape 키로 드롭다운 닫기 */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setSearch('');
      containerRef.current?.querySelector('button')?.focus();
    }
  };

  /* =====================================================
   * 옵션 필터링 및 그룹 분류
   * ===================================================== */

  const filtered = normalizedOptions.filter(
    (o) => !search || o.label.toLowerCase().includes(search.toLowerCase()),
  );

  const groupKeys = Array.from(
    new Set(normalizedOptions.filter((o) => o.group).map((o) => o.group as string)),
  );
  const ungrouped = filtered.filter((o) => !o.group);
  const grouped = groupKeys.map((g) => ({
    group: g,
    items: filtered.filter((o) => o.group === g),
  }));

  /* =====================================================
   * 렌더링
   * ===================================================== */
  return (
    <>
    <InputWrapper
      inputId={triggerId}
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
      {/* ── 컨트롤 박스 ── */}
      <div
        ref={containerRef}
        className={`select-control select-control--${size}`}
        data-state={controlState || undefined}
        data-open={open ? 'true' : undefined}
        onKeyDown={handleKeyDown}
      >
        {/* 트리거 버튼 */}
        <button
          type="button"
          id={triggerId}
          role="combobox"
          className="select-control__trigger"
          onClick={handleToggle}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-expanded={open ? true : false}
          aria-invalid={errorText || isError ? true : undefined}
          aria-label={triggerAriaLabel}
          aria-describedby={
            errorText ? `${triggerId}-error` : hint ? `${triggerId}-hint` : undefined
          }
        >
          {selectedOption ? (
            <span className="select-control__value">{selectedOption.label}</span>
          ) : (
            <span className="select-control__placeholder">{placeholder}</span>
          )}
        </button>

        {/* 오른쪽 슬롯 — 로딩 스피너 또는 chevron */}
        <span className="select-control__slot-right" aria-hidden="true">
          {loading ? (
            <Icon id="i-loading" size={iconSize} className="select-spinner" />
          ) : (
            <Icon id="i-chevron-down" size={iconSize} className="select-control__chevron" />
          )}
        </span>

      </div>
    </InputWrapper>

    {/* ── 드롭다운 패널 (Portal) — 모달 overflow 에 잘리지 않도록 body에 렌더 ── */}
    {open && createPortal(
      <div
        ref={dropdownRef}
        className={`select-dropdown ${dropUp ? 'select-dropdown--above' : 'select-dropdown--below'}`}
        style={{
          position: 'fixed',
          left: anchorRect.left,
          right: 'auto',
          width: anchorRect.width,
          zIndex: 1100,
          ...(dropUp
            ? { bottom: window.innerHeight - anchorRect.top, top: 'auto' }
            : { top: anchorRect.bottom, bottom: 'auto' }),
        }}
        onKeyDown={handleKeyDown}
      >
        {/* 검색 인풋 */}
        {searchable && (
          <div className="select-dropdown__search">
            <div className="select-dropdown__search-box">
              <span className="select-dropdown__search-icon">
                <Icon id="i-search" size={13} />
              </span>
              <input
                ref={searchRef}
                type="text"
                placeholder="검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="select-dropdown__search-input"
                aria-label="옵션 검색"
              />
            </div>
          </div>
        )}

        {/* 옵션 목록 */}
        <ul
          id={listboxId}
          className="select-dropdown__list"
          role="listbox"
          aria-label={label ?? placeholder}
        >
          {/* 그룹 없는 옵션 */}
          {ungrouped.map((opt) => (
            <OptionItem
              key={opt.value}
              opt={opt}
              selected={selectedValue === opt.value}
              onSelect={handleSelect}
            />
          ))}

          {/* 그룹별 옵션 */}
          {grouped.map(
            ({ group, items }) =>
              items.length > 0 && (
                <li key={group} role="presentation">
                  <div className="select-option-group__label">{group}</div>
                  <ul
                    role="group"
                    aria-label={group}
                    style={{ listStyle: 'none', margin: 0, padding: 0 }}
                  >
                    {items.map((opt) => (
                      <OptionItem
                        key={opt.value}
                        opt={opt}
                        selected={selectedValue === opt.value}
                        onSelect={handleSelect}
                      />
                    ))}
                  </ul>
                </li>
              ),
          )}

          {/* 검색 결과 없음 */}
          {filtered.length === 0 && (
            <li
              className="select-dropdown__empty"
              role="option"
              aria-selected="false"
              aria-disabled="true"
            >
              검색 결과 없음
            </li>
          )}
        </ul>
      </div>,
      document.body,
    )}
    </>
  );
}
