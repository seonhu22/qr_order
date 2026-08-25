import { useEffect, useRef } from 'react';
import { Button } from '@/shared/components/button';
import { ConsumerIcon } from '@/apps/consumer/shared/icons/ConsumerIcon';
import { ConsumerBottomSheet } from '@/apps/consumer/features/bottom-sheet/components/ConsumerBottomSheet';
import { CartBar } from '@/apps/consumer/features/order-shell/components/CartBar';
import { CartLineItem } from '@/apps/consumer/features/order-shell/components/CartLineItem';
import { MenuDetailSheet } from '@/apps/consumer/features/order-shell/components/MenuDetailSheet';
import { MenuItemCard } from '@/apps/consumer/features/order-shell/components/MenuItemCard';
import { NetworkErrorScreen } from '@/apps/consumer/features/order-shell/components/NetworkErrorScreen';
import { OrderCompleteScreen } from '@/apps/consumer/features/order-shell/components/OrderCompleteScreen';
import { OrderFailureScreen } from '@/apps/consumer/features/order-shell/components/OrderFailureScreen';
import { OrderProcessingScreen } from '@/apps/consumer/features/order-shell/components/OrderProcessingScreen';
import { SessionExpiredScreen } from '@/apps/consumer/features/order-shell/components/SessionExpiredScreen';
import { useConsumerOrderPage } from '@/apps/consumer/features/order-shell/hooks/useConsumerOrderPage';
import { ORDER_SHELL_CATEGORIES } from '@/apps/consumer/features/order-shell/mock/orderShellMock';
import './ConsumerOrderPage.css';

const SHEET_TITLE: Record<string, string> = {
  cart: '장바구니',
  'order-history': '주문내역',
  'staff-call': '직원호출',
};

