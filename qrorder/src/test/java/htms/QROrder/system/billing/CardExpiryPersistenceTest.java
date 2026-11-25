package htms.QROrder.system.billing;

import htms.QROrder.system.billing.fake.FakeBillingProvider.CardScenario;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;

import java.nio.file.Path;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

/** 콘솔 카드 만료 → payment_method_status=EXPIRED(배너), 권한/상태 그대로, 재등록 결제로 해제(정책 §11 행 15, E9). */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Execution(ExecutionMode.SAME_THREAD)
class CardExpiryPersistenceTest {
    private BillingWorld world;
    @TempDir Path dir;

    @BeforeAll void start() throws Exception { world = BillingWorld.start(); }

    @AfterAll void stop() throws Exception { if (world != null) world.close(); }

    @BeforeEach void reset() { world.reset(dir.resolve("state-" + System.nanoTime() + ".json")); }

    @Test void consoleCardExpiryShowsBannerStateWithoutChangingAccess() {
        world.checkoutAndPay(CardScenario.SUCCESS);
        world.clock.advance(Duration.ofMinutes(1));
        world.pg.expireCard(world.column("provider_subscription_id"));
        var view = world.client.view(world.owner());
        assertEquals("EXPIRED", view.paymentMethodStatus());
        assertEquals("ACTIVE", view.status());
        assertEquals("01", world.db.role("OWNER-A"));
        assertEquals("EXPIRED", world.client.view(BillingWorld.login("STAFF-A", "STORE-A")).paymentMethodStatus());
        assertEquals(1, world.db.jdbc.queryForObject("select count(*) from sys_billing_webhook_event"
                + " where event_type = 'Customer.PaymentMethodRevoked' and result = 'PROCESSED'", Integer.class));
    }

    @Test void lostCardExpiryWebhookIsPickedUpByReconcile() {
        world.checkoutAndPay(CardScenario.SUCCESS);
        world.autoDeliver = false;
        world.pg.expireCard(world.column("provider_subscription_id"));
        assertEquals("ACTIVE", world.column("payment_method_status"));
        assertEquals("EXPIRED", world.client.reconcile(world.owner()).paymentMethodStatus());
    }

    @Test void pendingSubscriptionOnlyRecordsCardExpiry() {
        world.client.checkout(world.owner(), BillingWorld.PLAN);
        world.pg.expireCard(world.column("provider_subscription_id"));
        assertEquals("NONE", world.column("payment_method_status"));
        assertEquals("PROCESSED", world.db.jdbc.queryForObject("select result from sys_billing_webhook_event", String.class));
    }

    @Test void cardExpiryForAnotherCustomerIsMismatch() {
        world.checkoutAndPay(CardScenario.SUCCESS);
        world.db.jdbc.update("update sys_subscription set provider_customer_id = 'cus_other'");
        world.pg.expireCard(world.column("provider_subscription_id"));
        assertEquals("ACTIVE", world.column("payment_method_status"));
        assertEquals(1, world.db.jdbc.queryForObject(
                "select count(*) from sys_billing_webhook_event where result = 'MISMATCH'", Integer.class));
    }

    @Test void nextSuccessfulPaymentClearsTheBanner() {
        world.checkoutAndPay(CardScenario.SUCCESS);
        String psid = world.column("provider_subscription_id");
        world.clock.advance(Duration.ofMinutes(1));
        world.pg.expireCard(psid);
        world.clock.advance(Duration.ofMinutes(1));
        String failed = world.pg.chargeNextPeriod(psid, false);
        assertEquals("PAST_DUE", world.column("status"));
        world.clock.advance(Duration.ofMinutes(1));
        var launch = world.client.checkout(world.owner(), BillingWorld.PLAN);
        world.pg.pay(BillingWorld.token(launch), "OWNER-A", CardScenario.SUCCESS);
        assertEquals("ACTIVE", world.column("status"));
        assertEquals("ACTIVE", world.column("payment_method_status"));
        assertNotNull(failed);
    }

    @Test void lostRenewalPaidThenCardExpiryReconcileKeepsTheBanner() {
        world.checkoutAndPay(CardScenario.SUCCESS);
        String psid = world.column("provider_subscription_id");
        var paidThrough = world.instant("paid_through_at");
        world.autoDeliver = false;
        world.clock.advance(Duration.ofMinutes(1));
        world.pg.chargeNextPeriod(psid, true);
        world.clock.advance(Duration.ofMinutes(1));
        world.pg.expireCard(psid);

        var view = world.client.reconcile(world.owner());
        assertEquals("ACTIVE", view.status());
        assertTrue(world.instant("paid_through_at").isAfter(paidThrough));
        assertEquals("EXPIRED", view.paymentMethodStatus());
        assertEquals("EXPIRED", world.column("payment_method_status"));
        assertEquals("01", world.db.role("OWNER-A"));
    }

    @Test void latePaidWebhookAfterCardExpiryDoesNotClearTheBanner() {
        world.checkoutAndPay(CardScenario.SUCCESS);
        String psid = world.column("provider_subscription_id");
        world.autoDeliver = false;
        world.clock.advance(Duration.ofMinutes(1));
        world.pg.chargeNextPeriod(psid, true);
        var latePaid = world.sent.get(world.sent.size() - 1);
        world.autoDeliver = true;
        world.clock.advance(Duration.ofMinutes(1));
        world.pg.expireCard(psid);
        assertEquals("EXPIRED", world.column("payment_method_status"));

        assertEquals(htms.QROrder.system.billing.service.BillingWebhookService.Outcome.OK, world.deliver(latePaid));
        assertEquals(2, world.count("sys_subscription_invoice"));
        assertEquals("EXPIRED", world.column("payment_method_status"));
        assertEquals("ACTIVE", world.column("status"));
    }
}
