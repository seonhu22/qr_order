package htms.QROrder.system.billing;

import htms.QROrder.system.billing.fake.FakeBillingProvider.CardScenario;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Path;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

/** Client 구독 화면 API: 대표 결제 → 01, 직원 읽기 전용, 시도 재개/새 시도, 재확인(10초), 재구독(정책 §10, §11 행 10). */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Execution(ExecutionMode.SAME_THREAD)
class ClientSubscriptionPersistenceTest {
    private BillingWorld world;
    @TempDir Path dir;

    @BeforeAll void start() throws Exception { world = BillingWorld.start(); }

    @AfterAll void stop() throws Exception { if (world != null) world.close(); }

    @BeforeEach void reset() { world.reset(dir.resolve("state-" + System.nanoTime() + ".json")); }

    private static void assertStatus(HttpStatus expected, Executable call) {
        var error = assertThrows(ResponseStatusException.class, call::run);
        assertEquals(expected, error.getStatusCode());
    }

    interface Executable { void run(); }

    @Test void ownerPaysAndBecomes01() {
        var before = world.client.view(world.owner());
        assertTrue(before.hasSubscription());
        assertEquals("PENDING", before.status());
        assertTrue(before.owner());
        assertTrue(before.canCheckout());
        assertEquals(1, before.plans().size());

        var launch = world.client.checkout(world.owner(), BillingWorld.PLAN);
        assertEquals("fake", launch.provider());
        assertTrue(launch.launch().get("redirectUrl").startsWith("http://localhost:8080/fake-pg/checkout?token="));
        assertEquals("29000", world.column("amount"));
        assertNotNull(world.column("provider_subscription_id"));
        world.pg.pay(BillingWorld.token(launch), "OWNER-A", CardScenario.SUCCESS);

        var after = world.client.view(world.owner());
        assertEquals("ACTIVE", after.status());
        assertTrue(after.roleGranted());
        assertEquals("ACTIVE", after.paymentMethodStatus());
        assertNotNull(after.paidThroughAt());
        assertEquals("01", world.db.role("OWNER-A"));
        assertEquals("02", world.db.role("STAFF-A"));
        assertEquals(1, world.client.invoices(world.owner()).size());
        assertEquals("PAID", world.client.invoices(world.owner()).get(0).status());
    }

    @Test void staffSeesStatusOnlyAndOwnerActionsAre403() {
        var staff = BillingWorld.login("STAFF-A", "STORE-A");
        var view = world.client.view(staff);
        assertEquals("PENDING", view.status());
        assertFalse(view.owner());
        assertFalse(view.canCheckout());
        assertFalse(view.canCancel());
        assertTrue(view.plans().isEmpty());
        assertStatus(HttpStatus.FORBIDDEN, () -> world.client.checkout(staff, BillingWorld.PLAN));
        assertStatus(HttpStatus.FORBIDDEN, () -> world.client.invoices(staff));
        assertStatus(HttpStatus.FORBIDDEN, () -> world.client.reconcile(staff));
        assertNull(world.column("checkout_attempt_id"));
    }

    @Test void otherStoreOwnerOnlySeesOwnStore() {
        world.db.plant("STORE-B");
        world.db.user("OWNER-B", "STORE-B", "02");
        var other = BillingWorld.login("OWNER-B", "STORE-B");
        assertFalse(world.client.view(other).hasSubscription());
        assertStatus(HttpStatus.NOT_FOUND, () -> world.client.checkout(other, BillingWorld.PLAN));
        assertStatus(HttpStatus.NOT_FOUND, () -> world.client.invoices(other));
    }

    @Test void secondCheckoutResumesTheOpenAttemptAndExpiredAttemptStartsNew() {
        var first = world.client.checkout(world.owner(), BillingWorld.PLAN);
        String firstRegistration = world.column("provider_subscription_id");
        var again = world.client.checkout(world.owner(), BillingWorld.PLAN);
        assertEquals(BillingWorld.token(first), BillingWorld.token(again));
        assertEquals(firstRegistration, world.column("provider_subscription_id"));

        world.clock.advance(Duration.ofMinutes(11));
        var fresh = world.client.checkout(world.owner(), BillingWorld.PLAN);
        assertNotEquals(BillingWorld.token(first), BillingWorld.token(fresh));
        assertNotEquals(firstRegistration, world.column("provider_subscription_id"));
        assertEquals("INCOMPLETE", world.pg.getSubscription(firstRegistration).status());
        assertThrows(IllegalStateException.class, () -> world.pg.pay(BillingWorld.token(first), "OWNER-A", CardScenario.SUCCESS));
    }

