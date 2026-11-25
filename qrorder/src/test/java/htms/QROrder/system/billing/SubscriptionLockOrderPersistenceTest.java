package htms.QROrder.system.billing;

import htms.QROrder.system.billing.domain.BillingWebhookEvent;
import htms.QROrder.system.billing.domain.Subscription;
import htms.QROrder.system.billing.domain.SubscriptionInvoice;
import htms.QROrder.system.billing.domain.SubscriptionStatus;
import htms.QROrder.system.billing.repository.BillingWebhookEventMapper;
import htms.QROrder.system.billing.repository.SubscriptionInvoiceMapper;
import htms.QROrder.system.billing.repository.SubscriptionMapper;
import htms.QROrder.system.repository.ClientUserRoleMapper;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/** 구독 Mapper SQL과 잠금 순서를 실제 PostgreSQL 두 세션으로 확인한다(정책 4C §8, §11 커밋 4). */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Execution(ExecutionMode.SAME_THREAD)
class SubscriptionLockOrderPersistenceTest {
    private static final Instant NOW = Instant.parse("2026-11-25T00:00:00Z");
    private BillingPersistenceSupport db;
    private SubscriptionMapper subscriptions;
    private SubscriptionInvoiceMapper invoices;
    private BillingWebhookEventMapper events;
    private ClientUserRoleMapper promotions;

    @BeforeAll void start() throws Exception {
        db = BillingPersistenceSupport.start("mapper/system/billing/SubscriptionMapper.xml",
                "mapper/system/billing/SubscriptionInvoiceMapper.xml",
                "mapper/system/billing/BillingWebhookEventMapper.xml",
                "mapper/system/ClientUserRoleMapper.xml");
        subscriptions = db.sql.getMapper(SubscriptionMapper.class);
        invoices = db.sql.getMapper(SubscriptionInvoiceMapper.class);
        events = db.sql.getMapper(BillingWebhookEventMapper.class);
        promotions = db.sql.getMapper(ClientUserRoleMapper.class);
    }

    @AfterAll void stop() throws Exception {
        if (db != null) db.close();
    }

    @BeforeEach void reset() {
        db.truncateAll();
        db.plant("STORE-A");
        db.plant("STORE-B");
        db.user("OWNER-A", "STORE-A", "02");
        db.user("OWNER-B", "STORE-B", "02");
    }

    @Test void insertsPendingAndFindsOnlyOpenRowPerStore() {
        db.subscription("OLD", "STORE-A", "OWNER-A", "EXPIRED", "N");
        var pending = new Subscription();
        pending.setSysId("NEW"); pending.setPlantCd("STORE-A"); pending.setOwnerUserSysId("OWNER-A");
        pending.setStatus(SubscriptionStatus.PENDING); pending.setInsertUserId("OWNER-A");
        assertEquals(1, subscriptions.insertSubscription(pending));
        var found = subscriptions.findOpenByPlant("STORE-A");
        assertEquals("NEW", found.getSysId());
        assertEquals(SubscriptionStatus.PENDING, found.getStatus());
        assertEquals("N", found.getRoleGrantedYn());
        assertEquals("NONE", found.getProviderEndStatus());
        assertNull(subscriptions.findOpenByPlant("STORE-B"));
        assertEquals(List.of("NEW"), subscriptions.lockOpenByOwners(List.of("OWNER-A", "OWNER-B"))
                .stream().map(Subscription::getSysId).toList());
    }

    @Test void grantsOnlyOwnerStaffOfSameStoreOnce() {
        db.subscription("S-A", "STORE-A", "OWNER-A", "ACTIVE", "N");
        assertEquals(1, subscriptions.grantOwnerRole("S-A", "SYSTEM"));
        assertEquals(1, subscriptions.markRoleGranted("S-A", NOW, "SYSTEM"));
        assertEquals("01", db.role("OWNER-A"));
        assertEquals(0, subscriptions.grantOwnerRole("S-A", "SYSTEM"));
        assertEquals(0, subscriptions.markRoleGranted("S-A", NOW, "SYSTEM"));
        // 다른 매장 사용자가 대표로 적힌 행은 승격하지 않는다.
        db.subscription("S-X", "STORE-B", "OWNER-A", "ACTIVE", "N");
        db.jdbc.update("update sys_user set user_role='02' where sys_id='OWNER-A'");
        assertEquals(0, subscriptions.grantOwnerRole("S-X", "SYSTEM"));
        assertEquals("02", db.role("OWNER-A"));
        assertEquals("02", db.role("OWNER-B"));
    }

