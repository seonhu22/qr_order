import './LayoutSizeToggle.css';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from '@/shared/components/button';
import type { LayoutSize } from '../types';

type LayoutSizeOption = { value: LayoutSize; label: string };

const LAYOUT_SIZE_OPTIONS: LayoutSizeOption[] = [
  { value: 'small', label: '작게' },
  { value: 'medium', label: '보통' },
  { value: 'large', label: '크게' },
];

type LayoutSizeToggleProps = {
  value: LayoutSize;
  onChange: (value: LayoutSize) => void;
};

export function LayoutSizeToggle({ value, onChange }: LayoutSizeToggleProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const groupEl = groupRef.current;
    if (!groupEl) return;
    const index = LAYOUT_SIZE_OPTIONS.findIndex((option) => option.value === value);
    const buttonEl = groupEl.querySelectorAll('button')[index];
    if (!buttonEl) return;
    const groupRect = groupEl.getBoundingClientRect();
    const buttonRect = buttonEl.getBoundingClientRect();
    setIndicatorStyle({ left: buttonRect.left - groupRect.left, width: buttonRect.width });
  }, [value]);

  // 라디오그룹 표준 패턴: 선택된 항목만 tabIndex 0(roving tabindex), 좌우(위아래) 화살표로 다음/이전
  // 항목을 바로 선택하고 포커스까지 옮긴다. Button이 forwardRef가 아니라 위 인디케이터 코드와 같은 방식으로
  // DOM에서 버튼을 직접 찾아 focus()한다.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = LAYOUT_SIZE_OPTIONS.findIndex((option) => option.value === value);
    let nextIndex: number;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % LAYOUT_SIZE_OPTIONS.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + LAYOUT_SIZE_OPTIONS.length) % LAYOUT_SIZE_OPTIONS.length;
    } else {
      return;
    }
    event.preventDefault();
    onChange(LAYOUT_SIZE_OPTIONS[nextIndex].value);
    const nextButtonEl = groupRef.current?.querySelectorAll('button')[nextIndex] as HTMLButtonElement | undefined;
    nextButtonEl?.focus();
  };

  return (
    <div className="layout-size-toggle">
      <span className="layout-size-toggle__label">배치 크기</span>
      <div
        className="layout-size-toggle__group"
        ref={groupRef}
        role="radiogroup"
        aria-label="배치 크기"
        onKeyDown={handleKeyDown}
      >
        <div
          className="layout-size-toggle__indicator"
          style={{ transform: `translateX(${indicatorStyle.left}px)`, width: indicatorStyle.width }}
        />
        {LAYOUT_SIZE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant="segment"
            size="md"
            role="radio"
            aria-checked={value === option.value}
            tabIndex={value === option.value ? 0 : -1}
            selected={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
