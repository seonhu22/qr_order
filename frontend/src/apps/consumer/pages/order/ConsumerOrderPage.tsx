import { useEffect, useRef } from 'react';
import { Button } from '@/shared/components/button';
import { ConsumerBottomSheet } from '@/apps/consumer/features/bottom-sheet/components/ConsumerBottomSheet';
import { CartBar } from '@/apps/consumer/features/order-shell/components/CartBar';
import { MenuDetailSheet } from '@/apps/consumer/features/order-shell/components/MenuDetailSheet';
import { MenuItemCard } from '@/apps/consumer/features/order-shell/components/MenuItemCard';
import { calcCartLinePrice } from '@/apps/consumer/features/order-shell/cartLine';
import { useConsumerOrderPage } from '@/apps/consumer/features/order-shell/hooks/useConsumerOrderPage';
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
    categories,
    groupedMenu,
    isLoading,
    isError,
    refetch,
    isSearchLoading,
    isSearchError,
    refetchSearch,
    isDetailLoading,
    isDetailError,
    refetchDetail,
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
  // 메뉴 상세는 이미지가 시트 맨 위에 오고 메뉴명이 그 아래에 있어 시트 제목을 노출하지 않는다.
  // 스크린리더용 이름만 ariaLabel로 따로 넘긴다.
  const sheetTitle = sheet && sheet.type !== 'menu-detail' ? SHEET_TITLE[sheet.type] : undefined;
  const sheetAriaLabel = sheet?.type === 'menu-detail' ? detailItem?.name : undefined;

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
      selectedCategory === categories[0] ? groupedMenu[0]?.category : selectedCategory;
    if (!targetCategory) return;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    sectionRefs.current[targetCategory]?.scrollIntoView?.({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [categories, selectedCategory, groupedMenu]);

  return (
    <div className={`order-shell${totalCartQty > 0 ? ' order-shell--with-cart-bar' : ''}`}>
      {isLoading ? (
        <p className="order-shell__empty">메뉴를 불러오는 중입니다.</p>
      ) : isError ? (
        <div className="order-shell__empty">
          <p>메뉴를 불러오지 못했습니다.</p>
          <Button type="button" variant="secondary" size="md" onClick={() => void refetch()}>
            다시 시도
          </Button>
        </div>
      ) : isSearchError ? (
        <div className="order-shell__empty">
          <p>검색 결과를 불러오지 못했습니다.</p>
          <Button type="button" variant="secondary" size="md" onClick={() => void refetchSearch()}>
            다시 시도
          </Button>
        </div>
      ) : isSearchLoading ? (
        <p className="order-shell__empty">검색 중입니다.</p>
      ) : groupedMenu.length === 0 ? (
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
        {sheet?.type === 'menu-detail' && isDetailLoading && (
          <p className="order-shell-sheet__placeholder">메뉴 상세를 불러오는 중입니다.</p>
        )}

        {sheet?.type === 'menu-detail' && isDetailError && (
          <div className="order-shell-sheet">
            <p className="order-shell-sheet__placeholder">메뉴 상세를 불러오지 못했습니다.</p>
            <Button type="button" variant="secondary" size="md" onClick={() => void refetchDetail()}>
              다시 시도
            </Button>
          </div>
        )}

        {sheet?.type === 'menu-detail' && detailItem && !isDetailLoading && !isDetailError && (
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
            {cart.length === 0 ? (
              <p className="order-shell-sheet__placeholder">담긴 메뉴가 없습니다.</p>
            ) : (
              <ul className="order-shell-cart-list">
                {cart.map((line) => (
                  <li key={line.cartKey} className="order-shell-cart-list__item">
                    <span className="order-shell-cart-list__name">
                      {line.name} × {line.qty}
                      {line.options.length > 0 && (
                        <span className="order-shell-cart-list__options">
                          {line.options
                            .map((option) =>
                              option.quantity > 1
                                ? `${option.choiceName} × ${option.quantity}`
                                : option.choiceName,
                            )
                            .join(', ')}
                        </span>
                      )}
                    </span>
                    <span>{calcCartLinePrice(line).toLocaleString()}원</span>
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
