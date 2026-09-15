import { useMemo, useState } from 'react';
import { calcUnitPrice } from '../cartLine';
import type {
  OrderShellCartOption,
  OrderShellMenuItem,
  OrderShellOptionChoice,
  OrderShellOptionGroup,
} from '../types';

export const MIN_MENU_QTY = 1;
export const MAX_MENU_QTY = 99;

/** 그룹 id → 항목 id → 선택 수량. 일반 선택형은 0 또는 1을 사용한다. */
type SelectedChoiceMap = Record<string, Record<string, number>>;

/** `${groupId}__${choiceId}` → 복수 선택 항목의 개수. 단일 선택 그룹은 쓰지 않는다. */
type ChoiceQtyMap = Record<string, number>;

function choiceQtyKey(groupId: string, choiceId: string) {
  return `${groupId}__${choiceId}`;
}

/**
 * 옵션 그룹의 기본 선택값. 단일 선택 + 필수 그룹은 첫 항목을 미리 골라둬야
 * 사용자가 아무것도 건드리지 않아도 담기가 가능하다(백엔드 `defaultYn` 대응 자리).
 */
function buildInitialSelection(
  optionGroups: OrderShellOptionGroup[],
  runtimeSoldoutOptionChoiceIds: Set<string>,
): SelectedChoiceMap {
  const initial: SelectedChoiceMap = {};

  for (const group of optionGroups) {
    const isSelectable = (choice: OrderShellOptionChoice) =>
      !choice.soldOut && !runtimeSoldoutOptionChoiceIds.has(choice.id);
    const firstAvailable = group.choices.find(isSelectable);
    const defaults = group.choices.filter((choice) => choice.defaultSelected && isSelectable(choice));
    const selectedDefaults = group.selectionType === 'single' ? defaults.slice(0, 1) : defaults;
    initial[group.id] = Object.fromEntries(selectedDefaults.map((choice) => [choice.id, 1]));

    if (
      group.required &&
      group.selectionType === 'single' &&
      firstAvailable &&
      Object.keys(initial[group.id]).length === 0
    ) {
      initial[group.id][firstAvailable.id] = 1;
    }
  }

  return initial;
}

function toCartOption(
  group: OrderShellOptionGroup,
  choice: OrderShellOptionChoice,
  qty?: number,
): OrderShellCartOption {
  return {
    groupId: group.id,
    groupName: group.name,
    choiceId: choice.id,
    choiceName: choice.name,
    price: choice.price,
    ...(qty !== undefined ? { qty } : {}),
  };
}

/**
 * 메뉴 상세 시트의 수량·옵션 선택 상태를 소유한다.
 *
 * 시트가 열릴 때마다 새로 마운트되도록 호출부에서 메뉴 id를 `key`로 주는 것을 전제한다 —
 * 그래야 다른 메뉴를 열었을 때 이전 선택이 남지 않는다.
 */
