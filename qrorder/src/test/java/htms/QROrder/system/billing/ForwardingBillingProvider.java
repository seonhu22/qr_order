package htms.QROrder.system.billing;

import htms.QROrder.system.billing.provider.BillingModels.BillingNotice;
import htms.QROrder.system.billing.provider.BillingModels.CheckoutLaunch;
import htms.QROrder.system.billing.provider.BillingModels.CheckoutRequest;
import htms.QROrder.system.billing.provider.BillingModels.ProviderInvoice;
import htms.QROrder.system.billing.provider.BillingModels.ProviderSubscription;
import htms.QROrder.system.billing.provider.BillingProvider;

import java.util.List;
import java.util.Map;

/** 실제 가짜 PG에 그대로 위임하는 제공자. 테스트는 필요한 메서드만 덮어써 조회 결과/지연/실패를 바꾼다. */
class ForwardingBillingProvider implements BillingProvider {
    final BillingProvider target;

    ForwardingBillingProvider(BillingProvider target) {
        this.target = target;
    }

    @Override public String name() { return target.name(); }

    @Override public String storeId() { return target.storeId(); }

    @Override public CheckoutLaunch startCheckout(CheckoutRequest request) { return target.startCheckout(request); }

    @Override public ProviderSubscription getSubscription(String id) { return target.getSubscription(id); }

    @Override public ProviderInvoice getInvoice(String id) { return target.getInvoice(id); }

    @Override public List<ProviderInvoice> listInvoices(String id) { return target.listInvoices(id); }

    @Override public CheckoutLaunch reregisterPaymentMethod(String id, String owner) {
        return target.reregisterPaymentMethod(id, owner);
    }

    @Override public void endSubscription(String id) { target.endSubscription(id); }

    @Override public void refund(String id, int amount, String reason) { target.refund(id, amount, reason); }

    @Override public BillingNotice verifyAndParseWebhook(Map<String, String> headers, byte[] body) {
        return target.verifyAndParseWebhook(headers, body);
    }

    static ProviderInvoice withCustomer(ProviderInvoice i, String customerId) {
        return new ProviderInvoice(i.storeId(), i.invoiceId(), i.subscriptionId(), customerId, i.productId(),
                i.chargeKind(), i.paymentMethod(), i.amount(), i.refundedAmount(), i.currency(), i.status(),
                i.attemptCount(), i.periodStartAt(), i.periodEndAt(), i.paidAt(), i.updatedAt(), i.failureCode());
    }

    static ProviderSubscription withCustomer(ProviderSubscription s, String customerId) {
        return new ProviderSubscription(s.storeId(), s.subscriptionId(), customerId, s.productId(), s.status(),
                s.paymentMethodStatus(), s.updatedAt());
    }

    static BillingNotice withoutCustomer(BillingNotice n) {
        return new BillingNotice(n.webhookId(), n.eventType(), n.kind(), n.storeId(), n.subscriptionId(),
                n.invoiceId(), null, n.occurredAt());
    }

    static BillingNotice withWebhookId(BillingNotice n, String webhookId) {
        return new BillingNotice(webhookId, n.eventType(), n.kind(), n.storeId(), n.subscriptionId(),
                n.invoiceId(), n.customerId(), n.occurredAt());
    }
}
