package htms.QROrder.system.billing.domain;

/** sys_subscription.status. EXPIRED 외 4개가 진행 중이며 매장당 1행이다. */
public enum SubscriptionStatus {
    PENDING, ACTIVE, PAST_DUE, CANCEL_SCHEDULED, EXPIRED;

    public boolean isOpen() {
        return this != EXPIRED;
    }
}
