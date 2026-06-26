/**
 * @fileoverview 주문 수정 모달 흐름 훅
 *
 * @description
 * - 같은 테이블의 진행 중인 주문(접수/조리중/서빙완료, 취소·결제완료 제외)을 전부 모아 한 모달에서 수정한다.
 * - 모든 변경(메뉴 줄 취소, 메뉴 추가)은 모달 내부의 draft 상태에만 반영된다. "확인"을 누르면
 *   취소 흐름과 같은 모양의 확인 단계("주문수정 하시겠습니까?")가 한 번 더 뜨고, 거기서 "확인"을 눌러야
 *   실제 보드 데이터(`onConfirmEdit`)에 반영되고 완료 안내("저장되었습니다.")가 뜬다.
 *   확인 단계의 "닫기"는 그 단계만 닫고 수정 모달(draft)은 그대로 열려 있는다. 수정 모달의 "닫기"는 draft를 버리고 그대로 닫는다.
 * - 메뉴 줄을 전부 취소해 메뉴가 0개가 된 주문은 최종 확인 시점에 자동으로 취소(`CANCELLED`) 처리한다.
 * - "메뉴 추가"는 기존 주문에 끼워 넣지 않고, 그 테이블의 새 주문(새 티켓)으로 추가한다 — 이미 조리/서빙
 *   중인 주문 내용을 건드리지 않기 위함이다.
 * - 메뉴 추가 모달은 카탈로그 목록 + "추가된 항목" 미리보기로 구성된다. 옵션이 없는 메뉴는 "추가" 클릭 즉시
 *   미리보기에 들어가고(같은 메뉴를 또 누르면 수량만 +1), 옵션이 있는 메뉴는 옵션 추가 모달이 한 단계 더 뜬다.
 *   미리보기에서 여러 메뉴를 모은 뒤 "확인"을 눌러야 그 메뉴들을 합친 새 주문 1건이 draft에 추가된다.
 */

import { useState } from 'react';
import { MENU_CATALOG_MOCK } from '../mock/menuCatalogMock';
import { nowOrderBoardDatetime } from '../utils';
import type { OrderBoardMenuItem, OrderBoardRow } from '../types';

type OptionPickerState = {
  catalogMenuId: string;
  quantity: number;
  selectedOptionIds: string[];
};

type UseOrderEditModalFlowParams = {
  onConfirmEdit: (originalOrderIds: string[], finalizedOrders: OrderBoardRow[]) => void;
};

const EMPTY_OPTION_PICKER: OptionPickerState = { catalogMenuId: '', quantity: 1, selectedOptionIds: [] };

function cloneOrder(order: OrderBoardRow): OrderBoardRow {
  return {
    ...order,
    menuItems: order.menuItems.map((menu) => ({
      ...menu,
      options: menu.options.map((option) => ({ ...option })),
    })),
  };
}

