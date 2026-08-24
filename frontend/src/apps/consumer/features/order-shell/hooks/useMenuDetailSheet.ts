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

/** 그룹 id → 선택된 항목 id 목록. 단일 선택 그룹도 배열로 두고 길이 1로만 유지한다. */
type SelectedChoiceMap = Record<string, string[]>;

/**
 * 옵션 그룹의 기본 선택값. 단일 선택 + 필수 그룹은 첫 항목을 미리 골라둬야
 * 사용자가 아무것도 건드리지 않아도 담기가 가능하다(백엔드 `defaultYn` 대응 자리).
 */
function buildInitialSelection(optionGroups: OrderShellOptionGroup[]): SelectedChoiceMap {
  const initial: SelectedChoiceMap = {};

  for (const group of optionGroups) {
    const firstAvailable = group.choices.find((choice) => !choice.soldOut);
    initial[group.id] =
      group.required && group.selectionType === 'single' && firstAvailable
        ? [firstAvailable.id]
        : [];
  }

  return initial;
}

function toCartOption(
  group: OrderShellOptionGroup,
  choice: OrderShellOptionChoice,
): OrderShellCartOption {
  return {
    groupId: group.id,
    groupName: group.name,
    choiceId: choice.id,
    choiceName: choice.name,
    price: choice.price,
  };
}

/**
 * 메뉴 상세 시트의 수량·옵션 선택 상태를 소유한다.
 *
 * 시트가 열릴 때마다 새로 마운트되도록 호출부에서 메뉴 id를 `key`로 주는 것을 전제한다 —
 * 그래야 다른 메뉴를 열었을 때 이전 선택이 남지 않는다.
 */
export function useMenuDetailSheet(item: OrderShellMenuItem) {
  const optionGroups = useMemo(() => item.optionGroups ?? [], [item.optionGroups]);

  const [qty, setQty] = useState(MIN_MENU_QTY);
  const [selectedChoices, setSelectedChoices] = useState<SelectedChoiceMap>(() =>
    buildInitialSelection(optionGroups),
  );

  const selectedOptions = useMemo<OrderShellCartOption[]>(() => {
    return optionGroups.flatMap((group) =>
      (selectedChoices[group.id] ?? []).flatMap((choiceId) => {
        const choice = group.choices.find((candidate) => candidate.id === choiceId);
        return choice ? [toCartOption(group, choice)] : [];
      }),
    );
  }, [optionGroups, selectedChoices]);

  /** 필수 그룹인데 아무것도 안 고른 그룹 — 있으면 담기를 막는다. */
  const unsatisfiedRequiredGroups = useMemo(() => {
    return optionGroups.filter(
      (group) => group.required && (selectedChoices[group.id]?.length ?? 0) === 0,
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
   * 단일 선택은 고른 항목으로 교체하고, 복수 선택은 토글한다.
   * 복수 선택에서 `maxSelectable`에 도달했으면 새 항목 추가만 막고 해제는 그대로 허용한다.
   */
  function toggleChoice(group: OrderShellOptionGroup, choiceId: string) {
    setSelectedChoices((prev) => {
      const current = prev[group.id] ?? [];

      if (group.selectionType === 'single') {
        // 필수 그룹은 이미 고른 항목을 다시 눌러도 해제하지 않는다 — 선택 없는 상태로 되돌릴 수 없다.
        if (current.includes(choiceId)) {
          return group.required ? prev : { ...prev, [group.id]: [] };
        }
        return { ...prev, [group.id]: [choiceId] };
      }

      if (current.includes(choiceId)) {
        return { ...prev, [group.id]: current.filter((id) => id !== choiceId) };
      }

      if (group.maxSelectable !== undefined && current.length >= group.maxSelectable) {
        return prev;
      }

      return { ...prev, [group.id]: [...current, choiceId] };
    });
  }

  function isChoiceSelected(groupId: string, choiceId: string) {
    return (selectedChoices[groupId] ?? []).includes(choiceId);
  }

  /** 복수 선택 상한에 걸려 더 고를 수 없는 항목인지. 이미 고른 항목은 해제할 수 있어야 하므로 제외한다. */
  function isChoiceDisabled(group: OrderShellOptionGroup, choice: OrderShellOptionChoice) {
    if (choice.soldOut) return true;
    if (group.selectionType !== 'multiple' || group.maxSelectable === undefined) return false;

    const current = selectedChoices[group.id] ?? [];
    return current.length >= group.maxSelectable && !current.includes(choice.id);
  }

  return {
    optionGroups,
    qty,
    selectedOptions,
    unitPrice,
    totalPrice,
    canAddToCart: unsatisfiedRequiredGroups.length === 0,
    unsatisfiedRequiredGroups,
    increaseQty,
    decreaseQty,
    toggleChoice,
    isChoiceSelected,
    isChoiceDisabled,
  };
}
