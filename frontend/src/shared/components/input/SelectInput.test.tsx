/**
 * @fileoverview SelectInput 접근성 및 빈 결과 상태 테스트
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SelectInput } from './SelectInput';

describe('SelectInput', () => {
  it('provides a fallback accessible name for the combobox trigger', () => {
    render(<SelectInput options={[]} placeholder="" />);

    expect(screen.getByRole('combobox', { name: '항목 선택' })).toBeInTheDocument();
  });

  it('renders an option role for empty search results inside listbox', () => {
    render(
      <SelectInput
        searchable
        label="사업장"
        options={[
          { value: 'PLANT-001', label: '본사' },
          { value: 'PLANT-002', label: '판교점' },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('combobox', { name: '사업장' }));
    fireEvent.change(screen.getByLabelText('옵션 검색'), { target: { value: '없는값' } });

    const listbox = screen.getByRole('listbox', { name: '사업장' });
    const emptyOption = within(listbox).getByRole('option', { name: '검색 결과 없음' });

    expect(emptyOption).toHaveAttribute('aria-disabled', 'true');
  });

  it('sets aria-invalid when isError is true', () => {
    render(<SelectInput label="사업장" options={[]} isError />);

    expect(screen.getByRole('combobox', { name: '사업장' })).toHaveAttribute('aria-invalid', 'true');
  });
});