    @Test void revokesOnlyRoleThisSubscriptionGrantedAndOnlyOnce() {
        db.subscription("S-A", "STORE-A", "OWNER-A", "ACTIVE", "Y");
        db.jdbc.update("update sys_user set user_role='01' where sys_id='OWNER-A'");
        assertEquals(1, subscriptions.revokeOwnerRole("S-A", "BATCH"));
        assertEquals(1, subscriptions.markRoleRevoked("S-A", NOW, "BATCH"));
        assertEquals("02", db.role("OWNER-A"));
        db.jdbc.update("update sys_user set user_role='01' where sys_id='OWNER-A'");
        assertEquals(0, subscriptions.revokeOwnerRole("S-A", "BATCH"));
        assertEquals("01", db.role("OWNER-A"));
        db.subscription("S-B", "STORE-B", "OWNER-B", "ACTIVE", "N");
        db.jdbc.update("update sys_user set user_role='01' where sys_id='OWNER-B'");
        assertEquals(0, subscriptions.revokeOwnerRole("S-B", "BATCH"));
        assertEquals("01", db.role("OWNER-B"));
    }

    @Test void invoiceAndEventRoundTripByProviderKeys() {
        db.subscription("S-A", "STORE-A", "OWNER-A", "ACTIVE", "N");
        new TransactionTemplate(db.transactions).executeWithoutResult(status -> webhookPath("S-A", "inv-1", "wh-1"));
        var invoice = invoices.lockByProviderInvoice("fake", "store-1", "inv-1");
        assertEquals(9900, invoice.getAmount());
        assertEquals(NOW, invoice.getProviderUpdatedAt());
        assertEquals("PROCESSED", events.findResult("fake", "store-1", "wh-1"));
        assertNull(events.findResult("fake", "store-2", "wh-1"));
        assertEquals("01", db.role("OWNER-A"));
        assertEquals("Y", db.column("sys_subscription", "role_granted_yn", "S-A"));
    }

    @Test void secondWebhookForSameSubscriptionWaitsOnSubscriptionRow() throws Exception {
        db.subscription("S-A", "STORE-A", "OWNER-A", "ACTIVE", "N");
        var executor = Executors.newFixedThreadPool(2);
        var firstLocked = new CountDownLatch(1);
        var releaseFirst = new CountDownLatch(1);
        try {
            Future<?> first = executor.submit(() -> new TransactionTemplate(db.transactions).executeWithoutResult(status -> {
                webhookPath("S-A", "inv-1", "wh-1");
                firstLocked.countDown();
                await(releaseFirst);
            }));
            assertTrue(firstLocked.await(5, TimeUnit.SECONDS));
            Future<SubscriptionInvoice> second = executor.submit(() -> new TransactionTemplate(db.transactions).execute(status -> {
                subscriptions.lockByProviderSubscription("fake", "store-1", "psub-S-A");
                return invoices.lockByProviderInvoice("fake", "store-1", "inv-1");
            }));
            try {
                assertTrue(waitForLockWait(), "second session did not wait on the subscription row");
                assertFalse(second.isDone());
            } finally { releaseFirst.countDown(); }
            first.get(10, TimeUnit.SECONDS);
            assertNotNull(second.get(10, TimeUnit.SECONDS), "second session must see the committed invoice");
        } finally {
            releaseFirst.countDown();
            executor.shutdownNow();
        }
    }

    @Test void webhookAndManualPromotionPathsNeverDeadlockOver20Rounds() throws Exception {
        var deadlocks = new AtomicInteger();
        var executor = Executors.newFixedThreadPool(2);
        try {
            for (int round = 0; round < 20; round++) {
                db.jdbc.update("truncate table sys_billing_webhook_event, sys_subscription_invoice, sys_subscription");
                db.jdbc.update("update sys_user set user_role='02'");
                db.subscription("S-A", "STORE-A", "OWNER-A", "ACTIVE", "N");
                var start = new CyclicBarrier(2);
                String invoiceId = "inv-" + round;
                String webhookId = "wh-" + round;
                Future<?> webhook = executor.submit(() -> run(start, deadlocks,
                        () -> webhookPath("S-A", invoiceId, webhookId)));
                Future<?> manual = executor.submit(() -> run(start, deadlocks, () -> {
                    subscriptions.lockOpenByOwners(List.of("OWNER-A"));
                    var target = promotions.lockForPromotion("OWNER-A");
                    if ("02".equals(target.getUserRole())) promotions.promote("OWNER-A", "STORE-A", "SYSTEM");
                }));
                webhook.get(15, TimeUnit.SECONDS);
                manual.get(15, TimeUnit.SECONDS);
                assertEquals("01", db.role("OWNER-A"));
            }
        } finally {
            executor.shutdownNow();
        }
        assertEquals(0, deadlocks.get());
    }