function createDraftOrderId(): string {
  return `edit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** mock 한정 임시 주문번호. 실제 연동 시 백엔드가 발급한 주문번호로 교체한다. */
function createDraftOrderNo(): string {
  return Math.floor(1000 + Math.random() * 9000).toString().padStart(4, '0');
}

export function useOrderEditModalFlow({ onConfirmEdit }: UseOrderEditModalFlowParams) {
  const [tableNum, setTableNum] = useState('');
  const [originalOrderIds, setOriginalOrderIds] = useState<string[]>([]);
  const [draftOrders, setDraftOrders] = useState<OrderBoardRow[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isMenuPickerOpen, setIsMenuPickerOpen] = useState(false);
  const [isOptionPickerOpen, setIsOptionPickerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  /** 메뉴 추가 모달의 "추가된 항목" 미리보기. "확인"을 눌러야 새 주문 1건으로 합쳐져 draftOrders에 들어간다. */
  const [addedItems, setAddedItems] = useState<OrderBoardMenuItem[]>([]);
  const [optionPicker, setOptionPicker] = useState<OptionPickerState>(EMPTY_OPTION_PICKER);

  const resetAll = () => {
    setTableNum('');
    setOriginalOrderIds([]);
    setDraftOrders([]);
    setAddedItems([]);
    setOptionPicker(EMPTY_OPTION_PICKER);
  };

  const openEditModal = (initialOrders: OrderBoardRow[]) => {
    setTableNum(initialOrders[0]?.tableNum ?? '');
    setOriginalOrderIds(initialOrders.map((order) => order.id));
    setDraftOrders(initialOrders.map(cloneOrder));
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setIsMenuPickerOpen(false);
    setIsOptionPickerOpen(false);
    setIsConfirmOpen(false);
    resetAll();
  };

  const cancelMenuLine = (orderId: string, menuId: string) => {
    setDraftOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, menuItems: order.menuItems.filter((menu) => menu.id !== menuId) }
          : order,
      ),
    );
  };

  const openMenuPicker = () => {
    setAddedItems([]);
    setOptionPicker(EMPTY_OPTION_PICKER);
    setIsMenuPickerOpen(true);
  };

  const closeMenuPicker = () => {
    setIsMenuPickerOpen(false);
    setIsOptionPickerOpen(false);
    setAddedItems([]);
    setOptionPicker(EMPTY_OPTION_PICKER);
  };

  /** 옵션이 없는 메뉴는 즉시 추가한다. 이미 추가된(옵션 없는) 같은 메뉴면 수량만 +1 한다. */
  const addSimpleCatalogMenu = (catalogMenuId: string) => {
    const catalogMenu = MENU_CATALOG_MOCK.find((menu) => menu.id === catalogMenuId);
    if (!catalogMenu) return;

    setAddedItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.name === catalogMenu.name && item.options.length === 0,
      );
      if (existingIndex >= 0) {
        return prev.map((item, index) =>
          index === existingIndex ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [
        ...prev,
        {
          id: `${catalogMenu.id}-${Date.now()}`,
          name: catalogMenu.name,
          quantity: 1,
          unitPrice: catalogMenu.unitPrice,
          options: [],
        },
      ];
    });
  };

  /** 옵션이 있는 메뉴는 옵션 추가 모달을 한 단계 더 연다. */
  const clickAddCatalogMenu = (catalogMenuId: string) => {
    const catalogMenu = MENU_CATALOG_MOCK.find((menu) => menu.id === catalogMenuId);
    if (!catalogMenu) return;

    if (catalogMenu.options.length === 0) {
      addSimpleCatalogMenu(catalogMenuId);
      return;
    }

    setOptionPicker({ catalogMenuId, quantity: 1, selectedOptionIds: [] });
    setIsOptionPickerOpen(true);
  };

  const closeOptionPicker = () => {
    setIsOptionPickerOpen(false);
    setOptionPicker(EMPTY_OPTION_PICKER);
  };

  const changeOptionPickerQuantity = (quantity: number) => {
    setOptionPicker((prev) => ({ ...prev, quantity: Math.max(1, quantity) }));
  };

  const toggleOptionPickerOption = (optionId: string, checked: boolean) => {
    setOptionPicker((prev) => ({
      ...prev,
      selectedOptionIds: checked
        ? [...prev.selectedOptionIds, optionId]
        : prev.selectedOptionIds.filter((id) => id !== optionId),
    }));
  };

  /** 옵션을 고른 메뉴는 (같은 메뉴라도) 항상 새 줄로 추가한다 — 옵션 조합이 다를 수 있어 합치지 않는다. */
  const confirmOptionPicker = () => {
    const catalogMenu = MENU_CATALOG_MOCK.find((menu) => menu.id === optionPicker.catalogMenuId);
    if (!catalogMenu) return;

    const menuItem: OrderBoardMenuItem = {
      id: `${catalogMenu.id}-${Date.now()}`,
      name: catalogMenu.name,
      quantity: optionPicker.quantity,
      unitPrice: catalogMenu.unitPrice,
      options: catalogMenu.options
        .filter((option) => optionPicker.selectedOptionIds.includes(option.id))
        .map((option) => ({ id: `${option.id}-${Date.now()}`, name: option.name, quantity: 1, unitPrice: option.unitPrice })),
    };

    setAddedItems((prev) => [...prev, menuItem]);
    closeOptionPicker();
  };

  const cancelAddedItem = (itemId: string) => {
    setAddedItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  /** "추가된 항목"을 합친 새 주문 1건을 draft에 추가하고 메뉴 추가 모달을 닫는다. */
  const confirmMenuPicker = () => {
    if (addedItems.length > 0) {
      const newOrder: OrderBoardRow = {
        id: createDraftOrderId(),
        orderNo: createDraftOrderNo(),
        tableNum,
        orderStatus: 'RECEIVED',
        paymentStatus: 'PENDING',
        orderDatetime: nowOrderBoardDatetime(),
        menuItems: addedItems,
      };
      setDraftOrders((prev) => [...prev, newOrder]);
    }
    closeMenuPicker();
  };

  const requestConfirm = () => {
    setIsConfirmOpen(true);
  };

  const closeConfirm = () => {
    setIsConfirmOpen(false);
  };

  const confirmSave = () => {
    const finalizedOrders = draftOrders.map((order) =>
      order.menuItems.length === 0
        ? { ...order, orderStatus: 'CANCELLED' as const, cancelledAt: nowOrderBoardDatetime() }
        : order,
    );
    onConfirmEdit(originalOrderIds, finalizedOrders);
    setIsConfirmOpen(false);
    setIsEditorOpen(false);
    resetAll();
    setIsNoticeOpen(true);
  };

  const closeNotice = () => {
    setIsNoticeOpen(false);
    resetAll();
  };

  return {
    tableNum,
    draftOrders,
    /** "메뉴 추가"로 새로 생긴 주문(원래 수정 대상이 아니었던 주문)을 화면에서 구분해 보여줄 때 쓴다. */
    originalOrderIds,
    isEditorOpen,
    isMenuPickerOpen,
    isOptionPickerOpen,
    isConfirmOpen,
    isNoticeOpen,
    addedItems,
    optionPicker,
    openEditModal,
    closeEditor,
    cancelMenuLine,
    openMenuPicker,
    closeMenuPicker,
    clickAddCatalogMenu,
    cancelAddedItem,
    closeOptionPicker,
    changeOptionPickerQuantity,
    toggleOptionPickerOption,
    confirmOptionPicker,
    confirmMenuPicker,
    requestConfirm,
    closeConfirm,
    confirmSave,
    closeNotice,
  };
}
