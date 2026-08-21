import { useEffect, useRef } from 'react';
import { Button } from '@/shared/components/button';
import { ConsumerBottomSheet } from '@/apps/consumer/features/bottom-sheet/components/ConsumerBottomSheet';
import { CartBar } from '@/apps/consumer/features/order-shell/components/CartBar';
import { MenuItemCard } from '@/apps/consumer/features/order-shell/components/MenuItemCard';
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
    findMenuItem,
    sheet,
    openMenuDetail,
    openCart,
    closeSheet,
  } = useConsumerOrderPage();

  const detailItem = sheet?.type === 'menu-detail' ? findMenuItem(sheet.menuId) : undefined;
  const sheetTitle = sheet
    ? sheet.type === 'menu-detail'
      ? detailItem?.name
      : SHEET_TITLE[sheet.type]
    : undefined;

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

      <ConsumerBottomSheet open={sheet !== null} onClose={closeSheet} title={sheetTitle}>
        {sheet?.type === 'menu-detail' && detailItem && (
          <div className="order-shell-sheet">
            {detailItem.description && (
              <p className="order-shell-sheet__description">{detailItem.description}</p>
            )}
            <p className="order-shell-sheet__price">{detailItem.price.toLocaleString()}원</p>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="order-shell-sheet__action"
              onClick={() => {
                addToCart(detailItem);
                closeSheet();
              }}
            >
              담기
            </Button>
          </div>
        )}

        {sheet?.type === 'cart' && (
          <div className="order-shell-sheet">
            {cart.length === 0 ? (
              <p className="order-shell-sheet__placeholder">담긴 메뉴가 없습니다.</p>
            ) : (
              <ul className="order-shell-cart-list">
                {cart.map((line) => (
                  <li key={line.cartKey} className="order-shell-cart-list__item">
                    <span>
                      {line.name} × {line.qty}
                    </span>
                    <span>{(line.price * line.qty).toLocaleString()}원</span>
                  </li>
                ))}
              </ul>
            )}
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="order-shell-sheet__action"
              disabled
            >
              주문하기 (준비 중입니다)
            </Button>
          </div>
        )}

        {(sheet?.type === 'order-history' || sheet?.type === 'staff-call') && (
          <p className="order-shell-sheet__placeholder">준비 중입니다.</p>
        )}
      </ConsumerBottomSheet>
    </div>
  );
}