    @Test void controlReversedLockOrderIsDetectedAsDeadlock() throws Exception {
        db.subscription("S-A", "STORE-A", "OWNER-A", "ACTIVE", "N");
        var deadlocks = new AtomicInteger();
        var executor = Executors.newFixedThreadPool(2);
        var bothHoldFirstLock = new CyclicBarrier(2);
        try {
            Future<?> correct = executor.submit(() -> run(null, deadlocks, () -> {
                subscriptions.lockByProviderSubscription("fake", "store-1", "psub-S-A");
                await(bothHoldFirstLock);
                promotions.lockForPromotion("OWNER-A");
            }));
            Future<?> reversed = executor.submit(() -> run(null, deadlocks, () -> {
                promotions.lockForPromotion("OWNER-A");
                await(bothHoldFirstLock);
                subscriptions.lockOpenByOwners(List.of("OWNER-A"));
            }));
            correct.get(15, TimeUnit.SECONDS);
            reversed.get(15, TimeUnit.SECONDS);
        } finally {
            executor.shutdownNow();
        }
        assertEquals(1, deadlocks.get(), "the detector must see the reversed-order deadlock");
    }

    /** 웹훅 처리와 같은 순서: 구독 → 인보이스 → 이벤트 → 사용자. */
    private void webhookPath(String subscriptionSysId, String providerInvoiceId, String webhookId) {
        var subscription = subscriptions.lockByProviderSubscription("fake", "store-1", "psub-" + subscriptionSysId);
        if (invoices.lockByProviderInvoice("fake", "store-1", providerInvoiceId) == null) {
            var invoice = new SubscriptionInvoice();
            invoice.setSysId("I-" + providerInvoiceId); invoice.setSubscriptionSysId(subscription.getSysId());
            invoice.setProvider("fake"); invoice.setProviderStoreId("store-1"); invoice.setProviderInvoiceId(providerInvoiceId);
            invoice.setChargeKind("RECURRING"); invoice.setAmount(9900); invoice.setRefundedAmount(0);
            invoice.setCurrency("KRW"); invoice.setStatus("PAID"); invoice.setAttemptCount(1);
            invoice.setProviderUpdatedAt(NOW); invoice.setApplyResult("APPLIED"); invoice.setInsertUserId("WEBHOOK");
            invoices.insertInvoice(invoice);
        }
        var event = new BillingWebhookEvent();
        event.setSysId("E-" + webhookId); event.setProvider("fake"); event.setProviderStoreId("store-1");
        event.setWebhookId(webhookId); event.setEventType("Invoice.Paid"); event.setResourceId(providerInvoiceId);
        event.setReceivedAt(NOW); event.setProcessedAt(NOW); event.setResult("PROCESSED");
        events.insertEvent(event);
        if (subscriptions.grantOwnerRole(subscription.getSysId(), "WEBHOOK") == 1) {
            subscriptions.markRoleGranted(subscription.getSysId(), NOW, "WEBHOOK");
        }
    }

    private void run(CyclicBarrier start, AtomicInteger deadlocks, Runnable body) {
        try {
            if (start != null) start.await(5, TimeUnit.SECONDS);
            new TransactionTemplate(db.transactions).executeWithoutResult(status -> body.run());
        } catch (PessimisticLockingFailureException deadlock) {
            deadlocks.incrementAndGet();
        } catch (InterruptedException | BrokenBarrierException | TimeoutException failure) {
            throw new AssertionError(failure);
        }
    }

    private static void await(CyclicBarrier barrier) {
        try { barrier.await(5, TimeUnit.SECONDS); }
        catch (Exception failure) { throw new AssertionError(failure); }
    }

    private static void await(CountDownLatch latch) {
        try { if (!latch.await(10, TimeUnit.SECONDS)) throw new AssertionError("release timed out"); }
        catch (InterruptedException interrupted) { throw new AssertionError(interrupted); }
    }

    private boolean waitForLockWait() throws InterruptedException {
        long deadline = System.nanoTime() + Duration.ofSeconds(5).toNanos();
        while (System.nanoTime() < deadline) {
            Integer waiting = db.jdbc.queryForObject("""
                    select count(*) from pg_stat_activity where datname=current_database()
                    and application_name='qr-auth-persistence' and wait_event_type='Lock'
                    """, Integer.class);
            if (waiting != null && waiting > 0) return true;
            Thread.sleep(25);
        }
        return false;
    }
}
