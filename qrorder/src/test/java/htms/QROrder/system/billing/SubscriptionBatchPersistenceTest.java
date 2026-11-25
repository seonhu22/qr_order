package htms.QROrder.system.billing;

import htms.QROrder.system.billing.fake.FakeBillingProvider.CardScenario;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;

import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/** 갱신 실패 → 7일 유예 → asOf 배치 만료/회수, 수동/레거시 01 유지, 제공자 종료 재시도, 배치 vs 늦은 Paid(§11 행 11). */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Execution(ExecutionMode.SAME_THREAD)
class SubscriptionBatchPersistenceTest {
    private BillingWorld world;
    @TempDir Path dir;

    @BeforeAll void start() throws Exception { world = BillingWorld.start(); }

    @AfterAll void stop() throws Exception { if (world != null) world.close(); }

    @BeforeEach void reset() { world.reset(dir.resolve("state-" + System.nanoTime() + ".json")); }

    /** 결제 → ACTIVE + 01, 다음 회차 청구 실패 웹훅까지. 돌려주는 값은 유료 기간 끝. */
    private Instant activeThenRenewalFails() {
        world.checkoutAndPay(CardScenario.SUCCESS);
        world.clock.advance(Duration.ofMinutes(1));
        world.pg.chargeNextPeriod(world.column("provider_subscription_id"), false);
        return world.instant("paid_through_at");
    }

    @Test void renewalFailureGivesSevenDayGraceThenBatchExpiresAndRevokes() {
        Instant paidThrough = activeThenRenewalFails();
        assertEquals("PAST_DUE", world.column("status"));
        assertEquals(paidThrough.plus(Duration.ofDays(7)), world.instant("grace_until"));
        assertEquals("DECLINED", world.column("last_failure_code"));
        assertEquals("01", world.db.role("OWNER-A"));

        var early = world.batch.run(paidThrough.plus(Duration.ofDays(7)).minusSeconds(1));
        assertEquals(0, early.expired());
        assertEquals("PAST_DUE", world.column("status"));
        assertEquals("01", world.db.role("OWNER-A"));

        var due = world.batch.run(paidThrough.plus(Duration.ofDays(7)));
        assertEquals(1, due.expired());
        assertEquals(1, due.revoked());
        assertEquals(1, due.providerEnded());
        assertEquals("EXPIRED", world.column("status"));
        assertEquals("02", world.db.role("OWNER-A"));
        assertNotNull(world.column("role_revoked_at"));
        assertEquals("DONE", world.column("provider_end_status"));
        assertEquals("ENDED", world.pg.getSubscription(world.column("provider_subscription_id")).status());
        assertEquals(0, world.batch.run(paidThrough.plus(Duration.ofDays(30))).candidates());
    }

    @Test void activeWithLostRenewalIsReconciledAndKeepsAccess() {
        world.checkoutAndPay(CardScenario.SUCCESS);
        Instant paidThrough = world.instant("paid_through_at");
        world.autoDeliver = false;
        world.clock.advance(Duration.ofMinutes(1));
        world.pg.chargeNextPeriod(world.column("provider_subscription_id"), true);

        var report = world.batch.run(paidThrough.plus(Duration.ofDays(7)));
        assertEquals(0, report.expired());
        assertEquals("ACTIVE", world.column("status"));
        assertTrue(world.instant("paid_through_at").isAfter(paidThrough));
        assertEquals("01", world.db.role("OWNER-A"));
    }

    @Test void activeWithoutRenewalExpiresOnlyAfterSuccessfulReconcile() {
        world.checkoutAndPay(CardScenario.SUCCESS);
        Instant due = world.instant("paid_through_at").plus(Duration.ofDays(7));
        world.pg.failNextLookups(1);
        var failed = world.batch.run(due);
        assertEquals(1, failed.reconcileFailed());
        assertEquals("ACTIVE", world.column("status"));
        assertEquals("01", world.db.role("OWNER-A"));

        assertEquals("ACTIVE", runAndStatus(due.minusSeconds(1)));
        assertEquals("EXPIRED", runAndStatus(due));
        assertEquals("02", world.db.role("OWNER-A"));
    }

