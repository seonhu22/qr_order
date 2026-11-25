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
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/** 해지 예약(E6): end_at 고정, 뒤 결제는 AFTER_CANCEL, 해지와 Paid 병렬 20회(정책 §11 행 12). */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Execution(ExecutionMode.SAME_THREAD)
class SubscriptionCancelPersistenceTest {
    private BillingWorld world;
    @TempDir Path dir;

    @BeforeAll void start() throws Exception { world = BillingWorld.start(); }

    @AfterAll void stop() throws Exception { if (world != null) world.close(); }

    @BeforeEach void reset() { world.reset(dir.resolve("state-" + System.nanoTime() + ".json")); }

    private String lastApplyResult() {
        return world.db.jdbc.queryForObject("select apply_result from sys_subscription_invoice"
                + " order by period_start_at desc limit 1", String.class);
    }

    @Test void activeCancelFixesEndAtAndLaterPaymentIsHeldAfterCancel() {
        world.checkoutAndPay(CardScenario.SUCCESS);
        Instant paidThrough = world.instant("paid_through_at");
        var view = world.client.cancel(world.owner());
        assertEquals("CANCEL_SCHEDULED", view.status());
        assertEquals(paidThrough, world.instant("end_at"));
        assertNotNull(world.column("cancel_requested_at"));
        assertEquals("01", world.db.role("OWNER-A"));

        world.clock.advance(Duration.ofMinutes(1));
        world.pg.chargeNextPeriod(world.column("provider_subscription_id"), true);
        assertEquals("AFTER_CANCEL", lastApplyResult());
        assertEquals(paidThrough, world.instant("end_at"));
        assertEquals(paidThrough, world.instant("paid_through_at"));
        assertEquals("CANCEL_SCHEDULED", world.column("status"));

        assertEquals("CANCEL_SCHEDULED", world.client.cancel(world.owner()).status());
        assertEquals(paidThrough, world.instant("end_at"));

        world.batch.run(paidThrough.minusSeconds(1));
        assertEquals("01", world.db.role("OWNER-A"));
        world.batch.run(paidThrough);
        assertEquals("EXPIRED", world.column("status"));
        assertEquals("02", world.db.role("OWNER-A"));
        assertEquals("DONE", world.column("provider_end_status"));
        assertEquals("EXPIRED", world.client.cancel(world.owner()).status());
    }

    @Test void pendingCancelExpiresImmediatelyAndEndsTheRegistration() {
        world.client.checkout(world.owner(), BillingWorld.PLAN);
        String psid = world.column("provider_subscription_id");
        assertEquals("EXPIRED", world.client.cancel(world.owner()).status());
        assertEquals("DONE", world.column("provider_end_status"));
        assertEquals("ENDED", world.pg.getSubscription(psid).status());
        assertEquals("02", world.db.role("OWNER-A"));
    }

    @Test void pastDueWithTimeLeftIsScheduledAndWithoutTimeLeftExpiresAndRevokes() {
        world.checkoutAndPay(CardScenario.SUCCESS);
        world.clock.advance(Duration.ofMinutes(1));
        world.pg.chargeNextPeriod(world.column("provider_subscription_id"), false);
        assertEquals("PAST_DUE", world.column("status"));
        assertEquals("CANCEL_SCHEDULED", world.client.cancel(world.owner()).status());

        reset();
        world.checkoutAndPay(CardScenario.SUCCESS);
        world.clock.advance(Duration.ofMinutes(1));
        world.pg.chargeNextPeriod(world.column("provider_subscription_id"), false);
        world.clock.set(world.instant("paid_through_at").plusSeconds(1));
        assertEquals("EXPIRED", world.client.cancel(world.owner()).status());
        assertEquals("02", world.db.role("OWNER-A"));
        assertEquals("DONE", world.column("provider_end_status"));
    }

    @Test void staffCannotCancel() {
        world.checkoutAndPay(CardScenario.SUCCESS);
        var error = assertThrows(ResponseStatusException.class,
                () -> world.client.cancel(BillingWorld.login("STAFF-A", "STORE-A")));
        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        assertEquals("ACTIVE", world.column("status"));
    }

    @Test void cancelAndPaidInParallelTwentyTimesKeepEndAtFixed() throws Exception {
        var pool = Executors.newFixedThreadPool(2);
        Map<String, Integer> outcomes = new HashMap<>();
        try {
            for (int round = 0; round < 20; round++) {
                reset();
                world.checkoutAndPay(CardScenario.SUCCESS);
                Instant paidThrough = world.instant("paid_through_at");
                world.autoDeliver = false;
                world.clock.advance(Duration.ofMinutes(1));
                world.pg.chargeNextPeriod(world.column("provider_subscription_id"), true);
                var paid = world.sent.get(world.sent.size() - 1);
                var gate = new CountDownLatch(1);
                long jitterMs = round * 3L; // 라운드마다 해지를 조금씩 늦춰 두 순서가 모두 나오게 한다.
                var cancel = pool.submit(() -> {
                    gate.await();
                    Thread.sleep(jitterMs);
                    return world.client.cancel(world.owner());
                });
                var webhook = pool.submit(() -> { gate.await(); return world.deliver(paid); });
                gate.countDown();
                cancel.get(20, TimeUnit.SECONDS);
                webhook.get(20, TimeUnit.SECONDS);

                String result = lastApplyResult();
                outcomes.merge(result, 1, Integer::sum);
                assertEquals("CANCEL_SCHEDULED", world.column("status"), "round " + round);
                assertEquals(world.instant("paid_through_at"), world.instant("end_at"), "round " + round);
                if ("AFTER_CANCEL".equals(result)) {
                    assertEquals(paidThrough, world.instant("end_at"), "round " + round);
                } else {
                    assertEquals("APPLIED", result, "round " + round);
                    assertTrue(world.instant("end_at").isAfter(paidThrough), "round " + round);
                }
                assertEquals("01", world.db.role("OWNER-A"), "round " + round);
            }
        } finally {
            pool.shutdownNow();
        }
        System.out.println("cancel vs paid outcomes " + outcomes);
        assertEquals(20, outcomes.values().stream().mapToInt(Integer::intValue).sum());
        assertTrue(outcomes.containsKey("AFTER_CANCEL") && outcomes.containsKey("APPLIED"), outcomes.toString());
    }
}
