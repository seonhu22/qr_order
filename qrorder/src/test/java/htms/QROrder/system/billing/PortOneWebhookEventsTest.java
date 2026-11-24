package htms.QROrder.system.billing;

import htms.QROrder.system.billing.provider.BillingModels.NoticeKind;
import htms.QROrder.system.billing.provider.PortOneWebhookEvents;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** 이벤트 이름은 포트원 문서 그대로, 모르는 type은 UNKNOWN(무시). */
class PortOneWebhookEventsTest {
    @Test void documentedNamesMapToKinds() {
        assertEquals("Invoice.Paid", PortOneWebhookEvents.INVOICE_PAID);
        assertEquals("Invoice.PaymentFailed", PortOneWebhookEvents.INVOICE_PAYMENT_FAILED);
        assertEquals("Invoice.PaymentRefunded", PortOneWebhookEvents.INVOICE_PAYMENT_REFUNDED);
        assertEquals("Subscription.Ended", PortOneWebhookEvents.SUBSCRIPTION_ENDED);
        assertEquals("Customer.PaymentMethodRevoked", PortOneWebhookEvents.CUSTOMER_PAYMENT_METHOD_REVOKED);
        assertEquals(NoticeKind.INVOICE, PortOneWebhookEvents.kindOf("Invoice.Paid"));
        assertEquals(NoticeKind.SUBSCRIPTION, PortOneWebhookEvents.kindOf("Subscription.Ended"));
        assertEquals(NoticeKind.PAYMENT_METHOD, PortOneWebhookEvents.kindOf("Customer.PaymentMethodRevoked"));
    }

    @Test void unknownOrMissingTypeIsIgnored() {
        assertEquals(NoticeKind.UNKNOWN, PortOneWebhookEvents.kindOf("Transaction.Paid"));
        assertEquals(NoticeKind.UNKNOWN, PortOneWebhookEvents.kindOf("invoice.paid"));
        assertEquals(NoticeKind.UNKNOWN, PortOneWebhookEvents.kindOf(null));
    }
}
