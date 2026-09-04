import { afterEach, describe, expect, it, vi } from 'vitest';
import { createConsumerOrder } from '@/generated/consumer-order-controller/consumer-order-controller';
import { HttpError } from '@/shared/lib/httpClient';
import {
  buildConsumerOrderRequest,
  CONSUMER_ORDER_REQUEST_TIMEOUT_MS,
  isTableInactiveError,
  mapOrderCreated,
  submitConsumerOrder,
} from './consumerOrderApi';

vi.mock('@/generated/consumer-order-controller/consumer-order-controller', async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import('@/generated/consumer-order-controller/consumer-order-controller')
    >();

  return {
    ...original,
    createConsumerOrder: vi.fn(),
  };
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('consumerOrderApi', () => {
  it('maps cart menu/options and omits requestNote', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001');

    expect(
      buildConsumerOrderRequest(
        [
          {
            cartKey: 'menu-1:option-1',
            menuId: 'menu-1',
            name: '메뉴',
            price: 10_000,
            qty: 2,
            options: [
              {
                groupId: 'group-1',
                groupName: '옵션',
                choiceId: 'option-1',
                choiceName: '선택',
                price: 500,
                qty: 2,
              },
            ],
          },
        ],
        '00000000-0000-4000-8000-000000000001',
      ),
    ).toEqual({
      clientRequestId: '00000000-0000-4000-8000-000000000001',
      items: [
        {
          menuSysId: 'menu-1',
          quantity: 2,
          options: [{ optionSysId: 'option-1', quantity: 2 }],
        },
      ],
    });
  });

  it('maps order create response to camelCase record with parsed date', () => {
    expect(
      mapOrderCreated({
        orderId: 'order-1',
        orderNo: 'A-0032',
        status: 'RECEIVED',
        totalAmount: 21_000,
        orderedAt: '2026-09-03 12:34:56',
      }),
    ).toEqual({
      orderId: 'order-1',
      orderNo: 'A-0032',
      orderStatus: 'RECEIVED',
      total: 21_000,
      orderedAt: new Date('2026-09-03T12:34:56'),
    });
  });

  it('recognizes only the stable TABLE_INACTIVE 409 code', () => {
    const response = new Response(null, { status: 409, statusText: 'Conflict' });
    expect(
      isTableInactiveError(
        new HttpError('주문 불가', response, '/api/client/consumer/orders', {
          error: 'TABLE_INACTIVE',
        }),
      ),
    ).toBe(true);
    expect(isTableInactiveError(new HttpError('품절', response, '/orders', {}))).toBe(false);
  });

  it('aborts an order request after 15 seconds', async () => {
    vi.useFakeTimers();
    const createOrderMock = vi.mocked(createConsumerOrder);
    createOrderMock.mockImplementation((_request, _options, signal) => {
      return new Promise((_resolve, reject) => {
        signal?.addEventListener(
          'abort',
          () => reject(new DOMException('The operation was aborted.', 'AbortError')),
          { once: true },
        );
      });
    });

    const orderPromise = submitConsumerOrder(
      [],
      '00000000-0000-4000-8000-000000000001',
    );
    const rejection = expect(orderPromise).rejects.toMatchObject({ name: 'AbortError' });

    await vi.advanceTimersByTimeAsync(CONSUMER_ORDER_REQUEST_TIMEOUT_MS);

    await rejection;
    expect(createOrderMock.mock.calls[0]?.[2]).toMatchObject({ aborted: true });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears the timeout when an order succeeds before the limit', async () => {
    vi.useFakeTimers();
    vi.mocked(createConsumerOrder).mockResolvedValue({
      success: true,
      data: {
        orderId: 'order-001',
        orderNo: '0001',
        status: 'RECEIVED',
        totalAmount: 12_000,
        orderedAt: '2026-09-03 22:31:28',
      },
    });

    await submitConsumerOrder([], '00000000-0000-4000-8000-000000000001');

    expect(vi.getTimerCount()).toBe(0);
  });
});
