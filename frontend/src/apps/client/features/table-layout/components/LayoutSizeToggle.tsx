import './LayoutSizeToggle.css';
import { useEffect, useRef, useState } from 'react';
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

  return (
    <div className="layout-size-toggle">
      <span className="layout-size-toggle__label">배치 크기</span>
      <div className="layout-size-toggle__group" ref={groupRef}>
        <div
          className="layout-size-toggle__indicator"
          style={{ transform: `translateX(${indicatorStyle.left}px)`, width: indicatorStyle.width }}
        />
        {LAYOUT_SIZE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant="segment"
            size="md"
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
