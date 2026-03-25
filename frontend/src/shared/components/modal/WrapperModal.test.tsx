// src/shared/components/modal/WrapperModal.test.tsx

/**
 * @fileoverview WrapperModal 컴포넌트 테스트
 *
 * @description
 * - 기본 레이아웃과 안내형 레이아웃이 올바르게 렌더링되는지 확인한다.
 * - footer 버튼 개수, fallback 동작, overlay/ESC 닫기 정책을 검증한다.
 *
 * @example
 * npm test
 *
 * @example
 * npx vitest run src/shared/components/modal/WrapperModal.test.tsx
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WrapperModal } from '@/shared/components/modal';

/**
 * 테스트용 WrapperModal을 렌더링한다.
 *
 * @param {Partial<import('@/shared/components/modal').WrapperModalProps>} overrideProps 테스트마다 덮어쓸 props
 * @returns {{
 *   onClose: ReturnType<typeof vi.fn>;
 *   onConfirm: ReturnType<typeof vi.fn>;
 *   onSecondaryAction: ReturnType<typeof vi.fn>;
 * }}
 *
 * @example
 * const result = renderModal({ title: '테스트' });
 * expect(result.onClose).not.toHaveBeenCalled();
 */
function renderModal(
  overrideProps: Partial<import('@/shared/components/modal').WrapperModalProps> = {},
) {
  const onClose = vi.fn();
  const onConfirm = vi.fn();
  const onSecondaryAction = vi.fn();

  render(
    <WrapperModal
      open
      title="기본 타이틀"
      subtitle="기본 설명"
      onClose={onClose}
      primaryAction={{ label: '확인', onClick: onConfirm }}
      {...overrideProps}
    />,
  );

  return { onClose, onConfirm, onSecondaryAction };
}

describe('WrapperModal', () => {
  it('returns null when open is false', () => {
    render(<WrapperModal open={false} onClose={() => {}} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the default layout with title, close button, subtitle, and one primary button', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: '기본 타이틀' })).toBeInTheDocument();
    expect(screen.getByText('기본 타이틀')).toBeInTheDocument();
    expect(screen.getByText('기본 설명')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '모달 닫기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument();
  });

  it('renders the notice layout without the top close button and with two footer actions', () => {
    renderModal({
      layout: 'notice',
      icon: <span data-testid="notice-icon">!</span>,
      primaryAction: { label: '저장', onClick: vi.fn() },
      secondaryAction: { label: '닫기', onClick: vi.fn() },
    });

    expect(screen.getByTestId('notice-icon')).toBeInTheDocument();
    expect(screen.getByText('기본 타이틀')).toBeInTheDocument();
    expect(screen.getByText('기본 설명')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '모달 닫기' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument();
  });

  it('falls back to onClose when onConfirm or onSecondaryAction is not provided', () => {
    const onClose = vi.fn();

    render(
      <WrapperModal
        open
        primaryAction={{ label: '확인' }}
        secondaryAction={{ label: '닫기' }}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('closes on overlay click when closeOnOverlayClick is true and on ESC key press', () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement);
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('does not close on overlay click when closeOnOverlayClick is false', () => {
    const { onClose } = renderModal({
      closeOnOverlayClick: false,
    });

    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders button state from action config', () => {
    renderModal({
      primaryAction: {
        label: '삭제',
        loading: true,
        disabled: true,
        variant: 'danger',
      },
    });

    expect(screen.getByRole('button', { name: '삭제' })).toBeDisabled();
  });
});
