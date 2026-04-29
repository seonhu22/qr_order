import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import type { Menu } from '@/generated/types/menu';
import type { MenuRequest } from '@/generated/types/menuRequest';
import { server } from '@/test/server';
import { ROOT_PARENT_MENU_CD } from '@/apps/admin/features/system-menu/api/systemMenuApi';
import { SystemMenuPage } from './SystemMenuPage';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function renderPage() {
  const queryClient = createQueryClient();

  return render(
    <MemoryRouter initialEntries={['/admin/system/menu']}>
      <QueryClientProvider client={queryClient}>
        <SystemMenuPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

async function expandRootMenuIfNeeded() {
  const toggleButton = await screen.findByRole('button', { name: '펼치기' });
  fireEvent.click(toggleButton);
}

describe('SystemMenuPage', () => {
  let menus: Menu[];
  let saveRequests: MenuRequest[];

  beforeEach(() => {
    menus = [
      {
        sysId: 'sys-1',
        menuCd: 'SYS',
        menuNm: '시스템',
        parentMenuCd: ROOT_PARENT_MENU_CD,
        ordNo: '1',
        treeLevel: '1',
      },
      {
        sysId: 'menu-1',
        menuCd: 'MENU',
        menuNm: '메뉴 관리',
        parentMenuCd: 'SYS',
        ordNo: '1',
        treeLevel: '2',
        menuUrl: '/admin/system/menu',
      },
    ];
    saveRequests = [];

    server.use(
      http.get('/api/system/settings/menu/search', () => HttpResponse.json(menus)),
      http.post('/api/system/settings/menu/save', async ({ request }) => {
        const body = (await request.json()) as MenuRequest;
        saveRequests.push(body);

        return HttpResponse.json({ success: true, message: '저장되었습니다.' });
      }),
    );
  });

  it('renders menu rows from the search API', async () => {
    renderPage();

    expect(await screen.findByLabelText('SYS 메뉴코드')).toHaveValue('SYS');
    await expandRootMenuIfNeeded();
    expect(await screen.findByLabelText('MENU 메뉴명')).toHaveValue('메뉴 관리');
  });

  it('sends updated menu rows to the save API', async () => {
    renderPage();

    await expandRootMenuIfNeeded();
    const menuNameInput = await screen.findByLabelText('MENU 메뉴명');
    fireEvent.click(menuNameInput);
    fireEvent.change(menuNameInput, {
      target: { value: '메뉴 관리 수정' },
    });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    const saveDialog = screen.getByRole('dialog', { name: '저장하시겠습니까?' });
    fireEvent.click(within(saveDialog).getByRole('button', { name: '확인' }));

    expect(await screen.findByRole('dialog', { name: '알림' })).toHaveTextContent(
      '저장되었습니다.',
    );
    expect(saveRequests).toHaveLength(1);
    expect(saveRequests[0]).toMatchObject({
      newItems: [],
      delItems: [],
      updateItems: [
        {
          sysId: 'menu-1',
          menuCd: 'MENU',
          menuNm: '메뉴 관리 수정',
          parentMenuCd: 'SYS',
          ordNo: 1,
          treeLevel: 2,
          menuUrl: '/admin/system/menu',
        },
      ],
    });
  });

  it('sends added root menu rows to the save API', async () => {
    renderPage();

    await screen.findByLabelText('SYS 메뉴코드');
    fireEvent.click(screen.getByRole('button', { name: '+ 행추가' }));

    const textboxes = screen.getAllByRole('textbox');
    const [newCodeInput, newNameInput, newPathInput] = textboxes.slice(-3);
    fireEvent.change(newCodeInput, {
      target: { value: 'NEW_ROOT' },
    });
    fireEvent.change(newNameInput, {
      target: { value: '신규 루트' },
    });
    fireEvent.change(newPathInput, {
      target: { value: '/admin/new-root' },
    });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    const saveDialog = screen.getByRole('dialog', { name: '저장하시겠습니까?' });
    fireEvent.click(within(saveDialog).getByRole('button', { name: '확인' }));

    await waitFor(() => expect(saveRequests).toHaveLength(1));
    expect(saveRequests[0].newItems).toEqual([
      expect.objectContaining({
        menuCd: 'NEW_ROOT',
        menuNm: '신규 루트',
        parentMenuCd: ROOT_PARENT_MENU_CD,
        ordNo: 2,
        treeLevel: 1,
        menuUrl: '/admin/new-root',
      }),
    ]);
  });

  it('reloads saved menu rows from server so a newly created menu can be updated with server sysId', async () => {
    renderPage();

    await screen.findByLabelText('SYS 메뉴코드');
    fireEvent.click(screen.getByRole('button', { name: '+ 행추가' }));

    const textboxes = screen.getAllByRole('textbox');
    const [newCodeInput, newNameInput, newPathInput] = textboxes.slice(-3);
    fireEvent.change(newCodeInput, {
      target: { value: 'NEW_ROOT' },
    });
    fireEvent.change(newNameInput, {
      target: { value: '신규 루트' },
    });
    fireEvent.change(newPathInput, {
      target: { value: '/admin/new-root' },
    });

    menus = [
      ...menus,
      {
        sysId: 'new-menu-sys-id',
        menuCd: 'NEW_ROOT',
        menuNm: '신규 루트',
        parentMenuCd: ROOT_PARENT_MENU_CD,
        ordNo: '2',
        treeLevel: '1',
        menuUrl: '/admin/new-root',
      },
    ];

    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    fireEvent.click(
      within(screen.getByRole('dialog', { name: '저장하시겠습니까?' })).getByRole('button', {
        name: '확인',
      }),
    );

    const noticeDialog = await screen.findByRole('dialog', { name: '알림' });
    expect(noticeDialog).toHaveTextContent('저장되었습니다.');
    fireEvent.click(within(noticeDialog).getByRole('button', { name: '확인' }));

    const persistedMenuNameInput = await screen.findByLabelText('NEW_ROOT 메뉴명');
    fireEvent.change(persistedMenuNameInput, {
      target: { value: '신규 루트 수정' },
    });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    fireEvent.click(
      within(screen.getByRole('dialog', { name: '저장하시겠습니까?' })).getByRole('button', {
        name: '확인',
      }),
    );

    await waitFor(() => expect(saveRequests).toHaveLength(2));
    expect(saveRequests[1].updateItems).toEqual([
      expect.objectContaining({
        sysId: 'new-menu-sys-id',
        menuCd: 'NEW_ROOT',
        menuNm: '신규 루트 수정',
      }),
    ]);
  });

  it('shows validation notice and does not call save API when required fields are empty', async () => {
    renderPage();

    await expandRootMenuIfNeeded();
    const menuNameInput = await screen.findByLabelText('MENU 메뉴명');
    fireEvent.change(menuNameInput, {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(screen.getByRole('dialog', { name: '알림' })).toHaveTextContent(
      '메뉴코드와 메뉴 명은 필수 입력 항목입니다.',
    );
    expect(saveRequests).toHaveLength(0);
  });

  it('sends deleted menu rows after delete-list confirmation', async () => {
    renderPage();

    await expandRootMenuIfNeeded();
    const menuNameInput = await screen.findByLabelText('MENU 메뉴명');
    fireEvent.click(menuNameInput);
    fireEvent.click(screen.getByRole('button', { name: '- 행삭제' }));
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    const deleteListDialog = screen.getByRole('dialog', { name: '알림' });
    expect(deleteListDialog).toHaveTextContent('MENU');
    fireEvent.click(within(deleteListDialog).getByRole('button', { name: '확인' }));

    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: '알림' })).toHaveTextContent('저장되었습니다.'),
    );
    expect(saveRequests).toHaveLength(1);
    expect(saveRequests[0]).toMatchObject({
      newItems: [],
      updateItems: [],
      delItems: [
        {
          sysId: 'menu-1',
          menuCd: 'MENU',
          menuNm: '메뉴 관리',
          parentMenuCd: 'SYS',
          ordNo: 1,
          treeLevel: 2,
          menuUrl: '/admin/system/menu',
        },
      ],
    });
  });
});
