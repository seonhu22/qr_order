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
 * - 옵션 추가 모달의 옵션 카테고리는 두 가지다. `single`(예: 맵기 조절)은 카테고리 내에서 정확히 1개를 필수로
 *   선택하며, 옵션 추가 모달을 열 때 각 single 카테고리의 첫 옵션을 기본 선택해둔다. `multi`(예: 추가옵션)는
 *   옵션별로 수량을 따로 선택하고(0개면 미선택), 메뉴 자체의 수량("주문 수량")과는 별개다.
 * - 주문 수정/메뉴 추가/옵션 추가 3단계 모두 변경 내용이 있는 상태에서 닫으려 하면(닫기 버튼/ESC/배경 클릭)
 *   `docs/components/Modal.md` #11 패턴과 동일하게 "페이지를 나가시겠습니까?" 경고를 먼저 띄운다 — `close*`는
 *   dirty면 경고만 열고, 경고의 "확인"(`forceClose*`)을 눌러야 실제로 닫힌다. "확인"/"추가" 버튼으로 정상
 *   진행할 때는 항상 `forceClose*`를 직접 불러 경고 없이 닫는다.
 */

import { useState } from 'react';
import { MENU_CATALOG_MOCK } from '../mock/menuCatalogMock';
import { nowOrderBoardDatetime } from '../utils';
import type { OrderBoardMenuItem, OrderBoardRow } from '../types';
import { cloneOrderBoardRow } from '../utils/orderBoardSnapshot';

type OptionPickerState = {
  catalogMenuId: string;
  /** 같은 옵션 조합으로 추가할 메뉴 수량("주문 수량" 박스) */
  quantity: number;
  /** single 카테고리에서 선택된 옵션 id(카테고리당 정확히 1개) */
  selectedOptionIds: string[];
  /** multi 카테고리 옵션별 선택 수량(옵션 id → 수량, 0이면 미선택) */
  optionQuantities: Record<string, number>;
};

type UseOrderEditModalFlowParams = {
  onConfirmEdit: (originalOrderIds: string[], finalizedOrders: OrderBoardRow[]) => void;
};

