import { ConsumerIcon } from '@/apps/consumer/shared/icons/ConsumerIcon';
import { useMenuDetailSheet, MAX_MENU_QTY, MIN_MENU_QTY } from '../hooks/useMenuDetailSheet';
import type { OrderShellCartOption, OrderShellMenuItem } from '../types';
import { AddToCartButton } from './AddToCartButton';
import { MenuOptionGroupList } from './MenuOptionGroupList';
import { QuantityStepper } from './QuantityStepper';
import './MenuDetailSheet.css';

type MenuDetailSheetProps = {
  item: OrderShellMenuItem;
  onAddToCart: (item: OrderShellMenuItem, qty: number, options: OrderShellCartOption[]) => void;
};

/**
 * 메뉴 상세 바텀시트의 내용. 시트 껍데기(`ConsumerBottomSheet`)는 호출부가 렌더링하고
 * 여기서는 이미지 · 메뉴 정보 · 수량 · 옵션 · 담기 버튼을 조립한다.
 *
 * 수량·옵션 선택 상태는 메뉴마다 새로 시작해야 하므로 호출부에서 메뉴 id를 `key`로 준다.
 */
export function MenuDetailSheet({ item, onAddToCart }: MenuDetailSheetProps) {
  const {
    optionGroups,
    qty,
    selectedOptions,
    totalPrice,
    canAddToCart,
    increaseQty,
    decreaseQty,
    toggleChoice,
    isChoiceSelected,
    isChoiceDisabled,
    getChoiceQuantity,
    increaseChoiceQuantity,
    decreaseChoiceQuantity,
  } = useMenuDetailSheet(item);

  return (
    <div className="menu-detail-sheet">
      <div className="menu-detail-sheet__image-frame">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="menu-detail-sheet__image" />
        ) : (
          <ConsumerIcon id="ci-utensils" size={32} />
        )}
      </div>

      <div className="menu-detail-sheet__info">
        <h2 className="menu-detail-sheet__name">{item.name}</h2>
        <p className="menu-detail-sheet__price">{item.price.toLocaleString()}원</p>
        {item.description && (
          <p className="menu-detail-sheet__description">{item.description}</p>
        )}
      </div>

      <hr className="menu-detail-sheet__divider" />

      <QuantityStepper
        qty={qty}
        min={MIN_MENU_QTY}
        max={MAX_MENU_QTY}
        onIncrease={increaseQty}
        onDecrease={decreaseQty}
      />

      {optionGroups.length > 0 && (
        <>
          <hr className="menu-detail-sheet__divider" />
          <MenuOptionGroupList
            groups={optionGroups}
            isChoiceSelected={isChoiceSelected}
            isChoiceDisabled={isChoiceDisabled}
            onToggleChoice={toggleChoice}
            getChoiceQuantity={getChoiceQuantity}
            onIncreaseChoiceQuantity={increaseChoiceQuantity}
            onDecreaseChoiceQuantity={decreaseChoiceQuantity}
          />
        </>
      )}

      <hr className="menu-detail-sheet__divider" />

      <AddToCartButton
        totalPrice={totalPrice}
        disabled={!canAddToCart}
        onClick={() => onAddToCart(item, qty, selectedOptions)}
      />
    </div>
  );
}
