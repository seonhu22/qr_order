import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

function renderQrRoute(initialPath: string) {
  return render(
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
    </MemoryRouter>,
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

  it('shows invalid QR message when API rejects', async () => {
    connectQrMock.mockRejectedValue(new Error('유효하지 않은 QR코드입니다.'));

    renderQrRoute('/qr/invalid-id');

    expect(await screen.findByRole('heading', { name: '유효하지 않은 QR코드입니다.' })).toBeInTheDocument();
  });
});
