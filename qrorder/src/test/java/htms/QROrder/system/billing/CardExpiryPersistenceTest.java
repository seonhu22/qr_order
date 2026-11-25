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

    /** 갱신 Paid 웹훅의 ACTIVE 구독 조회가 카드 만료 커밋 뒤에 적용돼도 배너(EXPIRED)는 남는다(제공자 updatedAt 순서). */
    @Test void staleActiveLookupAppliedAfterCardExpiryKeepsTheBanner() throws Exception {
        world.checkoutAndPay(CardScenario.SUCCESS);
        String psid = world.column("provider_subscription_id");
        var paidThrough = world.instant("paid_through_at");
        world.autoDeliver = false;
        world.clock.advance(Duration.ofMinutes(1));
        world.pg.chargeNextPeriod(psid, true);
        var renewal = world.sent.get(world.sent.size() - 1);
        var looked = new java.util.concurrent.CountDownLatch(1);
        var resume = new java.util.concurrent.CountDownLatch(1);
        var slow = new ForwardingBillingProvider(world.pg) {
            @Override public htms.QROrder.system.billing.provider.BillingModels.ProviderSubscription getSubscription(String id) {
                var snapshot = super.getSubscription(id);
                looked.countDown();
                try {
                    resume.await(20, java.util.concurrent.TimeUnit.SECONDS);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                return snapshot;
            }
        };
        var pool = java.util.concurrent.Executors.newSingleThreadExecutor();
        try {
            var late = pool.submit(() -> world.webhooks.handle(slow, renewal.headers(),
                    renewal.body().getBytes(java.nio.charset.StandardCharsets.UTF_8)));
            assertTrue(looked.await(20, java.util.concurrent.TimeUnit.SECONDS));
            world.clock.advance(Duration.ofMinutes(1));
            world.autoDeliver = true;
            world.pg.expireCard(psid);
            assertEquals("EXPIRED", world.column("payment_method_status"));
            resume.countDown();
            assertEquals(htms.QROrder.system.billing.service.BillingWebhookService.Outcome.OK,
                    late.get(30, java.util.concurrent.TimeUnit.SECONDS));
        } finally {
            pool.shutdownNow();
        }
        assertTrue(world.instant("paid_through_at").isAfter(paidThrough));
        assertEquals("ACTIVE", world.column("status"));
        assertEquals("EXPIRED", world.column("payment_method_status"));
    }

    /** 이미 반영한 인보이스의 중복 웹훅(전이 생략)은 결제수단 상태도 쓰지 않는다. */
    @Test void duplicateInvoiceDeliveryDoesNotWritePaymentMethod() {
        world.checkoutAndPay(CardScenario.SUCCESS);
        var paid = world.sent.get(world.sent.size() - 1);
        String psid = world.column("provider_subscription_id");
        world.clock.advance(Duration.ofMinutes(1));
        world.pg.expireCard(psid);
        assertEquals("EXPIRED", world.column("payment_method_status"));
        var duplicate = new ForwardingBillingProvider(world.pg) {
            @Override public htms.QROrder.system.billing.provider.BillingModels.ProviderSubscription getSubscription(String id) {
                var s = super.getSubscription(id);
                return new htms.QROrder.system.billing.provider.BillingModels.ProviderSubscription(s.storeId(),
                        s.subscriptionId(), s.customerId(), s.productId(), s.status(), "ACTIVE",
                        world.clock.instant().plus(Duration.ofHours(1)));
            }
            @Override public htms.QROrder.system.billing.provider.BillingModels.BillingNotice verifyAndParseWebhook(
                    java.util.Map<String, String> h, byte[] b) {
                return withWebhookId(super.verifyAndParseWebhook(h, b), "msg_duplicate");
            }
        };
        assertEquals(htms.QROrder.system.billing.service.BillingWebhookService.Outcome.OK, world.webhooks.handle(
                duplicate, paid.headers(), paid.body().getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        assertEquals("EXPIRED", world.column("payment_method_status"));
        assertEquals(1, world.count("sys_subscription_invoice"));
    }
}
