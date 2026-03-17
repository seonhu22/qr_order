import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@/App';

/**
 * App 컴포넌트에 대한 테스트입니다.
 *
 * App 컴포넌트는 라우팅과 인증 상태 관리를 담당하는 최상위 컴포넌트입니다.
 * 그렇기 때문에 통합 테스트로 작성되어있으며, App.int.test.jsx (integration test)로 이름을 작성하기도 합니다.
 */

describe('App', () => {
  it('renders the login screen when the user is not authenticated', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'QROrder' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });
});
