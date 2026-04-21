import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SearchFilterCard } from './SearchFilterCard';

const createProps = () => ({
  ariaLabel: '검색 필터',
  inputId: 'search-keyword',
  inputAriaLabel: '검색어',
  placeholder: '검색어를 입력하세요',
  draftKeyword: '',
  onKeywordChange: vi.fn(),
  onSearch: vi.fn(),
  onReset: vi.fn(),
});

describe('SearchFilterCard', () => {
  it('calls onKeywordChange when the input value changes', () => {
    const props = createProps();

    render(<SearchFilterCard {...props} />);

    fireEvent.change(screen.getByRole('textbox', { name: '검색어' }), {
      target: { value: '강남' },
    });

    expect(props.onKeywordChange).toHaveBeenCalledWith('강남');
  });

  it('calls onSearch when Enter is pressed in the input', () => {
    const props = createProps();

    render(<SearchFilterCard {...props} />);

    fireEvent.keyDown(screen.getByRole('textbox', { name: '검색어' }), {
      key: 'Enter',
    });

    expect(props.onSearch).toHaveBeenCalledTimes(1);
  });

  it('calls onSearch when search button is clicked', () => {
    const props = createProps();

    render(<SearchFilterCard {...props} />);

    fireEvent.click(screen.getByRole('button', { name: '조회' }));

    expect(props.onSearch).toHaveBeenCalledTimes(1);
  });

  it('calls onReset when reset button is clicked', () => {
    const props = createProps();

    render(<SearchFilterCard {...props} />);

    fireEvent.click(screen.getByRole('button', { name: '초기화' }));

    expect(props.onReset).toHaveBeenCalledTimes(1);
  });
});
