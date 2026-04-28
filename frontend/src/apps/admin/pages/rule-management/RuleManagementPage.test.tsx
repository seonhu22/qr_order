import { fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { RuleManagementPage } from './RuleManagementPage';

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
    <QueryClientProvider client={queryClient}>
      <RuleManagementPage />
    </QueryClientProvider>,
  );
}

describe('RuleManagementPage', () => {
  let masters: Array<{ sysId: string; ruleCd: string; ruleNm: string; useYn: string }>;
  let detailsByMaster: Record<
    string,
    Array<{
      sysId: string;
      linkSysId: string;
      optionCd: string;
      optionNm: string;
      optionData: string;
      description?: string;
      ordNo: number;
    }>
  >;
  let detailSaveRequests: Array<{
    newItems?: Array<{
      sysId?: string;
      linkSysId: string;
      optionCd: string;
      optionNm: string;
      optionData: string;
      description?: string;
      ordNo: number;
    }>;
    updateItems?: Array<{
      sysId?: string;
      linkSysId: string;
      optionCd: string;
      optionNm: string;
      optionData: string;
      description?: string;
      ordNo: number;
    }>;
    delItems?: Array<{
      sysId?: string;
      linkSysId: string;
      optionCd: string;
      optionNm: string;
      optionData: string;
      description?: string;
      ordNo: number;
    }>;
  }>;

  beforeEach(() => {
    masters = [
      { sysId: 'rule-1', ruleCd: 'ORDER_STATUS', ruleNm: '주문상태', useYn: 'Y' },
      { sysId: 'rule-2', ruleCd: 'PAYMENT_STATUS', ruleNm: '결제상태', useYn: 'Y' },
    ];

    detailsByMaster = {
      'rule-1': [
        {
          sysId: 'detail-1',
          linkSysId: 'rule-1',
          optionCd: 'REQUESTED',
          optionNm: '주문요청',
          optionData: 'REQ',
          description: '요청 상태',
          ordNo: 1,
        },
        {
          sysId: 'detail-2',
          linkSysId: 'rule-1',
          optionCd: 'COOKING',
          optionNm: '조리중',
          optionData: 'COOK',
          description: '',
          ordNo: 2,
        },
      ],
      'rule-2': [
        {
          sysId: 'detail-3',
          linkSysId: 'rule-2',
          optionCd: 'WAITING',
          optionNm: '결제대기',
          optionData: 'WAIT',
          description: '',
          ordNo: 1,
        },
      ],
    };
    detailSaveRequests = [];

    server.use(
      http.get('/api/system/settings/rule/master/search', ({ request }) => {
        const keyword = new URL(request.url).searchParams.get('searchKeyword')?.trim() ?? '';
        const filteredMasters = keyword
          ? masters.filter(
              (master) => master.ruleCd.includes(keyword) || master.ruleNm.includes(keyword),
            )
          : masters;

        return HttpResponse.json(filteredMasters);
      }),
      http.get('/api/system/settings/rule/detail/search', ({ request }) => {
        const sysId = new URL(request.url).searchParams.get('sysId') ?? '';

        return HttpResponse.json(detailsByMaster[sysId] ?? []);
      }),
      http.post('/api/system/settings/rule/master/new', async ({ request }) => {
        const body = (await request.json()) as {
          ruleCd: string;
          ruleNm: string;
          useYn?: string;
        };

        masters = [
          ...masters,
          {
            sysId: `rule-${masters.length + 1}`,
            ruleCd: body.ruleCd,
            ruleNm: body.ruleNm,
            useYn: body.useYn ?? 'Y',
          },
        ];

        return HttpResponse.json({ success: true, message: '저장되었습니다.' });
      }),
      http.post('/api/system/settings/rule/master/update', async ({ request }) => {
        const body = (await request.json()) as {
          sysId?: string;
          ruleCd: string;
          ruleNm: string;
          useYn?: string;
        };

        masters = masters.map((master) =>
          master.sysId === body.sysId
            ? {
                ...master,
                ruleCd: body.ruleCd,
                ruleNm: body.ruleNm,
                useYn: body.useYn ?? 'Y',
              }
            : master,
        );

        return HttpResponse.json({ success: true, message: '저장되었습니다.' });
      }),
      http.post('/api/system/settings/rule/master/del', async ({ request }) => {
        const body = (await request.json()) as Array<{ sysId?: string }>;
        const deleteIds = new Set(body.map((item) => item.sysId).filter(Boolean));

        masters = masters.filter((master) => !deleteIds.has(master.sysId));
        detailsByMaster = Object.fromEntries(
          Object.entries(detailsByMaster).filter(([masterId]) => !deleteIds.has(masterId)),
        );

        return HttpResponse.json({ success: true, message: '삭제되었습니다.' });
      }),
      http.post('/api/system/settings/rule/detail/save', async ({ request }) => {
        const body = (await request.json()) as (typeof detailSaveRequests)[number];
        detailSaveRequests.push(body);

        return HttpResponse.json({ success: true, message: '저장되었습니다.' });
      }),
    );
  });

  it('renders rule master rows from the search API', async () => {
    renderPage();

    expect(await screen.findByText('ORDER_STATUS')).toBeInTheDocument();
    expect(screen.getByText('PAYMENT_STATUS')).toBeInTheDocument();
  });

  it('opens create modal, saves a new master row, and shows success notice', async () => {
    renderPage();

    await screen.findByText('ORDER_STATUS');
    fireEvent.click(screen.getByRole('button', { name: '신규' }));

    const editorDialog = screen.getByRole('dialog', { name: '규칙 등록' });
    fireEvent.change(within(editorDialog).getByRole('textbox', { name: /^규칙코드$/ }), {
      target: { value: 'NEW_RULE' },
    });
    fireEvent.change(within(editorDialog).getByRole('textbox', { name: /^규칙명$/ }), {
      target: { value: '신규규칙' },
    });
    fireEvent.click(within(editorDialog).getByRole('button', { name: '확인' }));

    const saveDialog = screen.getByRole('dialog', { name: '저장하시겠습니까?' });
    fireEvent.click(within(saveDialog).getByRole('button', { name: '확인' }));

    expect(await screen.findByRole('dialog', { name: '알림' })).toHaveTextContent(
      '저장되었습니다.',
    );
    expect(await screen.findByText('NEW_RULE')).toBeInTheDocument();
  });

  it('opens edit confirm modal when saving an existing master row', async () => {
    renderPage();

    await screen.findByText('ORDER_STATUS');
    fireEvent.click(screen.getByRole('button', { name: 'ORDER_STATUS 수정' }));

    const editorDialog = screen.getByRole('dialog', { name: '규칙 수정' });
    fireEvent.change(within(editorDialog).getByRole('textbox', { name: /규칙명/ }), {
      target: { value: '주문상태수정' },
    });
    fireEvent.click(within(editorDialog).getByRole('button', { name: '확인' }));

    expect(screen.getByRole('dialog', { name: '수정된 내용을 저장하시겠습니까?' })).toBeInTheDocument();
  });

  it('deletes checked master rows after delete confirmation', async () => {
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

  it('sends changed rule detail rows to the detail save API', async () => {
    renderPage();

    await screen.findByText('ORDER_STATUS');
    fireEvent.click(screen.getByText('주문상태'));

    const optionNameInput = await screen.findByLabelText('detail-1 옵션명');
    fireEvent.change(optionNameInput, {
      target: { value: '주문요청수정' },
    });

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    const saveDialog = screen.getByRole('dialog', { name: '저장하시겠습니까?' });
    fireEvent.click(within(saveDialog).getByRole('button', { name: '확인' }));

    expect(await screen.findByRole('dialog', { name: '알림' })).toHaveTextContent(
      '저장되었습니다.',
    );
    expect(detailSaveRequests).toHaveLength(1);
    expect(detailSaveRequests[0]).toMatchObject({
      newItems: [],
      delItems: [],
      updateItems: [
        {
          sysId: 'detail-1',
          linkSysId: 'rule-1',
          optionCd: 'REQUESTED',
          optionNm: '주문요청수정',
          optionData: 'REQ',
          description: '요청 상태',
          ordNo: 1,
        },
      ],
    });
  });

  it('renders move buttons for rule detail because rule detail has a saved order contract', async () => {
    renderPage();

    await screen.findByText('ORDER_STATUS');
    fireEvent.click(screen.getByText('주문상태'));

    await screen.findByLabelText('detail-1 옵션명');
    expect(screen.getAllByRole('button', { name: '위로 이동' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: '아래로 이동' }).length).toBeGreaterThan(0);
  });
});
