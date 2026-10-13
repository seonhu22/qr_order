import { useQueryClient } from '@tanstack/react-query';
import {
  useGetOrderRevisionCatalog,
  useReviseClientOrder,
} from '@/generated/order-manage-controller/order-manage-controller';
import type { OrderRevisionRequest } from '@/generated/types/orderRevisionRequest';
import type { OrderRevisionCatalogEnvelope } from '@/generated/types/orderRevisionCatalogEnvelope';
import { queryKeys } from '@/shared/api/queryKeys';
import type { MenuCatalogItem, OrderBoardRow } from '../types';

export class OrderRevisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderRevisionError';
  }
}

export function mapOrderRevisionCatalog(data: OrderRevisionCatalogEnvelope): MenuCatalogItem[] {
  return (data?.data.categories ?? []).flatMap((category) =>
    category.menus.map((menu) => ({
      id: `catalog-menu-${menu.menuSysId}`,
      sourceSysId: menu.menuSysId,
      name: menu.menuName,
      unitPrice: menu.menuPrice,
      category: category.categoryName,
      soldOut: menu.soldOutYn === 'Y',
      optionCategories: menu.optionGroups.map((group) => ({
        category: group.groupName,
        sourceSysId: group.optionGroupSysId,
        selectionType:
          group.selectionType === '01' ? 'single' : group.selectionType === '02' ? 'checkbox' : 'stepper',
        required: group.requiredYn === 'Y',
        options: group.options.map((option) => ({
          id: `catalog-option-${option.menuOptionSysId}`,
          sourceSysId: option.menuOptionSysId,
          name: option.menuOptionName,
          unitPrice: option.menuOptionPrice,
          maximumNum: option.maximumNum,
          defaultSelected: option.defaultYn === 'Y',
          soldOut: option.soldOutYn === 'Y',
        })),
      })),
    })),
  );
}

export function buildOrderRevisionRequest(
  clientRequestId: string,
  originalOrders: OrderBoardRow[],
  finalizedOrders: OrderBoardRow[],
): OrderRevisionRequest {
  const originalOrderIds = new Set(originalOrders.map((order) => order.id));
  const retainedDetailIds = new Set(
    finalizedOrders
      .filter((order) => originalOrderIds.has(order.id))
      .flatMap((order) => order.menuItems.map((item) => item.sourceSysId ?? item.id)),
  );
  const removeDetailIds = originalOrders
    .flatMap((order) => order.menuItems.map((item) => item.sourceSysId ?? item.id))
    .filter((id) => !retainedDetailIds.has(id))
    .sort();
  const addedItems = finalizedOrders
    .filter((order) => !originalOrderIds.has(order.id))
    .flatMap((order) => order.menuItems)
    .map((item) => ({
      menuSysId: item.sourceSysId ?? '',
      quantity: item.quantity,
      options: item.options
        .map((option) => ({ optionSysId: option.sourceSysId ?? '', quantity: option.quantity }))
        .sort((a, b) => a.optionSysId.localeCompare(b.optionSysId)),
    }))
    .sort((a, b) => a.menuSysId.localeCompare(b.menuSysId));

  if (addedItems.some((item) => !item.menuSysId || item.options?.some((option) => !option.optionSysId))) {
    throw new OrderRevisionError('추가 메뉴의 서버 식별자를 확인하지 못했습니다. 카탈로그를 다시 불러와주세요.');
  }

  return {
    clientRequestId,
    orderGroupIds: originalOrders.map((order) => order.sourceSysId ?? order.id).sort(),
    removeDetailIds,
    addedItems,
  };
}

export function useOrderRevisionCatalogQuery() {
  return useGetOrderRevisionCatalog({
    query: {
      queryKey: queryKeys.orderRevision.catalog,
      select: mapOrderRevisionCatalog,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  });
}

export function useOrderRevisionMutation() {
  const queryClient = useQueryClient();
  const mutation = useReviseClientOrder();

  const save = async (request: OrderRevisionRequest) => {
    const response = await mutation.mutateAsync({ data: request });
    if (!response.success) {
      throw new OrderRevisionError(response.message || response.error || '주문 수정 저장에 실패했습니다.');
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.orderStatusBoard.lists, refetchType: 'none' });
    await queryClient.refetchQueries({ queryKey: queryKeys.orderStatusBoard.lists, type: 'active' });
  };

  return { save, isPending: mutation.isPending };
}
