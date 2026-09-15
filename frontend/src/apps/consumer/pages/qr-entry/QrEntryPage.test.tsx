import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/shared/lib/httpClient';
import { connectQr } from '../../features/qr/api/qrConnectApi';
import { QrEntryPage } from './QrEntryPage';

vi.mock('../../features/qr/api/qrConnectApi', () => ({
  connectQr: vi.fn(),
}));

const connectQrMock = vi.mocked(connectQr);

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="pathname">{location.pathname}</span>;
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderQrRoute(initialPath: string) {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/qr/:url" element={<QrEntryPage />} />
          <Route
            path="/consumer/order"
            element={
              <>
                <div>consumer order destination</div>
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('QrEntryPage', () => {
  beforeEach(() => {
    connectQrMock.mockReset();
  });

  it('calls qr connect API and moves to consumer order route on success', async () => {
    connectQrMock.mockResolvedValue({
      success: true,
      data: { sysId: 'table-001', tableNum: 1, tableQty: 4, sysPlantCd: 'ADMIN' },
      message: null,
      error: null,
    });

    renderQrRoute('/qr/valid-id');

    await waitFor(() => {
      expect(connectQrMock).toHaveBeenCalledWith('valid-id', expect.any(AbortSignal));
    });
    await waitFor(() => {
      expect(screen.getByTestId('pathname')).toHaveTextContent('/consumer/order');
    });
    expect(screen.getByText('consumer order destination')).toBeInTheDocument();
  });

  it('shows invalid QR message when API rejects with a 4xx HttpError', async () => {
    connectQrMock.mockRejectedValue(
      new HttpError(
        '유효하지 않은 QR코드입니다.',
        new Response(null, { status: 404 }),
        '/api/qr/invalid-id',
      ),
    );

    renderQrRoute('/qr/invalid-id');

    expect(
      await screen.findByRole('heading', { name: '유효하지 않은 QR코드입니다.' }),
    ).toBeInTheDocument();
  });

  it('shows a retryable message on network failure and re-invokes connectQr on retry', async () => {
    connectQrMock.mockRejectedValue(new TypeError('Failed to fetch'));

    renderQrRoute('/qr/network-issue');

    expect(
      await screen.findByRole('heading', { name: '일시적인 통신 오류가 발생했습니다.' }),
    ).toBeInTheDocument();
    expect(connectQrMock).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    await waitFor(() => {
      expect(connectQrMock).toHaveBeenCalledTimes(2);
    });
  });
});
