package htms.QROrder.system.billing.provider;

import java.time.Instant;
import java.util.Map;

/** 제공자 경계의 내부 모델. 제공자 원문 형식은 어댑터 안에서만 다룬다. */
public final class BillingModels {
    private BillingModels() {}

    /** 정기 자동 카드 결제만 승격 대상이다(수동 완납/0원 제외, 정책 §7). */
    public static final String CHARGE_RECURRING = "RECURRING";
    public static final String CHARGE_MANUAL = "MANUAL";
    public static final String METHOD_CARD = "CARD";

    public record CheckoutRequest(String subscriptionSysId, String ownerUserSysId, String plantCd, String productId,
                                  int amount, String currency, int periodMonth, String attemptId) {}

    /** Client 공통 계약 {@code {provider, launch}}. 가짜 launch = redirectUrl, 포트원 launch = SDK 인자. */
    public record CheckoutLaunch(String provider, String providerStoreId, String providerCustomerId,
                                 String providerSubscriptionId, Map<String, String> launch, Instant expiresAt) {}

    /** status: INCOMPLETE / ACTIVE / ENDED. */
    public record ProviderSubscription(String storeId, String subscriptionId, String customerId, String productId,
                                       String status, String paymentMethodStatus, Instant updatedAt) {}

    /** status: PENDING / PAID / FAILED / PARTIALLY_REFUNDED / REFUNDED. 금액은 원, refundedAmount는 누적. */
    public record ProviderInvoice(String storeId, String invoiceId, String subscriptionId, String customerId,
                                  String productId, String chargeKind, String paymentMethod, int amount,
                                  int refundedAmount, String currency, String status, int attemptCount,
                                  Instant periodStartAt, Instant periodEndAt, Instant paidAt, Instant updatedAt,
                                  String failureCode) {}

    public enum NoticeKind { INVOICE, SUBSCRIPTION, PAYMENT_METHOD, UNKNOWN }

    /** 검증된 웹훅의 ID만. 금액/상태는 믿지 않고 재조회한다. */
    public record BillingNotice(String webhookId, String eventType, NoticeKind kind, String storeId,
                                String subscriptionId, String invoiceId, String customerId, Instant occurredAt) {}
}
