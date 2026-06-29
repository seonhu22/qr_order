/**
 * @fileoverview 매장 > 주문 > 주문 상태 관리 페이지
 *
 * @description
 * - 화면 조립 역할만 담당한다.
 * - 상태 계산은 `useOrderStatusBoardPage` feature hook에서 처리한다.
 */

import { useEffect, useRef } from 'react';
import './OrderStatusManagementPage.css';
import { OrderStatusBoard } from '@/apps/client/features/order-status-management/components/OrderStatusBoard';
import { OrderStatusManagementHeader } from '@/apps/client/features/order-status-management/components/OrderStatusManagementHeader';
import { useOrderStatusBoardPage } from '@/apps/client/features/order-status-management/hooks/useOrderStatusBoardPage';
import {
  ORDER_BOARD_STATUS_BADGE_CLASS,
  ORDER_CANCEL_REASON_OPTIONS,
  ORDER_UNPAID_REASON_OPTIONS,
} from '@/apps/client/features/order-status-management/constants';
import { MENU_CATALOG_MOCK } from '@/apps/client/features/order-status-management/mock/menuCatalogMock';
import { DeleteConfirmModal, SimpleDefaultModal, WrapperModal } from '@/shared/components/modal';
import { Button } from '@/shared/components/button';
import { SelectInput, TextareaInput, TextInput } from '@/shared/components/input';
import { FeedbackState } from '@/shared/components/feedback';
import { Icon } from '@/shared/assets/icons/Icon';
import {
  calculateOrderTotal,
  formatOrderBoardDateTime,
  formatOrderBoardPrice,
  formatOrderBoardTime,
  formatOrderCancelReasonDisplay,
  getOrderBoardStatusLabel,
  groupMenuCatalogByCategory,
} from '@/apps/client/features/order-status-management/utils';

const GROUPED_MENU_CATALOG = groupMenuCatalogByCategory(MENU_CATALOG_MOCK);

