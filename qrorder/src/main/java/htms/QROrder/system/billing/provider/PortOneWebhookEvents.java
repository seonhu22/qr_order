package htms.QROrder.system.billing.provider;

import htms.QROrder.system.billing.provider.BillingModels.NoticeKind;

import java.util.Map;

/**
 * 포트원 V2 관리형 구독 웹훅 이벤트 이름의 유일한 정의 위치. 가짜 제공자도 같은 이름을 보낸다.
 * 출처(2026-11-25 확인): https://developers.portone.io/opi/ko/extra/subscription/webhook?v=v2
 * 구독 웹훅은 웹훅 버전 2024-04-25에서만 온다. 카드 만료 전용 이벤트는 문서에 없다(결제수단 해지로 받는다).
 * 모르는 type은 오류 없이 무시한다(문서 권고).
 */
public final class PortOneWebhookEvents {
    private PortOneWebhookEvents() {}

    public static final String INVOICE_PAID = "Invoice.Paid";
    public static final String INVOICE_PAYMENT_FAILED = "Invoice.PaymentFailed";
    public static final String INVOICE_PAYMENT_REFUNDED = "Invoice.PaymentRefunded";
    public static final String INVOICE_CANCELED = "Invoice.Canceled";
    public static final String INVOICE_REGENERATED = "Invoice.Regenerated";
    public static final String SUBSCRIPTION_ACTIVATED = "Subscription.Activated";
    public static final String SUBSCRIPTION_INCOMPLETE = "Subscription.Incomplete";
    public static final String SUBSCRIPTION_UPDATED = "Subscription.Updated";
    public static final String SUBSCRIPTION_ENDED = "Subscription.Ended";
    public static final String CUSTOMER_PAYMENT_METHOD_REGISTERED = "Customer.PaymentMethodRegistered";
    public static final String CUSTOMER_PAYMENT_METHOD_REVOKED = "Customer.PaymentMethodRevoked";

    private static final Map<String, NoticeKind> KINDS = Map.ofEntries(
            Map.entry(INVOICE_PAID, NoticeKind.INVOICE),
            Map.entry(INVOICE_PAYMENT_FAILED, NoticeKind.INVOICE),
            Map.entry(INVOICE_PAYMENT_REFUNDED, NoticeKind.INVOICE),
            Map.entry(INVOICE_CANCELED, NoticeKind.INVOICE),
            Map.entry(INVOICE_REGENERATED, NoticeKind.INVOICE),
            Map.entry(SUBSCRIPTION_ACTIVATED, NoticeKind.SUBSCRIPTION),
            Map.entry(SUBSCRIPTION_INCOMPLETE, NoticeKind.SUBSCRIPTION),
            Map.entry(SUBSCRIPTION_UPDATED, NoticeKind.SUBSCRIPTION),
            Map.entry(SUBSCRIPTION_ENDED, NoticeKind.SUBSCRIPTION),
            Map.entry(CUSTOMER_PAYMENT_METHOD_REGISTERED, NoticeKind.PAYMENT_METHOD),
            Map.entry(CUSTOMER_PAYMENT_METHOD_REVOKED, NoticeKind.PAYMENT_METHOD));

    public static NoticeKind kindOf(String type) {
        return type == null ? NoticeKind.UNKNOWN : KINDS.getOrDefault(type, NoticeKind.UNKNOWN);
    }
}
