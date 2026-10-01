import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/server';
import { MenuOptionManagementPage } from './MenuOptionManagementPage';

const MASTER_SYS_ID = '01KWBWQG5HF9SGJ1464GYBARBW';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <MenuOptionManagementPage />
      </QueryClientProvider>
    </StrictMode>,
  );
}

describe('MenuOptionManagementPage', () => {
  it('실제 옵션 그룹 응답을 받아 화면을 계속 렌더링한다', async () => {
    server.use(
      http.get('/api/client/menu_manage/menu/detail/search', () =>
        HttpResponse.json([
          {
            sysId: MASTER_SYS_ID,
            menuName: '테스트 메뉴',
            useYn: 'Y',
          },
        ]),
      ),
      http.get(`/api/client/menu_manage/option/group/search/${MASTER_SYS_ID}`, () =>
        HttpResponse.json([
          {
            groupName: '1',
            inputType: '01',
            linkSysId: MASTER_SYS_ID,
            ordNo: 1,
            requiredYn: 'N',
            sysId: '01KY99AG8MNRBV9MAT25T40GM2',
            useYn: 'N',
          },
          {
            groupName: '사이드 추가',
            inputType: '02',
            linkSysId: MASTER_SYS_ID,
            ordNo: 2,
            requiredYn: 'N',
            sysId: '01KY99PBBGGMZM9Q4S8MFQ87KP',
            useYn: 'Y',
          },
        ]),
      ),
    );

    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /테스트 메뉴/ }));

    expect(await screen.findByDisplayValue('1')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('사이드 추가')).toBeInTheDocument();
  });
});
