package htms.QROrder.system.billing.domain;

import lombok.Data;

import java.time.Instant;

/** sys_subscription_invoice 행. 제공자 재조회 값만 담는다. */
@Data
public class SubscriptionInvoice {
    private String sysId;
    private String subscriptionSysId;
    private String provider;
    private String providerStoreId;
    private String providerInvoiceId;
    private String chargeKind;
    private Integer amount;
    private Integer refundedAmount;
    private String currency;
    private String status;
    private Integer attemptCount;
    private Instant providerUpdatedAt;
    private Instant periodStartAt;
    private Instant periodEndAt;
    private Instant paidAt;
    private String applyResult;
    private String insertUserId;
}
