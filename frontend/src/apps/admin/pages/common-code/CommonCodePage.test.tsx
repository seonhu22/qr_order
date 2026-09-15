import { fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { CommonCodePage } from './CommonCodePage';

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
    <MemoryRouter initialEntries={['/admin/system/common-code']}>
      <QueryClientProvider client={queryClient}>
        <CommonCodePage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('CommonCodePage', () => {
  let masters: Array<{ sysId: string; commonCd: string; commonNm: string; useYn: string }>;
  let detailsByMaster: Record<
    string,
    Array<{
      sysId: string;
      linkSysId: string;
      commonCd: string;
      commonNm: string;
      ordNo: number;
      useYn: string;
    }>
  >;
  let detailSaveRequests: Array<{
    tempLinkSysId?: string | null;
    linkSysId: string;
    newItems?: Array<{
      commonCd?: string;
      commonNm: string;
      ordNo: number;
      useYn?: string;
    }>;
    updateItems?: Array<{
      sysId?: string;
      commonCd?: string;
      commonNm: string;
      ordNo: number;
      useYn?: string;
    }>;
    deleteItems?: Array<{ sysId?: string }>;
  }>;

  beforeEach(() => {
    masters = [
      { sysId: 'master-1', commonCd: 'ORDER_STATUS', commonNm: '주문상태', useYn: 'Y' },
      { sysId: 'master-2', commonCd: 'PAYMENT_STATUS', commonNm: '결제상태', useYn: 'Y' },
    ];

    detailsByMaster = {
      'master-1': [
        {
          sysId: 'detail-1',
          linkSysId: 'master-1',
          commonCd: 'STATUS_READY',
          commonNm: '주문접수',
          ordNo: 1,
          useYn: 'Y',
        },
        {
          sysId: 'detail-2',
          linkSysId: 'master-1',
          commonCd: 'STATUS_COOKING',
          commonNm: '조리중',
          ordNo: 2,
          useYn: 'Y',
        },
      ],
      'master-2': [
        {
          sysId: 'detail-3',
          linkSysId: 'master-2',
          commonCd: 'PAY_WAIT',
          commonNm: '결제대기',
          ordNo: 1,
          useYn: 'Y',
        },
      ],
    };
    detailSaveRequests = [];

    server.use(
      http.post('/api/log/log/menu_open_access_log', () => new HttpResponse(null, { status: 200 })),
      http.get('/api/system/settings/common/search', () => HttpResponse.json(masters)),
      http.get('/api/system/settings/common/search/:linkSysId', ({ params }) =>
        HttpResponse.json(detailsByMaster[String(params.linkSysId)] ?? []),
      ),
      http.post('/api/system/settings/common/master/new', async ({ request }) => {
        const body = (await request.json()) as {
          commonCd: string;
          commonNm: string;
          useYn?: string;
        };

        masters = [
          ...masters,
          {
            sysId: `master-${masters.length + 1}`,
            commonCd: body.commonCd,
            commonNm: body.commonNm,
            useYn: body.useYn ?? 'Y',
          },
        ];

        return HttpResponse.json({ success: true, message: '저장되었습니다.' });
      }),
      http.post('/api/system/settings/common/master/update', async ({ request }) => {
        const body = (await request.json()) as {
          sysId?: string;
          commonCd: string;
          commonNm: string;
          useYn?: string;
        };

        masters = masters.map((master) =>
          master.sysId === body.sysId
            ? {
                ...master,
                commonCd: body.commonCd,
                commonNm: body.commonNm,
                useYn: body.useYn ?? 'Y',
              }
            : master,
        );

        return HttpResponse.json({ success: true, message: '저장되었습니다.' });
      }),
      http.post('/api/system/settings/common/master/del', async ({ request }) => {
        const body = (await request.json()) as Array<{ sysId?: string }>;
        const deleteIds = new Set(body.map((item) => item.sysId).filter(Boolean));

        masters = masters.filter((master) => !deleteIds.has(master.sysId));
        detailsByMaster = Object.fromEntries(
          Object.entries(detailsByMaster).filter(([masterId]) => !deleteIds.has(masterId)),
        );

        return HttpResponse.json({ success: true, message: '삭제되었습니다.' });
      }),
      http.post('/api/system/settings/common/detail/save', async ({ request }) => {
        const body = (await request.json()) as {
          linkSysId: string;
          newItems?: Array<{
            commonCd?: string;
            commonNm: string;
            ordNo: number;
            useYn?: string;
          }>;
          updateItems?: Array<{
            sysId?: string;
            commonCd?: string;
            commonNm: string;
            ordNo: number;
            useYn?: string;
          }>;
          deleteItems?: Array<{ sysId?: string }>;
        };
        detailSaveRequests.push({
          ...body,
          tempLinkSysId: new URL(request.url).searchParams.get('tempLinkSysId'),
        });

        let nextRows = [...(detailsByMaster[body.linkSysId] ?? [])];

        if (body.updateItems?.length) {
          nextRows = nextRows.map((row) => {
            const matched = body.updateItems?.find((item) => item.sysId === row.sysId);
            return matched
              ? {
                  ...row,
                  commonCd: matched.commonCd ?? row.commonCd,
                  commonNm: matched.commonNm,
                  ordNo: matched.ordNo,
                  useYn: matched.useYn ?? 'Y',
                }
              : row;
          });
        }

        if (body.newItems?.length) {
          const newRows = body.newItems.map((item, index) => ({
            sysId: `detail-new-${index + 1}`,
            linkSysId: body.linkSysId,
            commonCd: item.commonCd ?? '',
            commonNm: item.commonNm,
            ordNo: item.ordNo,
            useYn: item.useYn ?? 'Y',
          }));

          nextRows = [...nextRows, ...newRows];
        }

        if (body.deleteItems?.length) {
          const deleteIds = new Set(body.deleteItems.map((item) => item.sysId).filter(Boolean));
          nextRows = nextRows.filter((row) => !deleteIds.has(row.sysId));
        }

        detailsByMaster[body.linkSysId] = nextRows;

        return HttpResponse.json({ success: true, message: '저장되었습니다.' });
      }),
    );
  });

  it('opens create modal, save confirm modal, and success notice for a new master row', async () => {
    renderPage();

    await screen.findByText('ORDER_STATUS');
    fireEvent.click(screen.getByRole('button', { name: '신규' }));

    const editorDialog = screen.getByRole('dialog', { name: '공통코드 마스터 등록' });
    fireEvent.change(within(editorDialog).getByRole('textbox', { name: /^공통코드$/ }), {
      target: { value: 'NEW_COMMON' },
    });
    fireEvent.change(within(editorDialog).getByRole('textbox', { name: /^공통코드명$/ }), {
      target: { value: '신규공통코드' },
    });
    fireEvent.click(within(editorDialog).getByRole('button', { name: '확인' }));

    const saveDialog = screen.getByRole('dialog', { name: '저장하시겠습니까?' });
    fireEvent.click(within(saveDialog).getByRole('button', { name: '확인' }));

    expect(await screen.findByRole('dialog', { name: '알림' })).toHaveTextContent(
      '저장되었습니다.',
    );
    expect(await screen.findByText('NEW_COMMON')).toBeInTheDocument();
  });

  it('opens edit confirm modal when saving an existing master row', async () => {
    renderPage();

    await screen.findByText('ORDER_STATUS');
    fireEvent.click(screen.getByRole('button', { name: 'ORDER_STATUS 수정' }));

    const editorDialog = screen.getByRole('dialog', { name: '공통코드 마스터 수정' });
    fireEvent.change(within(editorDialog).getByRole('textbox', { name: /공통코드명/ }), {
      target: { value: '주문상태수정' },
    });
    fireEvent.click(within(editorDialog).getByRole('button', { name: '확인' }));

    expect(screen.getByRole('dialog', { name: '수정하시겠습니까?' })).toBeInTheDocument();
  });

  it('opens delete confirm modal and shows success notice after deleting checked rows', async () => {
    renderPage();

    await screen.findByText('ORDER_STATUS');
    const [, firstRowCheckbox] = screen.getAllByRole('checkbox');
    fireEvent.click(firstRowCheckbox);
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));

    const deleteDialog = screen.getByRole('dialog', { name: '삭제하시겠습니까?' });
    fireEvent.click(within(deleteDialog).getByRole('button', { name: '확인' }));

    expect(await screen.findByRole('dialog', { name: '알림' })).toHaveTextContent('삭제되었습니다.');
    expect(screen.queryByText('ORDER_STATUS')).not.toBeInTheDocument();
  });

  it('opens detail save confirm modal and shows success notice after saving detail changes', async () => {
    renderPage();

    await screen.findByText('ORDER_STATUS');
    fireEvent.click(screen.getByText('주문상태'));

    const detailInput = await screen.findByLabelText('STATUS_READY 코드명');
    fireEvent.change(detailInput, {
      target: { value: '주문접수수정' },
    });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    const saveDialog = screen.getByRole('dialog', { name: '저장하시겠습니까?' });
    fireEvent.click(within(saveDialog).getByRole('button', { name: '확인' }));

    expect(await screen.findByRole('dialog', { name: '알림' })).toHaveTextContent(
      '저장되었습니다.',
    );
  });

  it('sends detail save requests with array fields and mapped values', async () => {
    renderPage();

    await screen.findByText('ORDER_STATUS');
    fireEvent.click(screen.getByText('주문상태'));

    const detailInput = await screen.findByLabelText('STATUS_READY 코드명');
    fireEvent.change(detailInput, {
      target: { value: '주문접수수정' },
    });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    const saveDialog = screen.getByRole('dialog', { name: '저장하시겠습니까?' });
    fireEvent.click(within(saveDialog).getByRole('button', { name: '확인' }));

    await screen.findByRole('dialog', { name: '알림' });

    expect(detailSaveRequests).toHaveLength(1);
    expect(detailSaveRequests[0]).toMatchObject({
      tempLinkSysId: 'master-1',
      linkSysId: 'master-1',
      newItems: [],
      deleteItems: [],
      updateItems: [
        {
          sysId: 'detail-1',
          commonCd: 'STATUS_READY',
          commonNm: '주문접수수정',
          ordNo: 1,
          useYn: 'Y',
        },
      ],
    });
  });

  it('shows dirty warning when closing the master editor with unsaved changes', async () => {
    renderPage();

    await screen.findByText('ORDER_STATUS');
    fireEvent.click(screen.getByRole('button', { name: '신규' }));

    const editorDialog = screen.getByRole('dialog', { name: '공통코드 마스터 등록' });
    fireEvent.change(within(editorDialog).getByRole('textbox', { name: /^공통코드$/ }), {
      target: { value: 'DIRTY_COMMON' },
    });
    fireEvent.click(within(editorDialog).getByRole('button', { name: '닫기' }));

    expect(screen.getByRole('dialog', { name: '알림' })).toHaveTextContent(
      '수정하신 내용이 저장되지 않았습니다.',
    );
  });
});
