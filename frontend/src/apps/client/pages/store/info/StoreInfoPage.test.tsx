import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { StoreInfoPage } from './StoreInfoPage';

describe('StoreInfoPage', () => {
  it('shows the access authentication modal before the store form', () => {
    render(<StoreInfoPage />);

    expect(screen.getByRole('dialog', { name: '매장 정보 접근 인증' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('비밀번호를 입력하세요')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '매장 정보' })).not.toBeInTheDocument();
  });

  it('requires a password before confirming access', async () => {
    const user = userEvent.setup();
    render(<StoreInfoPage />);

    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(screen.getByText('비밀번호를 입력해주세요.')).toBeInTheDocument();
  });

  it('renders the store info form card after password confirmation', async () => {
    const user = userEvent.setup();
    render(<StoreInfoPage />);

    await user.type(screen.getByPlaceholderText('비밀번호를 입력하세요'), '1234');
    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(screen.queryByRole('dialog', { name: '매장 정보 접근 인증' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '매장 정보' })).toBeInTheDocument();
    expect(screen.getByLabelText(/상호명/)).toHaveValue('쌀국수 먹고싶다');
    expect(screen.getByLabelText('정보 수정')).not.toBeChecked();
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
  });

  it('enables the save button when 정보 수정 is checked', async () => {
    const user = userEvent.setup();
    render(<StoreInfoPage />);

    await user.type(screen.getByPlaceholderText('비밀번호를 입력하세요'), '1234');
    await user.click(screen.getByRole('button', { name: '확인' }));

    await user.click(screen.getByLabelText('정보 수정'));

    expect(screen.getByLabelText('정보 수정')).toBeChecked();
    expect(screen.getByRole('button', { name: '저장' })).toBeEnabled();
  });
});
