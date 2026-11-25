package htms.QROrder.system.billing;

import htms.QROrder.audit.service.AuditService;
import htms.QROrder.system.domain.Payment;
import htms.QROrder.system.repository.PaymentMapper;
import htms.QROrder.system.service.PaymentService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.function.BooleanSupplier;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

/** 정책 4C §5 두 세션: 결제 시작과 요금제 삭제는 같은 sys_payment 행 잠금으로 직렬화된다(실제 PostgreSQL). */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Execution(ExecutionMode.SAME_THREAD)
class PlanCheckoutDeleteRacePersistenceTest {
    private BillingWorld world;
    private PaymentService payments;
    @TempDir Path dir;

    @BeforeAll void start() throws Exception {
        world = BillingWorld.start("mapper/system/PaymentMapper.xml");
    }

    @AfterAll void stop() throws Exception { if (world != null) world.close(); }

    @BeforeEach void reset() {
        world.reset(dir.resolve("state-" + System.nanoTime() + ".json"));
        payments = new PaymentService(world.db.sql.getMapper(PaymentMapper.class), mock(AuditService.class));
    }

    private static Payment plan() {
        var payment = new Payment();
        payment.setSysId(BillingWorld.PLAN);
        payment.setPaymentCd("BASIC_MONTHLY");
        payment.setPaymentNm("기본 월간");
        payment.setPaymentFee(29000);
        payment.setPaymentFeeUnit("KRW");
        payment.setLicenseValidMonth(1);
        return payment;
    }

    private int lockWaiters() {
        return world.db.jdbc.queryForObject("select count(*) from pg_stat_activity"
                + " where datname = current_database() and wait_event_type = 'Lock'", Integer.class);
    }

    /** 다른 세션이 끝났거나 잠금 대기에 들어갈 때까지 기다린다. */
    private static void awaitCondition(BooleanSupplier condition) throws InterruptedException {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(20);
        while (!condition.getAsBoolean()) {
            assertTrue(System.nanoTime() < deadline, "condition not reached");
            Thread.sleep(20);
        }
    }

    private String planDeleted() {
        return world.db.column("sys_payment", "delete_yn", BillingWorld.PLAN);
    }

    @Test void checkoutWaitsForAPendingPlanDeleteAndThenFails() throws Exception {
        var tx = new TransactionTemplate(world.db.transactions);
        var deleted = new CountDownLatch(1);
        var commit = new CountDownLatch(1);
        var pool = Executors.newFixedThreadPool(2);
        try {
            Future<?> delete = pool.submit(() -> tx.executeWithoutResult(status -> {
                payments.delPayment(List.of(plan()), "ADMIN-1", "ADMIN", "M");
                deleted.countDown();
                try {
                    commit.await(20, TimeUnit.SECONDS);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }));
            assertTrue(deleted.await(20, TimeUnit.SECONDS));
            Future<?> checkout = pool.submit(() -> world.client.checkout(world.owner(), BillingWorld.PLAN));
            awaitCondition(() -> checkout.isDone() || lockWaiters() > 0);
            commit.countDown();
            delete.get(20, TimeUnit.SECONDS);
            var error = assertThrows(ExecutionException.class, () -> checkout.get(20, TimeUnit.SECONDS));
            var status = ((ResponseStatusException) error.getCause()).getStatusCode();
            assertTrue(status == HttpStatus.BAD_REQUEST || status == HttpStatus.CONFLICT, status.toString());
        } finally {
            pool.shutdownNow();
        }
        assertEquals("Y", planDeleted());
        assertNull(world.column("plan_sys_id"));
        assertNull(world.column("checkout_attempt_id"));
        assertEquals(0, world.pg.snapshot().subscriptions.size());
    }

    @Test void deleteWaitsForACheckoutHoldingThePlanAndThenIs409() throws Exception {
        var tx = new TransactionTemplate(world.db.transactions);
        var locked = new CountDownLatch(1);
        var commit = new CountDownLatch(1);
        var pool = Executors.newFixedThreadPool(2);
        try {
            // 결제 시작과 같은 순서: 구독 행 → 플랜 행 잠금 → 스냅샷 쓰기, 커밋 전에 멈춘다.
            Future<?> checkout = pool.submit(() -> tx.executeWithoutResult(status -> {
                world.db.jdbc.queryForList("select sys_id from sys_subscription where sys_id = 'SUB-A' for update");
                world.db.jdbc.queryForList("select sys_id from sys_payment where sys_id = ? for update", BillingWorld.PLAN);
                world.db.jdbc.update("update sys_subscription set plan_sys_id = ? where sys_id = 'SUB-A'", BillingWorld.PLAN);
                locked.countDown();
                try {
                    commit.await(20, TimeUnit.SECONDS);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }));
            assertTrue(locked.await(20, TimeUnit.SECONDS));
            Future<?> delete = pool.submit(() -> tx.executeWithoutResult(status ->
                    payments.delPayment(List.of(plan()), "ADMIN-1", "ADMIN", "M")));
            awaitCondition(() -> lockWaiters() > 0);
            commit.countDown();
            checkout.get(20, TimeUnit.SECONDS);
            var error = assertThrows(ExecutionException.class, () -> delete.get(20, TimeUnit.SECONDS));
            assertEquals(HttpStatus.CONFLICT, ((ResponseStatusException) error.getCause()).getStatusCode());
        } finally {
            pool.shutdownNow();
        }
        assertEquals("N", planDeleted());
        assertEquals(BillingWorld.PLAN, world.column("plan_sys_id"));
    }
}