    private String runAndStatus(Instant asOf) {
        world.batch.run(asOf);
        return world.column("status");
    }

    @Test void manualPermanentAndLegacy01StayAfterExpiry() {
        Instant paidThrough = activeThenRenewalFails();
        world.db.jdbc.update("update sys_subscription set role_granted_yn = 'N'");
        world.db.plant("LEGACY");
        world.db.user("LEGACY-OWNER", "LEGACY", "01");
        world.batch.run(paidThrough.plus(Duration.ofDays(8)));
        assertEquals("EXPIRED", world.column("status"));
        assertEquals("01", world.db.role("OWNER-A"));
        assertNull(world.column("role_revoked_at"));
        assertEquals("01", world.db.role("LEGACY-OWNER"));
    }

    @Test void providerEndFailureIsRetriedByTheNextRun() {
        Instant paidThrough = activeThenRenewalFails();
        world.pg.failNextLookups(1);
        var first = world.batch.run(paidThrough.plus(Duration.ofDays(7)));
        assertEquals(1, first.expired());
        assertEquals(1, first.providerEndFailed());
        assertEquals("FAILED", world.column("provider_end_status"));
        assertEquals("02", world.db.role("OWNER-A"));

        var retry = world.batch.run(paidThrough.plus(Duration.ofDays(7)));
        assertEquals(1, retry.candidates());
        assertEquals(0, retry.expired());
        assertEquals(1, retry.providerEnded());
        assertEquals("DONE", world.column("provider_end_status"));
    }

    @Test void oldPeriodFailureArrivingLateDoesNotMakeActivePastDue() {
        world.checkoutAndPay(CardScenario.SUCCESS);
        world.clock.advance(Duration.ofMinutes(1));
        String psid = world.column("provider_subscription_id");
        String failed = world.pg.chargeNextPeriod(psid, false);
        world.clock.advance(Duration.ofMinutes(1));
        world.pg.retryInvoice(failed, true);
        assertEquals("ACTIVE", world.column("status"));
        // 같은 실패 웹훅 재전송(이미 처리) / 다른 webhook-id라도 더 오래된 값이면 변화 없음.
        world.deliver(world.sent.get(1));
        assertEquals("ACTIVE", world.column("status"));
        assertNull(world.column("grace_until"));
    }

    @Test void batchAndLatePaidInParallelNeverDemoteAPayingOwner() throws Exception {
        var pool = Executors.newFixedThreadPool(2);
        try {
            for (int round = 0; round < 20; round++) {
                reset();
                world.checkoutAndPay(CardScenario.SUCCESS);
                Instant paidThrough = world.instant("paid_through_at");
                world.autoDeliver = false;
                world.clock.advance(Duration.ofMinutes(1));
                world.pg.chargeNextPeriod(world.column("provider_subscription_id"), true);
                var late = world.sent.get(world.sent.size() - 1);
                var gate = new CountDownLatch(1);
                var batchRun = pool.submit(() -> { gate.await(); return world.batch.run(paidThrough.plus(Duration.ofDays(7))); });
                var webhook = pool.submit(() -> { gate.await(); return world.deliver(late); });
                gate.countDown();
                assertEquals(0, batchRun.get(20, TimeUnit.SECONDS).expired(), "round " + round);
                webhook.get(20, TimeUnit.SECONDS);
                assertEquals("ACTIVE", world.column("status"), "round " + round);
                assertEquals("01", world.db.role("OWNER-A"), "round " + round);
                assertTrue(world.instant("paid_through_at").isAfter(paidThrough), "round " + round);
                assertEquals(2, world.count("sys_subscription_invoice"), "round " + round);
            }
        } finally {
            pool.shutdownNow();
        }
    }
}
