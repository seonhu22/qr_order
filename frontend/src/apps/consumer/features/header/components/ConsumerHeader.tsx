import { useEffect, useRef, useState } from 'react';
import { ConsumerIcon } from '@/apps/consumer/shared/icons/ConsumerIcon';
import { useConsumerSession } from '@/apps/consumer/features/session/hooks/useConsumerSession';
import { useConsumerSheetStore } from '@/apps/consumer/stores/consumerSheetStore';
import { useConsumerOrderFilterStore } from '@/apps/consumer/stores/consumerOrderFilterStore';
import { useConsumerOrderQaStore } from '@/apps/consumer/stores/consumerOrderQaStore';
import { CategoryTabs } from '@/apps/consumer/features/order-shell/components/CategoryTabs';
import { ORDER_SHELL_CATEGORIES } from '@/apps/consumer/features/order-shell/mock/orderShellMock';
import '@/apps/consumer/features/header/styles/ConsumerHeader.css';

/**
 * ConsumerLayout이 마운트하는 상단 바 — 참고 저장소처럼 로고·매장정보·액션 버튼·검색·카테고리 탭을
 * 하나의 헤더 블록으로 묶는다. 검색어·선택 카테고리는 order-shell(useConsumerOrderPage)이 실제
 * 필터링에 쓰는 페이지 상태라 consumerOrderFilterStore로만 공유하고, 카테고리 목록도 지금은
 * order-shell의 mock 상수를 그대로 참조한다 — Consumer 페이지가 하나뿐인 지금 단계의 실용적 타협이다.
 */
export function ConsumerHeader() {
  const { session } = useConsumerSession();
  const openSheet = useConsumerSheetStore((state) => state.openSheet);
  const searchQuery = useConsumerOrderFilterStore((state) => state.searchQuery);
  const setSearchQuery = useConsumerOrderFilterStore((state) => state.setSearchQuery);
  const selectedCategory = useConsumerOrderFilterStore((state) => state.selectedCategory);
  const setSelectedCategory = useConsumerOrderFilterStore((state) => state.setSelectedCategory);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const requestOrderFailure = useConsumerOrderQaStore((state) => state.requestOrderFailure);
  const requestSessionExpiry = useConsumerOrderQaStore((state) => state.requestSessionExpiry);
  const requestNetworkError = useConsumerOrderQaStore((state) => state.requestNetworkError);
  const [qaMenuOpen, setQaMenuOpen] = useState(false);
  const qaMenuRef = useRef<HTMLDivElement>(null);

  function handleClearSearch() {
    setSearchQuery('');
    searchInputRef.current?.focus();
  }

  // QA 메뉴 바깥을 클릭하면 닫는다 — 참고 저장소의 dev-nav와 동일한 상호작용.
  useEffect(() => {
    if (!qaMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (event.target instanceof Node && !qaMenuRef.current?.contains(event.target)) {
        setQaMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [qaMenuOpen]);

  function handleTriggerOrderFailure(type: 'network' | 'duplicate') {
    requestOrderFailure(type);
    setQaMenuOpen(false);
  }

  function handleTriggerSessionExpiry(variant: 'timeout' | 'closed') {
    requestSessionExpiry(variant);
    setQaMenuOpen(false);
  }

  function handleTriggerNetworkError() {
    requestNetworkError();
    setQaMenuOpen(false);
  }

  return (
    <div className="consumer-header">
      <div className="consumer-header__top-row">
        <div className="consumer-header__brand" aria-hidden="true">
          <ConsumerIcon id="ci-shopping-cart" size={18} />
        </div>

        <div className="consumer-header__store">
          <p className="consumer-header__store-name">{session?.storeName ?? '매장'}</p>
          <div className="consumer-header__store-meta">
            {session?.tableNum != null && (
              <span className="consumer-header__table-badge">{session.tableNum}번 테이블</span>
            )}
            {session?.tableQty != null && (
              <span className="consumer-header__seat-count">
                <ConsumerIcon id="ci-users" size={11} />
                {session.tableQty}명 이용중
              </span>
            )}
          </div>
        </div>

        <div className="consumer-header__actions">
          <button
            type="button"
            className="consumer-header__action-button"
            onClick={() => openSheet({ type: 'staff-call' })}
          >
            <ConsumerIcon id="ci-bell" size={12} />
            직원호출
          </button>
          <button
            type="button"
            className="consumer-header__action-button"
            onClick={() => openSheet({ type: 'order-history' })}
          >
            <ConsumerIcon id="ci-receipt" size={12} />
            주문내역
          </button>

          <div className="consumer-header__qa-wrap" ref={qaMenuRef}>
            <button
              type="button"
              className="consumer-header__icon-button"
              aria-label="설정"
              onClick={import.meta.env.DEV ? () => setQaMenuOpen((prev) => !prev) : undefined}
            >
              <ConsumerIcon id="ci-settings" size={14} />
            </button>

            {/* QA 전용 — 실패 판별 로직이 붙기 전까지 주문 실패·세션 만료 화면을 미리보기
                위한 임시 메뉴. production 빌드에서는 tree-shake 되어 사라진다. */}
            {import.meta.env.DEV && qaMenuOpen && (
              <div className="consumer-header__qa-menu">
                <button type="button" onClick={() => handleTriggerOrderFailure('network')}>
                  주문 실패 (네트워크)
                </button>
                <button type="button" onClick={() => handleTriggerOrderFailure('duplicate')}>
                  주문 실패 (중복)
                </button>
                <button type="button" onClick={() => handleTriggerSessionExpiry('timeout')}>
                  주문 시간 초과
                </button>
                <button type="button" onClick={() => handleTriggerSessionExpiry('closed')}>
                  주문 마감 (결제 완료)
                </button>
                <button type="button" onClick={handleTriggerNetworkError}>
                  통신 오류
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="consumer-header__search" onClick={() => searchInputRef.current?.focus()}>
        <ConsumerIcon id="ci-search" size={15} className="consumer-header__search-icon" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="메뉴 검색"
          className="consumer-header__search-input"
          aria-label="메뉴 검색"
        />
        {searchQuery && (
          <button
            type="button"
            className="consumer-header__search-clear"
            aria-label="검색어 지우기"
            onClick={handleClearSearch}
          >
            <ConsumerIcon id="ci-x" size={14} />
          </button>
        )}
      </div>

      <CategoryTabs
        categories={ORDER_SHELL_CATEGORIES}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />
    </div>
  );
}