export function OrderStatusManagementPage() {
  const { data, status, actions, cancelModal, paymentModal, editModal, cancelReasonView, dismissConfirm } =
    useOrderStatusBoardPage();
  const groupedMenuCatalog = GROUPED_MENU_CATALOG;
  const pendingOptionPickerMenu = MENU_CATALOG_MOCK.find(
    (menu) => menu.id === editModal.optionPicker.catalogMenuId,
  );

  /**
   * "메뉴 추가"로 항목이 늘면(취소로 줄 때는 제외) 새로 추가된 줄(항상 맨 뒤)이 보이게 스크롤한다.
   * `docs/components/TableCard.md`의 "행추가 후 자동 스크롤 규칙"과 동일하게 `scrollIntoView({ block: 'nearest' })`를
   * 쓴다 — 이미 보이는 위치면 스크롤하지 않고, 필요할 때만 부드럽게 이동한다.
   */
  const addedItemsRef = useRef<HTMLDivElement>(null);
  const prevAddedItemsCountRef = useRef(0);
  useEffect(() => {
    const container = addedItemsRef.current;
    const prevCount = prevAddedItemsCountRef.current;
    prevAddedItemsCountRef.current = editModal.addedItems.length;
    if (!container || editModal.addedItems.length <= prevCount) return;
    container.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [editModal.addedItems]);

  /** "메뉴 추가"를 확정하면 새 주문(새 티켓)이 draftOrders 맨 뒤에 붙는다 — 같은 규칙으로 그 주문이 보이게 스크롤한다. */
  const draftOrdersListRef = useRef<HTMLDivElement>(null);
  const prevDraftOrdersCountRef = useRef(0);
  useEffect(() => {
    const container = draftOrdersListRef.current;
    const prevCount = prevDraftOrdersCountRef.current;
    prevDraftOrdersCountRef.current = editModal.draftOrders.length;
    if (!container || editModal.draftOrders.length <= prevCount) return;
    container.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [editModal.draftOrders]);

  return (
    <>
      <section className="order-status-management-page" aria-label="주문 상태 관리">
        <OrderStatusManagementHeader onReset={actions.handleReset} />
        {status.isLoading ? (
          <FeedbackState variant="loading" title="주문 현황을 불러오는 중입니다." />
        ) : status.isError ? (
          <FeedbackState variant="error" title="주문 현황을 불러오지 못했습니다." />
        ) : (
          <OrderStatusBoard
            columns={data.columns}
            actions={actions.cardActions}
            lastMovedIds={data.lastMovedIds}
          />
        )}
      </section>

      {/* ── 1단계: 취소사유 입력 ── */}
      <WrapperModal
        size="md"
        open={cancelModal.isEditorOpen}
        title="주문 취소 처리"
        primaryAction={{ label: '확인', onClick: cancelModal.requestCancel }}
        secondaryAction={{ label: '닫기', onClick: cancelModal.closeEditorModal }}
        onClose={cancelModal.closeEditorModal}
      >
        <div className="order-cancel-modal__form">
          <div className="order-cancel-modal__notice">
            <p className="order-cancel-modal__notice-title">취소사유를 선택해 주세요.</p>
            <p className="order-cancel-modal__notice-desc">
              주문을 취소하시면 이전 단계로 되돌릴 수 없습니다.
              <br />
              취소 사유를 정확히 선택한 후 진행해 주세요.
            </p>
          </div>
          <SelectInput
            label="취소사유"
            required
            options={ORDER_CANCEL_REASON_OPTIONS}
            value={cancelModal.reason}
            placeholder="취소사유를 선택하세요"
            errorText={cancelModal.errors.reason ? '취소사유를 선택해주세요.' : undefined}
            onChange={cancelModal.changeReason}
          />
          {cancelModal.isOtherReason && (
            <TextareaInput
              label="상세입력"
              required
              rows={3}
              value={cancelModal.description}
              placeholder="취소 사유를 입력하세요"
              errorText={cancelModal.errors.description ? '상세 사유를 입력해주세요.' : undefined}
              onChange={(event) => cancelModal.changeDescription(event.target.value)}
            />
          )}
        </div>
      </WrapperModal>

      {/* ── 2단계: 취소 확인 ── */}
      <WrapperModal
        size="sm"
        open={cancelModal.isConfirmOpen}
        title="알림"
        primaryAction={{ label: '확인', onClick: cancelModal.confirmCancel }}
        secondaryAction={{ label: '닫기', onClick: cancelModal.closeConfirm }}
        onClose={cancelModal.closeConfirm}
      >
        <div className="order-cancel-modal__notice">
          <p className="order-cancel-modal__notice-title">주문을 취소하시겠습니까?</p>
          <p className="order-cancel-modal__notice-desc">취소된 주문은 되돌릴 수 없습니다.</p>
        </div>
      </WrapperModal>

      {/* ── 3단계: 취소 완료 안내 ── */}
      <SimpleDefaultModal
        open={cancelModal.isNoticeOpen}
        title="안내"
        description="취소되었습니다."
        onClose={cancelModal.closeNotice}
      />

      {/* ── 취소사유 보기 (읽기 전용) ── */}
      <WrapperModal
        size="md"
        open={cancelReasonView.row !== null}
        title="취소사유"
        primaryAction={{ label: '닫기', onClick: cancelReasonView.close }}
        onClose={cancelReasonView.close}
      >
        <div className="order-cancel-modal__form">
          <TextInput label="주문번호" readOnly value={cancelReasonView.row?.orderNo ?? ''} />
          <TextInput
            label="취소일시"
            readOnly
            value={
              cancelReasonView.row
                ? formatOrderBoardDateTime(cancelReasonView.row.cancelledAt ?? cancelReasonView.row.orderDatetime)
                : ''
            }
          />
          <TextareaInput
            label="취소사유"
            readOnly
            rows={3}
            value={cancelReasonView.row ? formatOrderCancelReasonDisplay(cancelReasonView.row) : ''}
          />
        </div>
      </WrapperModal>

      {/* ── 취소 컬럼 카드 삭제 확인(화면에서만 삭제) ── */}
      <DeleteConfirmModal
        open={dismissConfirm.targetId !== null}
        description={'이 카드를 화면에서 삭제합니다.\n실제 주문 데이터는 삭제되지 않습니다.'}
        helperText="정말 삭제하시겠습니까?"
        primaryAction={{ label: '확인', onClick: dismissConfirm.confirm }}
        secondaryAction={{ onClick: dismissConfirm.close }}
        onClose={dismissConfirm.close}
      />

      {/* ── 결제 처리 1단계: 결제완료/미결제/닫기 선택 ── */}
      <WrapperModal
        size="sm"
        open={paymentModal.isChoiceOpen}
        title="결제 처리"
        onClose={paymentModal.closeChoice}
      >
        <div className="order-cancel-modal__form">
          <div className="order-cancel-modal__notice">
            <p className="order-cancel-modal__notice-title">결제 상태를 선택해주세요.</p>
            <p className="order-cancel-modal__notice-desc">
              결제 상태를 선택하시면 이전 단계로 되돌릴 수 없습니다.
            </p>
          </div>
        </div>
        <div className="order-payment-modal__actions">
          <Button variant="primary" size="md" onClick={paymentModal.choosePaid}>
            결제완료
          </Button>
          <Button variant="neutral" size="md" onClick={paymentModal.chooseUnpaid}>
            미결제
          </Button>
          <Button variant="outline" size="md" onClick={paymentModal.closeChoice}>
            닫기
          </Button>
        </div>
      </WrapperModal>

      {/* ── 결제 처리 2-A단계: 결제완료 영수증 확인 ── */}
      <WrapperModal
        size="md"
        open={paymentModal.isReceiptOpen}
        title="결제 완료 처리"
        primaryAction={{ label: '확인', onClick: paymentModal.confirmReceipt }}
        secondaryAction={{ label: '닫기', onClick: paymentModal.closeReceipt }}
        onClose={paymentModal.closeReceipt}
      >
        <div className="order-payment-receipt">
          <p className="order-payment-receipt__table">{paymentModal.tableOrders[0]?.tableNum}번 테이블</p>

          <div className="order-payment-receipt__order-list">
            {paymentModal.tableOrders.map((order) => (
              <div key={order.id} className="order-payment-receipt__order">
                <div className="order-payment-receipt__order-row">
                  <span className="order-payment-receipt__order-no">
                    #{order.orderNo} <span className="order-cancel-modal__field-label">(주문번호)</span>
                    <span className={`order-status-badge ${ORDER_BOARD_STATUS_BADGE_CLASS[order.orderStatus]}`}>
                      {getOrderBoardStatusLabel(order.orderStatus)}
                    </span>
                  </span>
                  <span className="order-payment-receipt__time">
                    <Icon id="i-clock" size={13} />
                    {formatOrderBoardTime(order.orderDatetime)}
                  </span>
                </div>

                <ul className="order-payment-receipt__menu-list">
                  {order.menuItems.map((menu) => (
                    <li key={menu.id} className="order-payment-receipt__menu-group">
                      <div className="order-payment-receipt__line">
                        <span className="order-payment-receipt__line-name">
                          {menu.name} X {menu.quantity}
                        </span>
                        <span className="order-payment-receipt__line-qty">{menu.quantity}</span>
                        <span className="order-payment-receipt__line-price">
                          {formatOrderBoardPrice(menu.unitPrice)}
                        </span>
                        <span className="order-payment-receipt__line-amount">
                          {formatOrderBoardPrice(menu.unitPrice * menu.quantity)}
                        </span>
                      </div>
                      {menu.options.length > 0 && (
                        <div className="order-payment-receipt__option-list">
                          {menu.options.map((option) => (
                            <div
                              key={option.id}
                              className="order-payment-receipt__line order-payment-receipt__line--option"
                            >
                              <span className="order-payment-receipt__line-name">
                                ↳ {option.name} X {option.quantity}
                              </span>
                              <span className="order-payment-receipt__line-qty">{option.quantity}</span>
                              <span className="order-payment-receipt__line-price">
                                {formatOrderBoardPrice(option.unitPrice)}
                              </span>
                              <span className="order-payment-receipt__line-amount">
                                {formatOrderBoardPrice(option.unitPrice * option.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                <p className="order-payment-receipt__subtotal">
                  {formatOrderBoardPrice(calculateOrderTotal(order))}
                </p>
              </div>
            ))}
          </div>

          <div className="order-payment-receipt__summary">
            <div className="order-payment-receipt__summary-row">
              <span>총 주문 건</span>
              <span>{paymentModal.tableOrders.length}</span>
            </div>
            <div className="order-payment-receipt__summary-row">
              <span>총 주문 메뉴</span>
              <span>{paymentModal.tableOrders.reduce((sum, order) => sum + order.menuItems.length, 0)}</span>
            </div>
            <div className="order-payment-receipt__summary-row order-payment-receipt__summary-row--total">
              <span>총합</span>
              <span>
                {formatOrderBoardPrice(
                  paymentModal.tableOrders.reduce((sum, order) => sum + calculateOrderTotal(order), 0),
                )}
              </span>
            </div>
          </div>
        </div>
      </WrapperModal>

      {/* ── 결제 처리 2-A단계 완료 안내 ── */}
      <SimpleDefaultModal
        open={paymentModal.isPaidNoticeOpen}
        title="안내"
        description="결제완료 되었습니다."
        onClose={paymentModal.closePaidNotice}
      />

      {/* ── 결제 처리 2-B단계: 미결제사유 입력 ── */}
      <WrapperModal
        size="md"
        open={paymentModal.isUnpaidEditorOpen}
        title="미결제 처리"
        primaryAction={{ label: '확인', onClick: paymentModal.confirmUnpaid }}
        secondaryAction={{ label: '닫기', onClick: paymentModal.closeUnpaidEditor }}
        onClose={paymentModal.closeUnpaidEditor}
      >
        <div className="order-cancel-modal__form">
          <div className="order-cancel-modal__notice">
            <p className="order-cancel-modal__notice-title">미결제사유를 선택해 주세요.</p>
            <p className="order-cancel-modal__notice-desc">
              미결제로 처리하면 이전 단계로 되돌릴 수 없습니다.
              <br />
              미결제 사유를 정확히 선택한 후 진행해 주세요.
            </p>
          </div>
          <SelectInput
            label="미결제사유"
            required
            options={ORDER_UNPAID_REASON_OPTIONS}
            value={paymentModal.reason}
            placeholder="미결제사유를 선택하세요"
            errorText={paymentModal.errors.reason ? '미결제사유를 선택해주세요.' : undefined}
            onChange={paymentModal.changeReason}
          />
          {paymentModal.isOtherReason && (
            <TextareaInput
              label="상세입력"
              required
              rows={3}
              value={paymentModal.description}
              placeholder="미결제 사유를 입력하세요"
              errorText={paymentModal.errors.description ? '상세 사유를 입력해주세요.' : undefined}
              onChange={(event) => paymentModal.changeDescription(event.target.value)}
            />
          )}
        </div>
      </WrapperModal>

      {/* ── 결제 처리 3단계: 미결제 완료 안내 ── */}
      <SimpleDefaultModal
        open={paymentModal.isUnpaidNoticeOpen}
        title="안내"
        description="미결제 처리되었습니다."
        onClose={paymentModal.closeUnpaidNotice}
      />

      {/* ── 주문 수정 ── */}
      <WrapperModal
        size="md"
        open={editModal.isEditorOpen}
        title="주문 수정"
        primaryAction={{ label: '확인', onClick: editModal.requestConfirm }}
        secondaryAction={{ label: '닫기', onClick: editModal.closeEditor }}
        onClose={editModal.closeEditor}
      >
        <div className="order-edit-modal">
          <div className="order-edit-modal__header">
            <p className="order-edit-modal__table">{editModal.tableNum}번 테이블</p>
            <Button
              variant="tinted"
              size="sm"
              leftIcon={<Icon id="i-plus" size={13} />}
              onClick={editModal.openMenuPicker}
            >
              메뉴 추가
            </Button>
          </div>

          <div className="order-edit-modal__order-list" ref={draftOrdersListRef}>
            {editModal.draftOrders.every((order) => order.menuItems.length === 0) && (
              <p className="order-edit-modal__empty">
                남아있는 메뉴가 없습니다. "메뉴 추가"로 새 주문을 등록해주세요.
              </p>
            )}
            {editModal.draftOrders
              .filter((order) => order.menuItems.length > 0)
              .map((order) => {
                const isNewOrder = !editModal.originalOrderIds.includes(order.id);
                return (
                <div
                  key={order.id}
                  className={
                    isNewOrder ? 'order-edit-modal__order order-edit-modal__order--new' : 'order-edit-modal__order'
                  }
                >
                  <div className="order-edit-modal__order-row">
                    <span className="order-edit-modal__order-no">
                      #{order.orderNo} <span className="order-cancel-modal__field-label">(주문번호)</span>
                      <span className={`order-status-badge ${ORDER_BOARD_STATUS_BADGE_CLASS[order.orderStatus]}`}>
                        {getOrderBoardStatusLabel(order.orderStatus)}
                      </span>
                      {isNewOrder && <span className="order-edit-modal__new-badge">새 주문</span>}
                    </span>
                    <span className="order-edit-modal__time">
                      <Icon id="i-clock" size={13} />
                      {formatOrderBoardTime(order.orderDatetime)}
                    </span>
                  </div>

                  <ul className="order-edit-modal__menu-list">
                    {order.menuItems.map((menu) => (
                      <li key={menu.id} className="order-edit-modal__menu-group">
                        <div className="order-edit-modal__line">
                          <span className="order-edit-modal__line-name">
                            {menu.name} X {menu.quantity}
                          </span>
                          <span className="order-edit-modal__line-qty">{menu.quantity}</span>
                          <span className="order-edit-modal__line-price">
                            {formatOrderBoardPrice(menu.unitPrice)}
                          </span>
                          <span className="order-edit-modal__line-amount">
                            {formatOrderBoardPrice(menu.unitPrice * menu.quantity)}
                          </span>
                          <Button
                            variant="icon"
                            size="sm"
                            className="order-edit-modal__line-cancel"
                            aria-label="취소"
                            iconOnly={<Icon id="i-close" size={13} />}
                            onClick={() => editModal.cancelMenuLine(order.id, menu.id)}
                          />
                        </div>
                        {menu.options.length > 0 && (
                          <div
                            className={
                              isNewOrder
                                ? 'order-edit-modal__option-list order-edit-modal__option-list--plain'
                                : 'order-edit-modal__option-list'
                            }
                          >
                            {menu.options.map((option) => (
                              <div
                                key={option.id}
                                className="order-edit-modal__line order-edit-modal__line--option"
                              >
                                <span className="order-edit-modal__line-name">
                                  ↳ {option.name} X {option.quantity}
                                </span>
                                <span className="order-edit-modal__line-qty">{option.quantity}</span>
                                <span className="order-edit-modal__line-price">
                                  {formatOrderBoardPrice(option.unitPrice)}
                                </span>
                                <span className="order-edit-modal__line-amount">
                                  {formatOrderBoardPrice(option.unitPrice * option.quantity)}
                                </span>
                                <span className="order-edit-modal__line-cancel-spacer" />
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>

                  <p className="order-edit-modal__subtotal">
                    {formatOrderBoardPrice(calculateOrderTotal(order))}
                  </p>
                </div>
                );
              })}
          </div>

          <div className="order-edit-modal__total">
            <span>총 합계</span>
            <span>
              {formatOrderBoardPrice(
                editModal.draftOrders.reduce((sum, order) => sum + calculateOrderTotal(order), 0),
              )}
            </span>
          </div>
        </div>
      </WrapperModal>

      {/* ── 주문 수정 변경 내용 경고 ── */}
      <SimpleDefaultModal
        open={editModal.isEditorDirtyWarningOpen}
        title="알림"
        description="페이지를 나가시겠습니까?"
        helperText="수정하신 내용이 저장되지 않았습니다."
        primaryAction={{ label: '확인', onClick: editModal.forceCloseEditor }}
        secondaryAction={{ onClick: editModal.closeEditorDirtyWarning }}
        onClose={editModal.closeEditorDirtyWarning}
      />

      {/* ── 주문 수정 확인 ── */}
      <WrapperModal
        size="sm"
        open={editModal.isConfirmOpen}
        title="알림"
        primaryAction={{ label: '확인', onClick: editModal.confirmSave }}
        secondaryAction={{ label: '닫기', onClick: editModal.closeConfirm }}
        onClose={editModal.closeConfirm}
      >
        <div className="order-cancel-modal__notice">
          <p className="order-cancel-modal__notice-title">주문수정 하시겠습니까?</p>
          <p className="order-cancel-modal__notice-desc">수정하시면 이전 단계로 되돌릴 수 없습니다.</p>
        </div>
      </WrapperModal>

      {/* ── 주문 수정 완료 안내 ── */}
      <SimpleDefaultModal
        open={editModal.isNoticeOpen}
        title="알림"
        description="수정되었습니다."
        onClose={editModal.closeNotice}
      />

      {/* ── 주문 수정 > 메뉴 추가 ── */}
      <WrapperModal
        size="md"
        open={editModal.isMenuPickerOpen}
        title="메뉴 추가"
        primaryAction={{ label: '확인', onClick: editModal.confirmMenuPicker }}
        secondaryAction={{ label: '닫기', onClick: editModal.closeMenuPicker }}
        onClose={editModal.closeMenuPicker}
      >
        <div className="order-menu-picker">
          <div className="order-menu-picker__catalog">
            {groupedMenuCatalog.map((group) => (
              <div key={group.category} className="order-menu-picker__category">
                <div className="order-menu-picker__category-header">
                  <p className="order-menu-picker__category-title">{group.category}</p>
                  <span className="order-menu-picker__category-count">{group.items.length}</span>
                </div>
                {group.items.map((item) => (
                  <div key={item.id} className="order-menu-picker__catalog-row">
                    <div className="order-menu-picker__catalog-thumb" aria-hidden="true" />
                    <div className="order-menu-picker__catalog-info">
                      <p className="order-menu-picker__catalog-name">
                        {item.name}
                        {item.optionCategories.length > 0 && (
                          <span className="order-menu-picker__catalog-option-count">옵션</span>
                        )}
                      </p>
                      <p className="order-menu-picker__catalog-price">{formatOrderBoardPrice(item.unitPrice)}</p>
                    </div>
                    <Button
                      variant="tinted"
                      size="sm"
                      onClick={() => editModal.clickAddCatalogMenu(item.id)}
                    >
                      추가
                    </Button>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="order-menu-picker__added" ref={addedItemsRef}>
            {editModal.addedItems.length === 0 ? (
              <p className="order-menu-picker__added-empty">추가된 항목이 없습니다.</p>
            ) : (
              editModal.addedItems.map((item) => (
                <div key={item.id} className="order-edit-modal__menu-group">
                  <div className="order-edit-modal__line">
                    <span className="order-edit-modal__line-name">
                      {item.name} X {item.quantity}
                    </span>
                    <span className="order-edit-modal__line-qty">{item.quantity}</span>
                    <span className="order-edit-modal__line-price">
                      {formatOrderBoardPrice(item.unitPrice)}
                    </span>
                    <span className="order-edit-modal__line-amount">
                      {formatOrderBoardPrice(item.unitPrice * item.quantity)}
                    </span>
                    <Button
                      variant="icon"
                      size="sm"
                      className="order-edit-modal__line-cancel"
                      aria-label="취소"
                      iconOnly={<Icon id="i-close" size={13} />}
                      onClick={() => editModal.cancelAddedItem(item.id)}
                    />
                  </div>
                  {item.options.length > 0 && (
                    <div className="order-menu-picker__added-option-list">
                      {item.options.map((option) => (
                        <div key={option.id} className="order-edit-modal__line order-edit-modal__line--option">
                          <span className="order-edit-modal__line-name">
                            ↳ {option.name} X {option.quantity}
                          </span>
                          <span className="order-edit-modal__line-qty">{option.quantity}</span>
                          <span className="order-edit-modal__line-price">
                            {formatOrderBoardPrice(option.unitPrice)}
                          </span>
                          <span className="order-edit-modal__line-amount">
                            {formatOrderBoardPrice(option.unitPrice * option.quantity)}
                          </span>
                          <span className="order-edit-modal__line-cancel-spacer" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </WrapperModal>

      {/* ── 메뉴 추가 변경 내용 경고 ── */}
      <SimpleDefaultModal
        open={editModal.isMenuPickerDirtyWarningOpen}
        title="알림"
        description="페이지를 나가시겠습니까?"
        helperText="추가된 항목이 저장되지 않았습니다."
        primaryAction={{ label: '확인', onClick: editModal.forceCloseMenuPicker }}
        secondaryAction={{ onClick: editModal.closeMenuPickerDirtyWarning }}
        onClose={editModal.closeMenuPickerDirtyWarning}
      />

      {/* ── 주문 수정 > 메뉴 추가 > 옵션 추가 ── */}
      <WrapperModal
        size="md"
        open={editModal.isOptionPickerOpen}
        title="옵션 추가"
        primaryAction={{ label: '확인', onClick: editModal.confirmOptionPicker }}
        secondaryAction={{ label: '닫기', onClick: editModal.closeOptionPicker }}
        onClose={editModal.closeOptionPicker}
      >
        <div className="order-menu-picker">
          <div className="order-menu-picker__catalog">
            {pendingOptionPickerMenu?.optionCategories.map((group) => (
              <div key={group.category} className="order-menu-picker__category">
                <p className="order-menu-picker__category-title">{group.category}</p>
                {group.options.map((option) => {
                  if (group.selectionType === 'single') {
                    const isSelected = editModal.optionPicker.selectedOptionIds.includes(option.id);
                    return (
                      <div key={option.id} className="order-menu-picker__catalog-row">
                        <div className="order-menu-picker__catalog-thumb" aria-hidden="true" />
                        <div className="order-menu-picker__catalog-info">
                          <p className="order-menu-picker__catalog-name">{option.name}</p>
                          <p className="order-menu-picker__catalog-price">
                            {formatOrderBoardPrice(option.unitPrice)}
                          </p>
                        </div>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={isSelected ? 'true' : 'false'}
                          aria-label={option.name}
                          className={
                            isSelected
                              ? 'order-option-picker__radio order-option-picker__radio--selected'
                              : 'order-option-picker__radio'
                          }
                          onClick={() =>
                            editModal.selectOptionPickerSingle(group.options.map((o) => o.id), option.id)
                          }
                        >
                          {isSelected && <Icon id="i-check" size={11} />}
                        </button>
                      </div>
                    );
                  }

                  const optionQuantity = editModal.optionPicker.optionQuantities[option.id] ?? 0;
                  return (
                    <div key={option.id} className="order-menu-picker__catalog-row">
                      <div className="order-menu-picker__catalog-thumb" aria-hidden="true" />
                      <div className="order-menu-picker__catalog-info">
                        <p className="order-menu-picker__catalog-name">{option.name}</p>
                        <p className="order-menu-picker__catalog-price">
                          {formatOrderBoardPrice(option.unitPrice)}
                        </p>
                      </div>
                      {optionQuantity === 0 ? (
                        <Button
                          variant="tinted"
                          size="sm"
                          onClick={() => editModal.changeOptionPickerOptionQuantity(option.id, 1)}
                        >
                          추가
                        </Button>
                      ) : (
                        <div className="order-option-picker__stepper">
                          <Button
                            variant="tinted"
                            size="sm"
                            className="order-option-picker__stepper-btn"
                            aria-label="수량 감소"
                            onClick={() => editModal.changeOptionPickerOptionQuantity(option.id, optionQuantity - 1)}
                          >
                            <Icon id="i-minus" size={11} />
                          </Button>
                          <span className="order-option-picker__stepper-count">{optionQuantity}</span>
                          <Button
                            variant="tinted"
                            size="sm"
                            className="order-option-picker__stepper-btn"
                            aria-label="수량 증가"
                            onClick={() => editModal.changeOptionPickerOptionQuantity(option.id, optionQuantity + 1)}
                          >
                            <Icon id="i-plus" size={11} />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="order-option-picker__quantity-box">
            <p className="order-option-picker__quantity-title">주문 수량</p>
            <p className="order-option-picker__quantity-desc">동일한 옵션으로 메뉴가 추가됩니다.</p>
            {pendingOptionPickerMenu && (
              <div className="order-menu-picker__catalog-row">
                <div className="order-menu-picker__catalog-thumb" aria-hidden="true" />
                <div className="order-menu-picker__catalog-info">
                  <p className="order-menu-picker__catalog-name">{pendingOptionPickerMenu.name}</p>
                  <p className="order-menu-picker__catalog-price">
                    {formatOrderBoardPrice(pendingOptionPickerMenu.unitPrice)}
                  </p>
                </div>
                <div className="order-option-picker__stepper">
                  <Button
                    variant="primary"
                    size="sm"
                    className="order-option-picker__stepper-btn"
                    aria-label="수량 감소"
                    onClick={() => editModal.changeOptionPickerQuantity(editModal.optionPicker.quantity - 1)}
                  >
                    <Icon id="i-minus" size={11} />
                  </Button>
                  <span className="order-option-picker__stepper-count">{editModal.optionPicker.quantity}</span>
                  <Button
                    variant="primary"
                    size="sm"
                    className="order-option-picker__stepper-btn"
                    aria-label="수량 증가"
                    onClick={() => editModal.changeOptionPickerQuantity(editModal.optionPicker.quantity + 1)}
                  >
                    <Icon id="i-plus" size={11} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </WrapperModal>

      {/* ── 옵션 추가 변경 내용 경고 ── */}
      <SimpleDefaultModal
        open={editModal.isOptionPickerDirtyWarningOpen}
        title="알림"
        description="페이지를 나가시겠습니까?"
        helperText="선택하신 옵션이 저장되지 않았습니다."
        primaryAction={{ label: '확인', onClick: editModal.forceCloseOptionPicker }}
        secondaryAction={{ onClick: editModal.closeOptionPickerDirtyWarning }}
        onClose={editModal.closeOptionPickerDirtyWarning}
      />
    </>
  );
}
