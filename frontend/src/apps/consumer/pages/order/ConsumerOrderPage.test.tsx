import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { useConsumerOrderFilterStore } from '@/apps/consumer/stores/consumerOrderFilterStore';
import { useConsumerSheetStore } from '@/apps/consumer/stores/consumerSheetStore';
import { useConsumerCartStore } from '@/apps/consumer/stores/consumerCartStore';
import { ConsumerOrderPage } from './ConsumerOrderPage';

/** 옵션이 없는 메뉴(디자인 기준 화면)와 옵션이 있는 메뉴 각각의 mock 이름. */
const PLAIN_MENU = '된장찌개';
const OPTION_MENU = '불고기 정식';

async function openMenuDetail(menuName: string) {
  return userEvent.click(await screen.findByRole('button', { name: new RegExp(menuName) }));
}

async function addPlainMenuToCart() {
  await openMenuDetail(PLAIN_MENU);
  await userEvent.click(within(sheet()).getByRole('button', { name: /장바구니에 담기/ }));
  await userEvent.click(screen.getByRole('button', { name: /개 담음/ }));
}

function renderOrderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ConsumerOrderPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

function sheet() {
  return screen.getByRole('dialog');
}

beforeEach(() => {
  useConsumerCartStore.setState({ cart: [], scope: null });
  localStorage.clear();
  useConsumerSheetStore.setState({ sheet: null });
  useConsumerOrderFilterStore.setState({ searchQuery: '', selectedCategory: '전체' });
});

