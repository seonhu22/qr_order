import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/shared/auth/AuthContext';
import {
  useInsertMenuCloseAccessLog,
  useInsertMenuOpenAccessLog,
} from '@/generated/log-controller/log-controller';
import { useGetMenu } from '@/generated/settings-controller/settings-controller';
import { useClientLayoutStore } from '@/apps/client/stores/clientLayoutStore';
import { useUnreadStaffCallsQuery } from '@/apps/client/features/staff-call-notifications/api/staffCallNotificationApi';
import { ClientLayout } from './ClientLayout';

const openAccessLogMock = vi.fn();
const closeAccessLogMock = vi.fn();

vi.mock('@/generated/log-controller/log-controller', () => ({
  useInsertMenuCloseAccessLog: vi.fn(),
  useInsertMenuOpenAccessLog: vi.fn(),
}));

vi.mock('@/generated/settings-controller/settings-controller', () => ({
  useGetMenu: vi.fn(),
}));

vi.mock('@/apps/client/features/staff-call-notifications/api/staffCallNotificationApi', async () => {
  const actual = await vi.importActual<
    typeof import('@/apps/client/features/staff-call-notifications/api/staffCallNotificationApi')
  >('@/apps/client/features/staff-call-notifications/api/staffCallNotificationApi');
  return { ...actual, useUnreadStaffCallsQuery: vi.fn() };
});

const mockedUseInsertMenuOpenAccessLog = vi.mocked(useInsertMenuOpenAccessLog);
const mockedUseInsertMenuCloseAccessLog = vi.mocked(useInsertMenuCloseAccessLog);
const mockedUseGetMenu = vi.mocked(useGetMenu);
const mockedUseUnreadStaffCallsQuery = vi.mocked(useUnreadStaffCallsQuery);

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderLayout(initialPath = '/client/main', userOverrides: Record<string, unknown> = {}) {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <AuthContext.Provider
        value={{
          isAuthenticated: true,
          isLoading: false,
          user: { userId: 'PC002', userName: '테스트 사용자', sysPlantCd: 'ADMIN', ...userOverrides },
          signIn: vi.fn(),
          signOut: vi.fn(),
        }}
      >
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/client" element={<ClientLayout />}>
              <Route path="main" element={<div>main content</div>} />
              <Route path="store/info/base" element={<div>store info content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

describe('ClientLayout', () => {
  beforeEach(() => {
    openAccessLogMock.mockReset();
    closeAccessLogMock.mockReset();
    mockedUseInsertMenuOpenAccessLog.mockReset();
    mockedUseInsertMenuOpenAccessLog.mockReturnValue({
      mutate: openAccessLogMock,
    } as never);
    mockedUseInsertMenuCloseAccessLog.mockReset();
    mockedUseInsertMenuCloseAccessLog.mockReturnValue({
      mutate: closeAccessLogMock,
    } as never);
    mockedUseGetMenu.mockReset();
    mockedUseGetMenu.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    mockedUseUnreadStaffCallsQuery.mockReset();
    mockedUseUnreadStaffCallsQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    useClientLayoutStore.setState({ isSidebarOpen: false, activeSection: null });
  });

  it('renders with the initial store state', () => {
    renderLayout();

    expect(screen.getByText('main content')).toBeInTheDocument();
    expect(screen.getByLabelText('사이드 내비게이션')).toHaveClass(
      'client-layout__sidebar--closed',
    );
  });

  it('opens the sidebar and stores the section when a header section is selected', async () => {
    const user = userEvent.setup();

    renderLayout();

    const headerNav = screen.getByRole('navigation', { name: '상단 메뉴' });
    await user.click(within(headerNav).getByRole('button', { name: '매장' }));

    expect(useClientLayoutStore.getState().activeSection).toBe('STO');
    expect(useClientLayoutStore.getState().isSidebarOpen).toBe(true);
    expect(screen.getByLabelText('사이드 내비게이션')).not.toHaveClass(
      'client-layout__sidebar--closed',
    );
  });

  it('syncs the active section from the current route', async () => {
    renderLayout('/client/store/info/base');

    await waitFor(() => {
      expect(useClientLayoutStore.getState().activeSection).toBe('STO');
    });
    expect(useClientLayoutStore.getState().isSidebarOpen).toBe(true);
    expect(screen.getByText('store info content')).toBeInTheDocument();
  });

  it('shows page navigation from the current route', async () => {
    renderLayout('/client/store/info/base');

    const pageNavigation = await screen.findByRole('navigation', { name: '현재 위치' });
    expect(within(pageNavigation).getByText('매장')).toBeInTheDocument();
    expect(within(pageNavigation).getByText('매장 정보 관리')).toBeInTheDocument();
    expect(within(pageNavigation).getByText('매장 기본 정보')).toBeInTheDocument();
  });

  it('opens a menu access log with the client menu code for the current route', async () => {
    renderLayout('/client/store/info/base');

    await waitFor(() => {
      expect(openAccessLogMock).toHaveBeenCalledTimes(1);
    });
    expect(openAccessLogMock).toHaveBeenCalledWith(
      { params: { menuCd: 'STO_INFO_BASE' } },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });

  it('does not open a menu access log for client routes that do not map to a menu', () => {
    renderLayout('/client/main');

    expect(openAccessLogMock).not.toHaveBeenCalled();
  });
});

describe('ClientLayout 헤더 알림 역할 분기', () => {
  beforeEach(() => {
    mockedUseInsertMenuOpenAccessLog.mockReturnValue({ mutate: openAccessLogMock } as never);
    mockedUseInsertMenuCloseAccessLog.mockReturnValue({ mutate: closeAccessLogMock } as never);
    mockedUseGetMenu.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    mockedUseUnreadStaffCallsQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    useClientLayoutStore.setState({ isSidebarOpen: false, activeSection: null });
  });

  it('01 관리자는 공지/문의 mock 알림과 모두 읽음 버튼을 본다', async () => {
    const user = userEvent.setup();
    renderLayout('/client/main', { staffRole: '01' });

    await user.click(screen.getByRole('button', { name: /읽지 않은 알림 \d+건/ }));

    expect(screen.getByText('시스템 점검 공지')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '모두 읽음' })).toBeInTheDocument();
  });

  it('02 스태프는 직원호출 알림을 보고 모두 읽음 버튼은 없다', async () => {
    mockedUseUnreadStaffCallsQuery.mockReturnValue({
      data: [
        {
          masterSysId: 'call-1',
          tableSysId: 'table-1',
          tableNum: 5,
          insertDatetime: new Date().toISOString(),
          items: [{ sysId: 'item-1', callCd: 'C1', callNm: '물', quantity: 1 }],
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    const user = userEvent.setup();
    renderLayout('/client/main', { staffRole: '02' });

    await user.click(screen.getByRole('button', { name: /읽지 않은 알림 \d+건/ }));

    expect(screen.getByText('5번 테이블 직원호출')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '모두 읽음' })).not.toBeInTheDocument();
  });
});
