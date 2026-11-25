package htms.QROrder.system.billing.domain;

import lombok.Data;

import java.time.Instant;

/** sys_subscription 행. */
@Data
public class Subscription {
    private String sysId;
    private String plantCd;
    private String ownerUserSysId;
    private String planSysId;
    private Integer amount;
    private String currency;
    private Integer periodMonth;
    private String provider;
    private String providerStoreId;
    private String providerCustomerId;
    private String providerSubscriptionId;
    private String checkoutAttemptId;
    private Instant checkoutExpiresAt;
    private SubscriptionStatus status;
    private Instant paidThroughAt;
    private Instant graceUntil;
    private Instant endAt;
    private Instant cancelRequestedAt;
    private Instant expiredAt;
    private String providerEndStatus;
    private String paymentMethodStatus;
    private Instant providerUpdatedAt;
    private String roleGrantedYn;
    private Instant roleGrantedAt;
    private Instant roleRevokedAt;
    private String lastFailureCode;
    private String insertUserId;
}