export function useMenuDetailSheet(
  item: OrderShellMenuItem,
  runtimeSoldoutOptionChoiceIds: Set<string> = new Set(),
) {
  const optionGroups = useMemo(() => item.optionGroups ?? [], [item.optionGroups]);

  const [qty, setQty] = useState(MIN_MENU_QTY);
  const [selectedChoices, setSelectedChoices] = useState<SelectedChoiceMap>(() =>
    buildInitialSelection(optionGroups, runtimeSoldoutOptionChoiceIds),
  );
  const [choiceQty, setChoiceQty] = useState<ChoiceQtyMap>({});

  const selectedOptions = useMemo<OrderShellCartOption[]>(() => {
    return optionGroups.flatMap((group) =>
      Object.entries(selectedChoices[group.id] ?? {}).flatMap(([choiceId, storedQty]) => {
        const choice = group.choices.find((candidate) => candidate.id === choiceId);
        if (!choice || storedQty === 0) return [];

        // `quantity` 그룹은 저장된 수량이 곧 항목 개수. `multiple`은 항목별 개수를 별도로
        // 관리하는 `choiceQty`에서 읽는다. 단일 선택은 항상 1개라 `qty`를 남기지 않는다.
        const qtyForChoice =
          group.selectionType === 'quantity'
            ? storedQty
            : group.selectionType === 'multiple'
              ? (choiceQty[choiceQtyKey(group.id, choiceId)] ?? 1)
              : undefined;

        return [toCartOption(group, choice, qtyForChoice)];
      }),
    );
  }, [optionGroups, selectedChoices, choiceQty]);

  /** 필수 그룹인데 아무것도 안 고른 그룹 — 있으면 담기를 막는다. */
  const unsatisfiedRequiredGroups = useMemo(() => {
    return optionGroups.filter(
      (group) =>
        group.required &&
        Object.values(selectedChoices[group.id] ?? {}).every((quantity) => quantity === 0),
    );
  }, [optionGroups, selectedChoices]);

  const unitPrice = calcUnitPrice(item.price, selectedOptions);
  const totalPrice = unitPrice * qty;

  function increaseQty() {
    setQty((prev) => Math.min(prev + 1, MAX_MENU_QTY));
  }

  function decreaseQty() {
    setQty((prev) => Math.max(prev - 1, MIN_MENU_QTY));
  }

  /**
   * 단일 선택은 고른 항목으로 교체하기만 한다 — `radio`는 이미 고른 항목을 다시 눌러도
   * change가 발생하지 않으므로 해제 분기를 둬도 UI에서 도달할 수 없다.
   * 복수 선택은 토글하되, `maxSelectable`에 도달했으면 새 항목 추가만 막고 해제는 그대로 허용한다.
   * 새로 선택되는 복수 선택 항목은 개수를 1로 되돌린다 — 이전에 해제하기 전 늘려뒀던 값이
   * 남아있지 않게 하기 위함이다.
   */
  function toggleChoice(group: OrderShellOptionGroup, choiceId: string) {
    const current = selectedChoices[group.id] ?? {};
    const isNewMultiSelection = group.selectionType === 'multiple' && !current[choiceId];

    setSelectedChoices((prev) => {
      const cur = prev[group.id] ?? {};

      if (group.selectionType === 'single') {
        if (cur[choiceId]) return prev;
        return { ...prev, [group.id]: { [choiceId]: 1 } };
      }

      if (group.selectionType === 'quantity') return prev;

      if (cur[choiceId]) {
        const next = { ...cur };
        delete next[choiceId];
        return { ...prev, [group.id]: next };
      }

      if (group.maxSelectable !== undefined && Object.keys(cur).length >= group.maxSelectable) {
        return prev;
      }

      return { ...prev, [group.id]: { ...cur, [choiceId]: 1 } };
    });

    if (isNewMultiSelection) {
      setChoiceQty((prev) => ({ ...prev, [choiceQtyKey(group.id, choiceId)]: 1 }));
    }
  }

  /** 복수 선택 항목 하나의 개수를 늘린다. */
  function increaseChoiceQty(group: OrderShellOptionGroup, choiceId: string) {
    const key = choiceQtyKey(group.id, choiceId);
    setChoiceQty((prev) => ({ ...prev, [key]: (prev[key] ?? 1) + 1 }));
  }

  /** 복수 선택 항목 하나의 개수를 줄인다 — 1 미만으로 내려가지 않는다. */
  function decreaseChoiceQty(group: OrderShellOptionGroup, choiceId: string) {
    const key = choiceQtyKey(group.id, choiceId);
    setChoiceQty((prev) => ({ ...prev, [key]: Math.max(1, (prev[key] ?? 1) - 1) }));
  }

  function getChoiceQty(groupId: string, choiceId: string) {
    return choiceQty[choiceQtyKey(groupId, choiceId)] ?? 1;
  }

  function isChoiceSelected(groupId: string, choiceId: string) {
    return (selectedChoices[groupId]?.[choiceId] ?? 0) > 0;
  }

  /** 복수 선택 상한에 걸려 더 고를 수 없는 항목인지. 이미 고른 항목은 해제할 수 있어야 하므로 제외한다. */
  function isChoiceDisabled(group: OrderShellOptionGroup, choice: OrderShellOptionChoice) {
    if (choice.soldOut || runtimeSoldoutOptionChoiceIds.has(choice.id)) return true;
    if (group.selectionType !== 'multiple' || group.maxSelectable === undefined) return false;

    const current = selectedChoices[group.id] ?? {};
    return Object.keys(current).length >= group.maxSelectable && !current[choice.id];
  }

  function getChoiceQuantity(groupId: string, choiceId: string) {
    return selectedChoices[groupId]?.[choiceId] ?? 0;
  }

  function changeChoiceQuantity(
    group: OrderShellOptionGroup,
    choice: OrderShellOptionChoice,
    delta: number,
  ) {
    setSelectedChoices((prev) => {
      const current = prev[group.id] ?? {};
      const quantity = current[choice.id] ?? 0;
      const nextQuantity = Math.max(0, Math.min(quantity + delta, choice.maxQuantity ?? 1));
      const next = { ...current };
      if (nextQuantity === 0) delete next[choice.id];
      else next[choice.id] = nextQuantity;
      return { ...prev, [group.id]: next };
    });
  }

  return {
    optionGroups,
    qty,
    selectedOptions,
    unitPrice,
    totalPrice,
    canAddToCart: !item.soldOut && unsatisfiedRequiredGroups.length === 0,
    unsatisfiedRequiredGroups,
    increaseQty,
    decreaseQty,
    toggleChoice,
    isChoiceSelected,
    isChoiceDisabled,
    getChoiceQuantity,
    increaseChoiceQuantity: (group: OrderShellOptionGroup, choice: OrderShellOptionChoice) =>
      changeChoiceQuantity(group, choice, 1),
    decreaseChoiceQuantity: (group: OrderShellOptionGroup, choice: OrderShellOptionChoice) =>
      changeChoiceQuantity(group, choice, -1),
    getChoiceQty,
    increaseChoiceQty,
    decreaseChoiceQty,
  };
}
