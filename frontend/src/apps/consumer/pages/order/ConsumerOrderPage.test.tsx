import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useConsumerOrderFilterStore } from '@/apps/consumer/stores/consumerOrderFilterStore';
import { useConsumerSheetStore } from '@/apps/consumer/stores/consumerSheetStore';
import { ConsumerOrderPage } from './ConsumerOrderPage';

/** 옵션이 없는 메뉴(디자인 기준 화면)와 옵션이 있는 메뉴 각각의 mock 이름. */
const PLAIN_MENU = '된장찌개';
const OPTION_MENU = '불고기 정식';

function openMenuDetail(menuName: string) {
  return userEvent.click(screen.getByRole('button', { name: new RegExp(menuName) }));
}

function sheet() {
  return screen.getByRole('dialog');
}

beforeEach(() => {
  useConsumerSheetStore.setState({ sheet: null });
  useConsumerOrderFilterStore.setState({ searchQuery: '', selectedCategory: '전체' });
});

describe('ConsumerOrderPage 메뉴 상세 시트', () => {
  it('메뉴 카드를 누르면 이름·가격·설명·수량·담기 버튼이 있는 시트가 열린다', async () => {
    render(<ConsumerOrderPage />);
    await openMenuDetail(PLAIN_MENU);

    const dialog = sheet();
    expect(within(dialog).getByRole('heading', { name: PLAIN_MENU })).toBeInTheDocument();
    expect(within(dialog).getByText('구수한 재래식 된장으로 끓인 두부 된장찌개. 공기밥 포함.'))
      .toBeInTheDocument();
    expect(within(dialog).getByText('수량')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /장바구니에 담기/ })).toBeInTheDocument();
  });

  it('옵션이 없는 메뉴는 시트에 옵션 영역이 없다', async () => {
    render(<ConsumerOrderPage />);
    await openMenuDetail(PLAIN_MENU);

    expect(within(sheet()).queryByRole('group')).not.toBeInTheDocument();
  });

  it('수량을 올리면 담기 버튼의 총액이 함께 오른다', async () => {
    render(<ConsumerOrderPage />);
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
    render(<ConsumerOrderPage />);
    await openMenuDetail(PLAIN_MENU);

    expect(within(sheet()).getByRole('button', { name: '수량 줄이기' })).toBeDisabled();
  });

  it('옵션이 있는 메뉴는 필수 그룹이 미리 선택된 채로 열리고 옵션 금액이 총액에 반영된다', async () => {
    render(<ConsumerOrderPage />);
    await openMenuDetail(OPTION_MENU);

    const dialog = sheet();
    expect(within(dialog).getByRole('radio', { name: /백미/ })).toBeChecked();

    await userEvent.click(within(dialog).getByRole('radio', { name: /잡곡밥/ }));
    expect(within(dialog).getByRole('button', { name: /장바구니에 담기/ })).toHaveTextContent(
      '12,500원',
    );
  });

  it('복수 선택 옵션은 상한까지만 고를 수 있다', async () => {
    render(<ConsumerOrderPage />);
    await openMenuDetail(OPTION_MENU);

    const dialog = sheet();
    await userEvent.click(within(dialog).getByRole('checkbox', { name: /계란후라이/ }));
    await userEvent.click(within(dialog).getByRole('checkbox', { name: /치즈 토핑/ }));

    expect(within(dialog).getByRole('checkbox', { name: /당면 사리/ })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: /장바구니에 담기/ })).toHaveTextContent(
      '14,500원',
    );
  });

  it('담으면 시트가 닫히고 장바구니 바에 수량과 합계가 나온다', async () => {
    render(<ConsumerOrderPage />);
    await openMenuDetail(PLAIN_MENU);

    await userEvent.click(within(sheet()).getByRole('button', { name: '수량 늘리기' }));
    await userEvent.click(within(sheet()).getByRole('button', { name: /장바구니에 담기/ }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('16,000원')).toBeInTheDocument();
  });

  it('같은 메뉴라도 옵션 조합이 다르면 장바구니에 별도 줄로 담긴다', async () => {
    render(<ConsumerOrderPage />);

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
  });

  it('다른 메뉴를 열면 이전 메뉴의 수량 선택이 남지 않는다', async () => {
    render(<ConsumerOrderPage />);

    await openMenuDetail(PLAIN_MENU);
    await userEvent.click(within(sheet()).getByRole('button', { name: '수량 늘리기' }));
    await userEvent.keyboard('{Escape}');

    await openMenuDetail(OPTION_MENU);
    expect(within(sheet()).getByLabelText('선택한 수량')).toHaveTextContent('1');
  });
});