describe('ConsumerOrderPage 메뉴 상세 시트', () => {
  it('검색 실패를 빈 결과와 구분하고 다시 시도할 수 있다', async () => {
    let attempts = 0;
    server.use(
      http.get('/api/client/consumer/menu/search', () => {
        attempts += 1;
        if (attempts === 1) {
          return HttpResponse.json({ success: false, message: '검색 실패' }, { status: 500 });
        }
        return HttpResponse.json({ success: true, data: { body: { menuList: [] } } });
      }),
    );
    useConsumerOrderFilterStore.setState({ searchQuery: '없는 메뉴', selectedCategory: '전체' });

    renderOrderPage();

    expect(await screen.findByText('검색 결과를 불러오지 못했습니다.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByText('"없는 메뉴"에 대한 메뉴가 없습니다')).toBeInTheDocument();
    expect(attempts).toBe(2);
  });

  it('메뉴 카드를 누르면 이름·가격·설명·수량·담기 버튼이 있는 시트가 열린다', async () => {
    renderOrderPage();
    await openMenuDetail(PLAIN_MENU);

    const dialog = sheet();
    expect(within(dialog).getByRole('heading', { name: PLAIN_MENU })).toBeInTheDocument();
    expect(
      within(dialog).getByText('구수한 재래식 된장으로 끓인 두부 된장찌개. 공기밥 포함.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('수량')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /장바구니에 담기/ })).toBeInTheDocument();
  });

  it('옵션이 없는 메뉴는 시트에 옵션 영역이 없다', async () => {
    renderOrderPage();
    await openMenuDetail(PLAIN_MENU);

    expect(within(sheet()).queryByRole('group')).not.toBeInTheDocument();
  });

  it('수량을 올리면 담기 버튼의 총액이 함께 오른다', async () => {
    renderOrderPage();
    await openMenuDetail(PLAIN_MENU);

    const dialog = sheet();
    expect(within(dialog).getByRole('button', { name: /장바구니에 담기/ })).toHaveTextContent(
      '8,000원',
    );

    await userEvent.click(within(dialog).getByRole('button', { name: '수량 늘리기' }));
    expect(within(dialog).getByRole('button', { name: /장바구니에 담기/ })).toHaveTextContent(
      '16,000원',
    );
  });

  it('수량이 1이면 줄이기 버튼이 비활성화된다', async () => {
    renderOrderPage();
    await openMenuDetail(PLAIN_MENU);

    expect(within(sheet()).getByRole('button', { name: '수량 줄이기' })).toBeDisabled();
  });

  it('옵션이 있는 메뉴는 필수 그룹이 미리 선택된 채로 열리고 옵션 금액이 총액에 반영된다', async () => {
    renderOrderPage();
    await openMenuDetail(OPTION_MENU);

    const dialog = sheet();
    expect(within(dialog).getByRole('radio', { name: /백미/ })).toBeChecked();

    await userEvent.click(within(dialog).getByRole('radio', { name: /잡곡밥/ }));
    expect(within(dialog).getByRole('button', { name: /장바구니에 담기/ })).toHaveTextContent(
      '12,500원',
    );
  });

  it('복수 선택 옵션은 여러 항목을 함께 고를 수 있다', async () => {
    renderOrderPage();
    await openMenuDetail(OPTION_MENU);

    const dialog = sheet();
    await userEvent.click(within(dialog).getByRole('checkbox', { name: /계란후라이/ }));
    await userEvent.click(within(dialog).getByRole('checkbox', { name: /치즈 토핑/ }));

    await userEvent.click(within(dialog).getByRole('checkbox', { name: /당면 사리/ }));
    expect(within(dialog).getByRole('checkbox', { name: /당면 사리/ })).toBeChecked();
    expect(within(dialog).getByRole('button', { name: /장바구니에 담기/ })).toHaveTextContent(
      '16,500원',
    );
  });

  it('담으면 시트가 닫히고 장바구니 바에 수량과 합계가 나온다', async () => {
    renderOrderPage();
    await openMenuDetail(PLAIN_MENU);

    await userEvent.click(within(sheet()).getByRole('button', { name: '수량 늘리기' }));
    await userEvent.click(within(sheet()).getByRole('button', { name: /장바구니에 담기/ }));

    expect(screen.getByRole('dialog')).toHaveClass('consumer-bottom-sheet--closing');
    expect(screen.getByText('16,000원')).toBeInTheDocument();
  });

  it('같은 메뉴라도 옵션 조합이 다르면 장바구니에 별도 줄로 담긴다', async () => {
    renderOrderPage();

    await openMenuDetail(OPTION_MENU);
    await userEvent.click(within(sheet()).getByRole('button', { name: /장바구니에 담기/ }));

    await openMenuDetail(OPTION_MENU);
    await userEvent.click(within(sheet()).getByRole('radio', { name: /잡곡밥/ }));
    await userEvent.click(within(sheet()).getByRole('button', { name: /장바구니에 담기/ }));

    await userEvent.click(screen.getByRole('button', { name: /개 담음/ }));

    const cartLines = within(sheet()).getAllByRole('listitem');
    expect(cartLines).toHaveLength(2);
    expect(cartLines[0]).toHaveTextContent('백미');
    expect(cartLines[1]).toHaveTextContent('잡곡밥');
  }, 10_000);

  it('다른 메뉴를 열면 이전 메뉴의 수량 선택이 남지 않는다', async () => {
    renderOrderPage();

    await openMenuDetail(PLAIN_MENU);
    await userEvent.click(within(sheet()).getByRole('button', { name: '수량 늘리기' }));
    await userEvent.keyboard('{Escape}');

    await openMenuDetail(OPTION_MENU);
    expect(within(sheet()).getByLabelText('선택한 수량')).toHaveTextContent('1');
  });

  it('수량형 옵션은 최대 수량과 옵션 가격을 상세 화면에 반영한다', async () => {
    renderOrderPage();
    await openMenuDetail('레몬에이드');

    const dialog = sheet();
    const increase = within(dialog).getByRole('button', { name: '에스프레소 샷 수량 늘리기' });
    await userEvent.click(increase);
    await userEvent.click(increase);

    expect(increase).toBeDisabled();
    expect(within(dialog).getByLabelText('에스프레소 샷 선택 수량')).toHaveTextContent('2');
    expect(within(dialog).getByRole('button', { name: /장바구니에 담기/ })).toHaveTextContent(
      '5,500원',
    );
  });
});

describe('ConsumerOrderPage 주문 API', () => {
  it('submits the server request and clears the cart only after success', async () => {
    let requestBody: Record<string, unknown> | undefined;
    server.use(
      http.post('/api/client/consumer/orders', async ({ request }) => {
        requestBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          success: true,
          data: {
            orderId: 'order-001',
            orderNo: '0001',
            status: 'RECEIVED',
            totalAmount: 8_000,
            orderedAt: '2026-09-01 12:00:00',
          },
        });
      }),
    );

    renderOrderPage();
    await addPlainMenuToCart();
    await userEvent.click(within(sheet()).getByRole('button', { name: '주문하기' }));

    expect(await screen.findByText('주문 완료')).toBeInTheDocument();
    expect(requestBody).toMatchObject({
      items: [{ menuSysId: 'menu-3', quantity: 1, options: [] }],
    });
    expect(requestBody).not.toHaveProperty('requestNote');
    expect(screen.queryByRole('button', { name: /개 담음/ })).not.toBeInTheDocument();
  });

  it('keeps the cart and disables ordering when the server races with table deactivation', async () => {
    let orderingAllowed = true;
    server.use(
      http.get('/api/client/consumer/session', () =>
        HttpResponse.json({
          success: true,
          data: {
            consumerSessionId: 'visit-001',
            status: 'ACTIVE',
            sysPlantCd: 'ADMIN',
            storeName: '테스트 매장',
            tableSysId: 'table-001',
            tableName: '1번 테이블',
            tableNum: 1,
            tableQty: 4,
            orderingAllowed,
            orderingBlockedReason: orderingAllowed ? null : 'TABLE_INACTIVE',
            startedAt: '2026-09-01 09:00:00',
          },
        }),
      ),
      http.post('/api/client/consumer/orders', () => {
        orderingAllowed = false;
        return HttpResponse.json(
          { success: false, message: '주문할 수 없는 테이블입니다.', error: 'TABLE_INACTIVE' },
          { status: 409 },
        );
      }),
    );

    renderOrderPage();
    await addPlainMenuToCart();
    await userEvent.click(within(sheet()).getByRole('button', { name: '주문하기' }));

    expect(await within(sheet()).findByText(/장바구니는 그대로 보관됩니다/)).toBeInTheDocument();
    expect(within(sheet()).getByText(PLAIN_MENU)).toBeInTheDocument();
    expect(within(sheet()).getByRole('button', { name: '주문하기' })).toBeDisabled();
  });
});
