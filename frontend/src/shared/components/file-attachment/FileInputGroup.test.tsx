import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FileInputGroup } from './FileInputGroup';

describe('FileInputGroup', () => {
  it('uses allowedExtensions for accept attribute and validation', async () => {
    const handleChange = vi.fn();

    render(<FileInputGroup allowedExtensions={['PDF']} onChange={handleChange} />);

    const input = screen.getByLabelText('파일 선택');
    expect(input).toHaveAttribute('accept', '.pdf');
    expect(screen.getByText(/PDF · 파일당 최대 10MB · 전체 최대 50MB/)).toBeInTheDocument();

    fireEvent.change(input, {
      target: {
        files: [new File(['hello'], 'hello.txt', { type: 'text/plain' })],
      },
    });

    expect(screen.getByText('허용되지 않는 형식입니다. (.txt)')).toBeInTheDocument();
    expect(handleChange).not.toHaveBeenCalled();
  });
});
