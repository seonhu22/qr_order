import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ClientPageNavigation } from './ClientPageNavigation';

describe('ClientPageNavigation', () => {
  it('renders depth1, depth2, depth3 labels', () => {
    render(
      <ClientPageNavigation
        breadcrumb={{
          depth1: '매장',
          depth2: '유저 관리',
          depth3: '유저 정보 관리',
        }}
      />,
    );

    expect(screen.getByRole('navigation', { name: '현재 페이지 위치' })).toBeInTheDocument();
    expect(screen.getByText('매장')).toBeInTheDocument();
    expect(screen.getByText('유저 관리')).toBeInTheDocument();
    expect(screen.getByText('유저 정보 관리')).toBeInTheDocument();
  });

  it('renders nothing when breadcrumb is missing', () => {
    render(<ClientPageNavigation breadcrumb={null} />);

    expect(screen.queryByRole('navigation', { name: '현재 페이지 위치' })).not.toBeInTheDocument();
  });
});
