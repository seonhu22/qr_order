/**
 * @fileoverview PlantSearchFilters 컴포넌트 테스트
 *
 * @description
 * - 검색 입력과 버튼 이벤트 전달 계약을 검증한다.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlantSearchFilters } from './PlantSearchFilters';

describe('PlantSearchFilters', () => {
  it('calls onKeywordChange when the input value changes', () => {
    const onKeywordChange = vi.fn();

    render(
      <PlantSearchFilters
        draftKeyword=""
        onKeywordChange={onKeywordChange}
        onSearch={() => {}}
        onReset={() => {}}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: '사업장 검색어' }), {
      target: { value: '강남' },
    });

    expect(onKeywordChange).toHaveBeenCalledWith('강남');
  });

  it('calls onSearch when Enter is pressed in the input', () => {
    const onSearch = vi.fn();

    render(
      <PlantSearchFilters
        draftKeyword="강남"
        onKeywordChange={() => {}}
        onSearch={onSearch}
        onReset={() => {}}
      />,
    );

    fireEvent.keyDown(screen.getByRole('textbox', { name: '사업장 검색어' }), {
      key: 'Enter',
    });

    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('does not call onSearch when a non-Enter key is pressed', () => {
    const onSearch = vi.fn();

    render(
      <PlantSearchFilters
        draftKeyword="강남"
        onKeywordChange={() => {}}
        onSearch={onSearch}
        onReset={() => {}}
      />,
    );

    // Enter 이외 키 입력은 조회를 트리거하면 안 된다.
    fireEvent.keyDown(screen.getByRole('textbox', { name: '사업장 검색어' }), {
      key: 'Escape',
    });

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('calls onSearch when search button is clicked', () => {
    const onSearch = vi.fn();

    render(
      <PlantSearchFilters
        draftKeyword="강남"
        onKeywordChange={() => {}}
        onSearch={onSearch}
        onReset={() => {}}
      />,
    );

    // 사용자의 기본 경로(조회 버튼 클릭)도 별도로 회귀 방어한다.
    fireEvent.click(screen.getByRole('button', { name: '조회' }));

    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('calls onReset when reset button is clicked', () => {
    const onReset = vi.fn();

    render(
      <PlantSearchFilters
        draftKeyword="강남"
        onKeywordChange={() => {}}
        onSearch={() => {}}
        onReset={onReset}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '초기화' }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
