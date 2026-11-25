package htms.QROrder.system.billing;

import htms.QROrder.system.billing.fake.FakeBillingProvider.CardScenario;
import htms.QROrder.system.billing.service.AdminSubscriptionService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Path;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

/** Admin 환불(E4/E5): 부분 2회 누적 전액 → X, 과거 회차 → 권한 유지, 중복 이벤트 1회(정책 §11 행 13). */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Execution(ExecutionMode.SAME_THREAD)
class SubscriptionRefundPersistenceTest {
    private BillingWorld world;
    private AdminSubscriptionService admin;
    @TempDir Path dir;

    @BeforeAll void start() throws Exception { world = BillingWorld.start(); }

    @AfterAll void stop() throws Exception { if (world != null) world.close(); }

    @BeforeEach void reset() {
        world.reset(dir.resolve("state-" + System.nanoTime() + ".json"));
        admin = world.admin;
    }

    private String invoiceSysId(String providerInvoiceId) {
        return world.db.jdbc.queryForObject("select sys_id from sys_subscription_invoice where provider_invoice_id=?",
                String.class, providerInvoiceId);
    }

    private String invoiceColumn(String providerInvoiceId, String column) {
        return world.db.jdbc.queryForObject("select " + column + "::text from sys_subscription_invoice"
                + " where provider_invoice_id=?", String.class, providerInvoiceId);
    }

    @Test void twoPartialRefundsReachingFullAmountExpireAndRevoke() {
        String paid = world.checkoutAndPay(CardScenario.SUCCESS);
        world.clock.advance(Duration.ofMinutes(1));
        admin.refund("SUB-A", invoiceSysId(paid), 10000);
        assertEquals("PARTIALLY_REFUNDED", invoiceColumn(paid, "status"));
        assertEquals("10000", invoiceColumn(paid, "refunded_amount"));
        assertEquals("ACTIVE", world.column("status"));
        assertEquals("01", world.db.role("OWNER-A"));

        world.clock.advance(Duration.ofMinutes(1));
        admin.refund("SUB-A", invoiceSysId(paid), 19000);
        assertEquals("REFUNDED", invoiceColumn(paid, "status"));
        assertEquals("APPLIED", invoiceColumn(paid, "apply_result"));
        assertEquals("EXPIRED", world.column("status"));
        assertEquals("02", world.db.role("OWNER-A"));
        assertEquals("DONE", world.column("provider_end_status"));
        assertEquals("ENDED", world.pg.getSubscription(world.column("provider_subscription_id")).status());
    }

    @Test void duplicateRefundEventIsAppliedOnce() {
        String paid = world.checkoutAndPay(CardScenario.SUCCESS);
        world.clock.advance(Duration.ofMinutes(1));
        admin.refund("SUB-A", invoiceSysId(paid), 10000);
        var refundEvent = world.sent.get(world.sent.size() - 1);
        var before = world.db.jdbc.queryForMap("select * from sys_subscription_invoice");
        assertEquals(htms.QROrder.system.billing.service.BillingWebhookService.Outcome.OK, world.deliver(refundEvent));
        world.pg.resend(refundEvent.headers().get("webhook-id"));
        assertEquals(before, world.db.jdbc.queryForMap("select * from sys_subscription_invoice"));
        assertEquals(1, world.db.jdbc.queryForObject(
                "select count(*) from sys_billing_webhook_event where event_type='Invoice.PaymentRefunded'", Integer.class));
        assertEquals("ACTIVE", world.column("status"));
    }

    @Test void fullRefundOfPastPeriodKeepsAccess() {
        String first = world.checkoutAndPay(CardScenario.SUCCESS);
        world.clock.advance(Duration.ofMinutes(1));
        world.pg.chargeNextPeriod(world.column("provider_subscription_id"), true);
        world.clock.set(world.instant("paid_through_at").minus(Duration.ofDays(3)));
        admin.refund("SUB-A", invoiceSysId(first), 29000);
        assertEquals("REFUNDED", invoiceColumn(first, "status"));
        assertEquals("ACTIVE", world.column("status"));
        assertEquals("01", world.db.role("OWNER-A"));
    }

    @Test void refundingAPaymentHeldAfterCancelKeepsTheScheduledEnd() {
        world.checkoutAndPay(CardScenario.SUCCESS);
        world.client.cancel(world.owner());
        world.clock.advance(Duration.ofMinutes(1));
        String held = world.pg.chargeNextPeriod(world.column("provider_subscription_id"), true);
        assertEquals("AFTER_CANCEL", invoiceColumn(held, "apply_result"));
        world.clock.advance(Duration.ofMinutes(1));
        admin.refund("SUB-A", invoiceSysId(held), 29000);
        assertEquals("REFUNDED", invoiceColumn(held, "status"));
        assertEquals("CANCEL_SCHEDULED", world.column("status"));
        assertEquals("01", world.db.role("OWNER-A"));
    }

    @Test void refundRequestsAreValidatedBeforeCallingTheProvider() {
        String paid = world.checkoutAndPay(CardScenario.SUCCESS);
        String invoice = invoiceSysId(paid);
        int events = world.count("sys_billing_webhook_event");
        assertEquals(HttpStatus.BAD_REQUEST, statusOf(() -> admin.refund("SUB-A", invoice, 0)));
        assertEquals(HttpStatus.BAD_REQUEST, statusOf(() -> admin.refund("SUB-A", invoice, 29001)));
        assertEquals(HttpStatus.NOT_FOUND, statusOf(() -> admin.refund("SUB-X", invoice, 100)));
        assertEquals(HttpStatus.NOT_FOUND, statusOf(() -> admin.refund("SUB-A", "nope", 100)));
        assertEquals(events, world.count("sys_billing_webhook_event"));
        assertEquals(0, world.pg.getInvoice(paid).refundedAmount());
    }

    private static HttpStatus statusOf(Runnable call) {
        return HttpStatus.valueOf(assertThrows(ResponseStatusException.class, call::run).getStatusCode().value());
    }
}
