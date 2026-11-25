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

/** Admin 구독 목록/상세/즉시 종료와 문제 건 표시(MISMATCH/STALE/AFTER_CANCEL/OWNER_MISSING, 정책 §11 행 14). */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Execution(ExecutionMode.SAME_THREAD)
class AdminSubscriptionPersistenceTest {
    private BillingWorld world;
    @TempDir Path dir;

    @BeforeAll void start() throws Exception { world = BillingWorld.start(); }

    @AfterAll void stop() throws Exception { if (world != null) world.close(); }

    @BeforeEach void reset() { world.reset(dir.resolve("state-" + System.nanoTime() + ".json")); }

    @Test void listShowsStoreOwnerStatusPeriodAndGrant() {
        world.checkoutAndPay(CardScenario.SUCCESS);
        var list = world.admin.list(null, false);
        assertEquals(1, list.rows().size());
        var row = list.rows().get(0);
        assertEquals("STORE-A", row.getPlantCd());
        assertEquals("STORE-A", row.getPlantNm());
        assertEquals("OWNER-A", row.getOwnerUserId());
        assertEquals("01", row.getOwnerUserRole());
        assertEquals("ACTIVE", row.getStatus());
        assertEquals("기본 월간", row.getPlanName());
        assertEquals("Y", row.getRoleGrantedYn());
        assertNotNull(row.getPaidThroughAt());
        assertEquals(0, row.getProblemCount());
        assertEquals(1, world.admin.list("ACTIVE", false).rows().size());
        assertEquals(0, world.admin.list("EXPIRED", false).rows().size());
        assertEquals(0, world.admin.list(null, true).rows().size());
        assertThrows(ResponseStatusException.class, () -> world.admin.list("NOPE", false));

        var detail = world.admin.detail("SUB-A");
        assertEquals(1, detail.invoices().size());
        assertEquals(29000, detail.invoices().get(0).refundable());
        assertEquals("Invoice.Paid", detail.events().get(0).eventType());
        assertTrue(detail.canEnd());
    }

    @Test void problemRowsAreCountedAndFlagged() {
        world.checkoutAndPay(CardScenario.SUCCESS);
        world.client.cancel(world.owner());
        world.clock.advance(Duration.ofMinutes(1));
        String held = world.pg.chargeNextPeriod(world.column("provider_subscription_id"), true);
        var row = world.admin.list(null, true).rows().get(0);
        assertEquals(1, row.getProblemCount());
        var flagged = world.admin.detail("SUB-A").invoices().stream().filter(i -> i.problem()).toList();
        assertEquals(1, flagged.size());
        assertEquals("AFTER_CANCEL", flagged.get(0).applyResult());
        assertEquals(held, flagged.get(0).providerInvoiceId());

        // 환불로 해결되면 문제 건에서 빠진다.
        world.clock.advance(Duration.ofMinutes(1));
        world.admin.refund("SUB-A", flagged.get(0).invoiceSysId(), 29000);
        assertEquals(0, world.admin.list(null, true).rows().size());

        world.db.jdbc.update("update sys_subscription_invoice set apply_result = 'STALE', status = 'PAID', refunded_amount = 0"
                + " where provider_invoice_id = ?", held);
        assertEquals(1, world.admin.list(null, true).rows().get(0).getProblemCount());
        world.db.jdbc.update("update sys_subscription_invoice set apply_result = 'MISMATCH' where provider_invoice_id = ?", held);
        assertEquals(1, world.admin.list(null, true).rows().get(0).getProblemCount());
        world.db.jdbc.update("update sys_subscription_invoice set apply_result = 'OWNER_MISSING' where provider_invoice_id = ?", held);
        assertEquals(1, world.admin.list(null, true).rows().get(0).getProblemCount());
    }

    @Test void mismatchWebhookEventsAreListedSeparately() {
        var launch = world.client.checkout(world.owner(), BillingWorld.PLAN);
        world.db.jdbc.update("update sys_subscription set provider_customer_id = 'cus_other'");
        world.pg.pay(BillingWorld.token(launch), "OWNER-A", CardScenario.SUCCESS);
        var events = world.admin.list(null, false).mismatchEvents();
        assertEquals(1, events.size());
        assertEquals("MISMATCH", events.get(0).result());
        assertEquals("PENDING", world.column("status"));
    }

    @Test void immediateEndExpiresRevokesAndEndsProviderOnce() {
        world.checkoutAndPay(CardScenario.SUCCESS);
        var detail = world.admin.end("SUB-A");
        assertEquals("EXPIRED", detail.subscription().getStatus());
        assertFalse(detail.canEnd());
        assertEquals("02", world.db.role("OWNER-A"));
        assertEquals("DONE", world.column("provider_end_status"));
        assertEquals("ENDED", world.pg.getSubscription(world.column("provider_subscription_id")).status());
        var expiredAt = world.column("expired_at");
        assertEquals("EXPIRED", world.admin.end("SUB-A").subscription().getStatus());
        assertEquals(expiredAt, world.column("expired_at"));
        var missing = assertThrows(ResponseStatusException.class, () -> world.admin.end("SUB-X"));
        assertEquals(HttpStatus.NOT_FOUND, missing.getStatusCode());
    }

    @Test void immediateEndKeepsManualPermanent01() {
        world.checkoutAndPay(CardScenario.SUCCESS);
        world.db.jdbc.update("update sys_subscription set role_granted_yn = 'N'");
        world.admin.end("SUB-A");
        assertEquals("01", world.db.role("OWNER-A"));
    }
}
