import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MessageTable } from './MessageTable';

const createProps = () => ({
  rows: [],
  selectedRowId: '',
  rowErrors: {},
  isLoading: false,
  isError: false,
  isSaving: false,
  onSelectRow: vi.fn(),
  onChangeRowField: vi.fn(),
  onAddRow: vi.fn(),
  onDeleteRow: vi.fn(),
  onSave: vi.fn(),
});

describe('MessageTable', () => {
  it('renders error feedback when query fails', () => {
    render(<MessageTable {...createProps()} isError />);

    expect(screen.getByText('불러오는데 실패했습니다')).toBeInTheDocument();
    expect(screen.getByText('다시 한번 시도해주세요.')).toBeInTheDocument();
  });
});
