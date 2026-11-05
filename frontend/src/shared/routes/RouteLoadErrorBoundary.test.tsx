import { lazy, Suspense } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { RouteLoadErrorBoundary } from './RouteLoadErrorBoundary';

describe('RouteLoadErrorBoundary', () => {
  it('동적 route 청크 로드가 실패하면 새로고침 복구 UI를 제공한다', async () => {
    const reload = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const BrokenRoute = lazy(() => Promise.reject(new Error('chunk download failed')));

    render(
      <MemoryRouter>
        <RouteLoadErrorBoundary onReload={reload}>
          <Suspense fallback={<span>loading route</span>}>
            <BrokenRoute />
          </Suspense>
        </RouteLoadErrorBoundary>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: '화면을 불러오지 못했습니다.' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '새로고침' }));
    expect(reload).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });
});
