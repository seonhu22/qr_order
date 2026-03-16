import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@/App';

describe('App', () => {
  it('renders the login screen when the user is not authenticated', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'QROrder' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });
});