export function ConsumerOrderPage() {
  const {
    searchQuery,
    selectedCategory,
    groupedMenu,
    cart,
    totalCartQty,
    totalCartPrice,
    addToCart,
    updateCartLineQty,
    removeCartLine,
    findMenuItem,
    sheet,
    openMenuDetail,
    openCart,
    closeSheet,
    orderPhase,
    duplicateTime,
    placeOrder,
    confirmOrderComplete,
    retryOrder,
    dismissOrderError,
    viewOrderHistoryFromError,
    retryFromNetworkError,
  } = useConsumerOrderPage();

  const detailItem = sheet?.type === 'menu-detail' ? findMenuItem(sheet.menuId) : undefined;
  // 메뉴 상세는 이미지가 시트 맨 위에 오고 메뉴명이 그 아래에 있어, 장바구니는 아이콘+개수 배지가
  // 붙은 자체 헤더를 쓰기 때문에 둘 다 공용 시트 제목을 노출하지 않는다. 스크린리더용 이름만
  // ariaLabel로 따로 넘긴다.
  const sheetTitle =
    sheet && sheet.type !== 'menu-detail' && sheet.type !== 'cart' ? SHEET_TITLE[sheet.type] : undefined;
  const sheetAriaLabel =
    sheet?.type === 'menu-detail' ? detailItem?.name : sheet?.type === 'cart' ? SHEET_TITLE.cart : undefined;

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const isFirstCategoryRender = useRef(true);

  // 카테고리 탭 클릭은 ConsumerHeader가 소유하고(consumerOrderFilterStore), 이 페이지는
  // 선택된 카테고리 변화에 반응해 해당 섹션으로만 스크롤한다. 헤더가 스크롤 영역 밖 고정
  // 요소라 sticky 오프셋 계산 없이 scrollIntoView만으로 충분하다.
  useEffect(() => {
    if (isFirstCategoryRender.current) {
      isFirstCategoryRender.current = false;
      return;
    }

    const targetCategory =
      selectedCategory === ORDER_SHELL_CATEGORIES[0] ? groupedMenu[0]?.category : selectedCategory;
    if (!targetCategory) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    sectionRefs.current[targetCategory]?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [selectedCategory, groupedMenu]);

  return (
    <div className={`order-shell${totalCartQty > 0 ? ' order-shell--with-cart-bar' : ''}`}>
      {groupedMenu.length === 0 ? (
        <p className="order-shell__empty">
          {searchQuery ? `"${searchQuery}"에 대한 메뉴가 없습니다.` : '메뉴가 없습니다.'}
        </p>
      ) : (
        groupedMenu.map((group) => (
          <section
            key={group.category}
            ref={(el) => {
              sectionRefs.current[group.category] = el;
            }}
            className="order-shell__category-section"
          >
            <div className="order-shell__category-heading">
              <p>{group.category}</p>
              <span>{group.items.length}개</span>
            </div>
            <div className="order-shell__items-grid">
              {group.items.map((item) => (
                <MenuItemCard key={item.id} item={item} onSelect={() => openMenuDetail(item.id)} />
              ))}
            </div>
          </section>
        ))
      )}

      <CartBar totalQty={totalCartQty} totalPrice={totalCartPrice} onOpenCart={openCart} />

      <ConsumerBottomSheet
        open={sheet !== null}
        onClose={closeSheet}
        title={sheetTitle}
        ariaLabel={sheetAriaLabel}
      >
        {sheet?.type === 'menu-detail' && detailItem && (
          // 메뉴가 바뀌면 수량·옵션 선택이 초기화되도록 메뉴 id를 key로 준다.
          <MenuDetailSheet
            key={detailItem.id}
            item={detailItem}
            onAddToCart={(item, qty, options) => {
              addToCart(item, qty, options);
              closeSheet();
            }}
          />
        )}

        {sheet?.type === 'cart' && (
          <div className="order-shell-sheet">
            <div className="order-shell-cart-header">
              <ConsumerIcon id="ci-shopping-cart" size={16} />
              <span className="order-shell-cart-header__title">장바구니</span>
              <span className="order-shell-cart-header__count">{totalCartQty}</span>
            </div>

            {cart.length === 0 ? (
              <div className="order-shell-cart-empty">
                <ConsumerIcon id="ci-shopping-cart" size={36} className="order-shell-cart-empty__icon" />
                <p className="order-shell-cart-empty__text">장바구니에 담긴 메뉴가 없습니다.</p>
              </div>
            ) : (
              <ul className="order-shell-cart-list">
                {cart.map((line) => (
                  <CartLineItem
                    key={line.cartKey}
                    line={line}
                    onIncrease={() => updateCartLineQty(line.cartKey, 1)}
                    onDecrease={() => updateCartLineQty(line.cartKey, -1)}
                    onRemove={() => removeCartLine(line.cartKey)}
                  />
                ))}
              </ul>
            )}

            <div className="order-shell-cart-total">
              <span className="order-shell-cart-total__label">총 결제 금액</span>
              <span className="order-shell-sheet__price">{totalCartPrice.toLocaleString()}원</span>
            </div>

            {cart.length === 0 ? (
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="order-shell-sheet__action"
                onClick={closeSheet}
              >
                메뉴 보러가기
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="order-shell-sheet__action"
                onClick={placeOrder}
              >
                주문하기
              </Button>
            )}
          </div>
        )}

        {(sheet?.type === 'order-history' || sheet?.type === 'staff-call') && (
          <p className="order-shell-sheet__placeholder">준비 중입니다.</p>
        )}
      </ConsumerBottomSheet>

      {orderPhase === 'processing' && <OrderProcessingScreen />}
      {orderPhase === 'complete' && <OrderCompleteScreen onConfirm={confirmOrderComplete} />}
      {orderPhase === 'error-network' && (
        <OrderFailureScreen type="network" onGoMain={dismissOrderError} onRetry={retryOrder} />
      )}
      {orderPhase === 'error-duplicate' && (
        <OrderFailureScreen
          type="duplicate"
          duplicateTime={duplicateTime}
          onGoMain={dismissOrderError}
          onHistory={viewOrderHistoryFromError}
        />
      )}
      {orderPhase === 'session-timeout' && <SessionExpiredScreen variant="timeout" />}
      {orderPhase === 'session-closed' && <SessionExpiredScreen variant="closed" />}
      {orderPhase === 'network-error' && <NetworkErrorScreen onRetry={retryFromNetworkError} />}
    </div>
  );
}