const EMPTY_OPTION_PICKER: OptionPickerState = {
  catalogMenuId: '',
  quantity: 1,
  selectedOptionIds: [],
  optionQuantities: {},
};

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

  /** 이탈방지(dirty 비교) 기준 — 각 단계를 열 때의 스냅샷과 현재 값을 비교한다. */
  const [initialDraftOrdersSnapshot, setInitialDraftOrdersSnapshot] = useState('');
  const [initialOptionPickerSnapshot, setInitialOptionPickerSnapshot] = useState('');
  const [isEditorDirtyWarningOpen, setIsEditorDirtyWarningOpen] = useState(false);
  const [isMenuPickerDirtyWarningOpen, setIsMenuPickerDirtyWarningOpen] = useState(false);
  const [isOptionPickerDirtyWarningOpen, setIsOptionPickerDirtyWarningOpen] = useState(false);

  const isEditorDirty = isEditorOpen && JSON.stringify(draftOrders) !== initialDraftOrdersSnapshot;
  /** 미리보기에 무엇이라도 모여 있으면 닫을 때 잃을 변경이 있는 상태다. */
  const isMenuPickerDirty = isMenuPickerOpen && addedItems.length > 0;
  const isOptionPickerDirty = isOptionPickerOpen && JSON.stringify(optionPicker) !== initialOptionPickerSnapshot;

  const resetAll = () => {
    setTableNum('');
    setOriginalOrderIds([]);
    setDraftOrders([]);
    setAddedItems([]);
    setOptionPicker(EMPTY_OPTION_PICKER);
    setInitialDraftOrdersSnapshot('');
    setInitialOptionPickerSnapshot('');
  };

  const openEditModal = (initialOrders: OrderBoardRow[]) => {
    const clonedOrders = initialOrders.map(cloneOrderBoardRow);
    setTableNum(initialOrders[0]?.tableNum ?? '');
    setOriginalOrderIds(initialOrders.map((order) => order.id));
    setDraftOrders(clonedOrders);
    setInitialDraftOrdersSnapshot(JSON.stringify(clonedOrders));
    setIsEditorOpen(true);
  };

  /** 경고 없이 바로 닫는다 — "확인"으로 정상 진행할 때만 직접 호출한다. */
  const forceCloseEditor = () => {
    setIsEditorOpen(false);
    setIsMenuPickerOpen(false);
    setIsOptionPickerOpen(false);
    setIsConfirmOpen(false);
    setIsEditorDirtyWarningOpen(false);
    setIsMenuPickerDirtyWarningOpen(false);
    setIsOptionPickerDirtyWarningOpen(false);
    resetAll();
  };

  /** 닫기 버튼/ESC/배경 클릭 — dirty면 경고 모달을 먼저 띄운다. */
  const closeEditor = () => {
    if (isEditorDirty) {
      setIsEditorDirtyWarningOpen(true);
      return;
    }
    forceCloseEditor();
  };

  const closeEditorDirtyWarning = () => setIsEditorDirtyWarningOpen(false);

  const cancelMenuLine = (orderId: string, menuId: string) => {
    setDraftOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              totalPrice: undefined,
              menuItems: order.menuItems.filter((menu) => menu.id !== menuId),
            }
          : order,
      ),
    );
  };

  const openMenuPicker = () => {
    setAddedItems([]);
    setOptionPicker(EMPTY_OPTION_PICKER);
    setIsMenuPickerOpen(true);
  };

  /** 경고 없이 바로 닫는다 — "확인"으로 정상 진행할 때만 직접 호출한다. */
  const forceCloseMenuPicker = () => {
    setIsMenuPickerOpen(false);
    setIsOptionPickerOpen(false);
    setAddedItems([]);
    setOptionPicker(EMPTY_OPTION_PICKER);
    setIsMenuPickerDirtyWarningOpen(false);
    setIsOptionPickerDirtyWarningOpen(false);
  };

  /** 닫기 버튼/ESC/배경 클릭 — 추가된 항목이 있으면(dirty) 경고 모달을 먼저 띄운다. */
  const closeMenuPicker = () => {
    if (isMenuPickerDirty) {
      setIsMenuPickerDirtyWarningOpen(true);
      return;
    }
    forceCloseMenuPicker();
  };

  const closeMenuPickerDirtyWarning = () => setIsMenuPickerDirtyWarningOpen(false);

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

  /** 옵션이 있는 메뉴는 옵션 추가 모달을 한 단계 더 연다. single 카테고리는 필수 선택이라 첫 옵션을 기본 선택해둔다. */
  const clickAddCatalogMenu = (catalogMenuId: string) => {
    const catalogMenu = MENU_CATALOG_MOCK.find((menu) => menu.id === catalogMenuId);
    if (!catalogMenu) return;

    if (catalogMenu.optionCategories.length === 0) {
      addSimpleCatalogMenu(catalogMenuId);
      return;
    }

    const defaultSelectedOptionIds = catalogMenu.optionCategories
      .filter((group) => group.selectionType === 'single')
      .map((group) => group.options[0]?.id)
      .filter((id): id is string => Boolean(id));

    const nextOptionPicker: OptionPickerState = {
      catalogMenuId,
      quantity: 1,
      selectedOptionIds: defaultSelectedOptionIds,
      optionQuantities: {},
    };
    setOptionPicker(nextOptionPicker);
    setInitialOptionPickerSnapshot(JSON.stringify(nextOptionPicker));
    setIsOptionPickerOpen(true);
  };

  /** 경고 없이 바로 닫는다 — "확인"으로 정상 진행할 때만 직접 호출한다. */
  const forceCloseOptionPicker = () => {
    setIsOptionPickerOpen(false);
    setOptionPicker(EMPTY_OPTION_PICKER);
    setIsOptionPickerDirtyWarningOpen(false);
  };

  /** 닫기 버튼/ESC/배경 클릭 — 기본 선택에서 바뀐 내용이 있으면(dirty) 경고 모달을 먼저 띄운다. */
  const closeOptionPicker = () => {
    if (isOptionPickerDirty) {
      setIsOptionPickerDirtyWarningOpen(true);
      return;
    }
    forceCloseOptionPicker();
  };

  const closeOptionPickerDirtyWarning = () => setIsOptionPickerDirtyWarningOpen(false);

  const changeOptionPickerQuantity = (quantity: number) => {
    setOptionPicker((prev) => ({ ...prev, quantity: Math.max(1, quantity) }));
  };

  /** single 카테고리는 필수 라디오 동작이라, 같은 카테고리의 다른 선택을 이 옵션으로 교체한다. */
  const selectOptionPickerSingle = (categoryOptionIds: string[], optionId: string) => {
    setOptionPicker((prev) => ({
      ...prev,
      selectedOptionIds: [...prev.selectedOptionIds.filter((id) => !categoryOptionIds.includes(id)), optionId],
    }));
  };

  /** multi 카테고리는 옵션별로 수량을 따로 선택한다(0 미만으로는 내려가지 않음). */
  const changeOptionPickerOptionQuantity = (optionId: string, quantity: number) => {
    setOptionPicker((prev) => ({
      ...prev,
      optionQuantities: { ...prev.optionQuantities, [optionId]: Math.max(0, quantity) },
    }));
  };

  /** 옵션을 고른 메뉴는 (같은 메뉴라도) 항상 새 줄로 추가한다 — 옵션 조합이 다를 수 있어 합치지 않는다. */
  const confirmOptionPicker = () => {
    const catalogMenu = MENU_CATALOG_MOCK.find((menu) => menu.id === optionPicker.catalogMenuId);
    if (!catalogMenu) return;

    const catalogOptions = catalogMenu.optionCategories.flatMap((group) => group.options);
    const selectedOptions = catalogOptions.filter(
      (option) =>
        optionPicker.selectedOptionIds.includes(option.id) || (optionPicker.optionQuantities[option.id] ?? 0) > 0,
    );

    const menuItem: OrderBoardMenuItem = {
      id: `${catalogMenu.id}-${Date.now()}`,
      name: catalogMenu.name,
      quantity: optionPicker.quantity,
      unitPrice: catalogMenu.unitPrice,
      options: selectedOptions.map((option) => ({
        id: `${option.id}-${Date.now()}`,
        name: option.name,
        quantity: optionPicker.optionQuantities[option.id] ?? 1,
        unitPrice: option.unitPrice,
      })),
    };

    setAddedItems((prev) => [...prev, menuItem]);
    forceCloseOptionPicker();
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
    forceCloseMenuPicker();
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
    /** 페이지 차원의 새로고침/탭 닫기 경고(`usePreventLeave`)에 합쳐 쓰는 3단계 dirty 상태. */
    isEditorDirty,
    isMenuPickerDirty,
    isOptionPickerDirty,
    /** 변경 내용 경고 모달(`SimpleDefaultModal`, "페이지를 나가시겠습니까?") open 상태 — 3단계 각각 따로 관리한다. */
    isEditorDirtyWarningOpen,
    isMenuPickerDirtyWarningOpen,
    isOptionPickerDirtyWarningOpen,
    openEditModal,
    closeEditor,
    forceCloseEditor,
    closeEditorDirtyWarning,
    cancelMenuLine,
    openMenuPicker,
    closeMenuPicker,
    forceCloseMenuPicker,
    closeMenuPickerDirtyWarning,
    clickAddCatalogMenu,
    cancelAddedItem,
    closeOptionPicker,
    forceCloseOptionPicker,
    closeOptionPickerDirtyWarning,
    changeOptionPickerQuantity,
    selectOptionPickerSingle,
    changeOptionPickerOptionQuantity,
    confirmOptionPicker,
    confirmMenuPicker,
    requestConfirm,
    closeConfirm,
    confirmSave,
    closeNotice,
  };
}