    @Test void expiredAttemptThatWasPaidIsReconciledInsteadOfReplaced() {
        world.autoDeliver = false;
        world.checkoutAndPay(CardScenario.SUCCESS);
        world.clock.advance(Duration.ofMinutes(11));
        assertStatus(HttpStatus.CONFLICT, () -> world.client.checkout(world.owner(), BillingWorld.PLAN));
        assertEquals("ACTIVE", world.column("status"));
        assertEquals("01", world.db.role("OWNER-A"));
    }

    @Test void reconcileAppliesLostPaymentAndIsLimitedToOncePer10Seconds() {
        world.autoDeliver = false;
        world.checkoutAndPay(CardScenario.SUCCESS);
        assertEquals("PENDING", world.column("status"));
        assertEquals("02", world.db.role("OWNER-A"));

        var view = world.client.reconcile(world.owner());
        assertEquals("ACTIVE", view.status());
        assertEquals("01", world.db.role("OWNER-A"));
        assertEquals(0, world.count("sys_billing_webhook_event"));
        assertStatus(HttpStatus.TOO_MANY_REQUESTS, () -> world.client.reconcile(world.owner()));
        world.clock.advance(Duration.ofSeconds(10));
        assertEquals("ACTIVE", world.client.reconcile(world.owner()).status());
        // 늦게 온 웹훅은 이미 반영된 상태라 아무것도 바꾸지 않는다.
        var modified = world.column("modify_datetime");
        assertEquals(htms.QROrder.system.billing.service.BillingWebhookService.Outcome.OK,
                world.deliver(world.sent.get(world.sent.size() - 1)));
        assertEquals(modified, world.column("modify_datetime"));
        assertEquals(1, world.count("sys_subscription_invoice"));
    }

    @Test void reconcileLookupFailureIs503AndChangesNothing() {
        world.autoDeliver = false;
        world.checkoutAndPay(CardScenario.SUCCESS);
        world.pg.failNextLookups(1);
        assertStatus(HttpStatus.SERVICE_UNAVAILABLE, () -> world.client.reconcile(world.owner()));
        assertEquals("PENDING", world.column("status"));
        assertEquals(0, world.count("sys_subscription_invoice"));
    }

    @Test void paidSubscriptionCannotStartAnotherCheckout() {
        world.checkoutAndPay(CardScenario.SUCCESS);
        assertStatus(HttpStatus.CONFLICT, () -> world.client.checkout(world.owner(), BillingWorld.PLAN));
    }

    @Test void unknownPlanIs400() {
        assertStatus(HttpStatus.BAD_REQUEST, () -> world.client.checkout(world.owner(), "NO-PLAN"));
        assertStatus(HttpStatus.BAD_REQUEST, () -> world.client.checkout(world.owner(), null));
    }

    @Test void expiredSubscriptionCanBeRenewedOnlyByThePreviousOwnerAfterProviderEnd() {
        world.db.jdbc.update("update sys_subscription set status='EXPIRED', provider_end_status='REQUESTED'");
        assertStatus(HttpStatus.CONFLICT, () -> world.client.checkout(world.owner(), BillingWorld.PLAN));
        world.db.jdbc.update("update sys_subscription set provider_end_status='DONE'");
        world.db.user("OTHER-A", "STORE-A", "02");
        assertStatus(HttpStatus.CONFLICT, () -> world.client.checkout(BillingWorld.login("OTHER-A", "STORE-A"), BillingWorld.PLAN));
        assertEquals(1, world.count("sys_subscription"));

        world.client.checkout(world.owner(), BillingWorld.PLAN);
        assertEquals(2, world.count("sys_subscription"));
        assertEquals("PENDING", world.client.view(world.owner()).status());
        assertEquals(1, world.db.jdbc.queryForObject(
                "select count(*) from sys_subscription where status <> 'EXPIRED' and owner_user_sys_id='OWNER-A'", Integer.class));
    }

    @Test void pastDueOwnerReregistersCardAndFailedPeriodIsChargedAgain() {
        world.checkoutAndPay(CardScenario.SUCCESS);
        String psid = world.column("provider_subscription_id");
        String failed = world.pg.chargeNextPeriod(psid, false);
        world.db.jdbc.update("update sys_subscription set status='PAST_DUE', grace_until = paid_through_at + interval '7 days'");

        world.clock.advance(Duration.ofMinutes(1));
        var launch = world.client.checkout(world.owner(), BillingWorld.PLAN);
        world.pg.pay(BillingWorld.token(launch), "OWNER-A", CardScenario.SUCCESS);
        assertEquals("ACTIVE", world.column("status"));
        assertNull(world.column("grace_until"));
        assertEquals("PAID", world.db.jdbc.queryForObject(
                "select status from sys_subscription_invoice where provider_invoice_id=?", String.class, failed));
        assertEquals(2, world.client.invoices(world.owner()).size());
    }
}
