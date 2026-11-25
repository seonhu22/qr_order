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
        assertEquals("ENDED", world.pg.getSubscription(firstRegistration).status());
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
        assertStatus(HttpStatus.FORBIDDEN, () -> world.client.checkout(BillingWorld.login("OTHER-A", "STORE-A"), BillingWorld.PLAN));
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

    private java.util.Map<String, Object> allRows() {
        return world.db.jdbc.queryForMap("""
                select (select string_agg(t::text, '|' order by sys_id) from sys_subscription t) subs,
                       (select string_agg(t::text, '|' order by sys_id) from sys_user t) users,
                       (select count(*) from sys_subscription_invoice) invoices,
                       (select count(*) from sys_billing_webhook_event) events
                """);
    }

    @Test void staffCheckoutOnExpiredAttemptIs403BeforeReconcileAndWritesNothing() {
        world.autoDeliver = false;
        world.checkoutAndPay(CardScenario.SUCCESS);
        world.clock.advance(Duration.ofMinutes(11));
        var staff = BillingWorld.login("STAFF-A", "STORE-A");
        var before = allRows();
        assertStatus(HttpStatus.FORBIDDEN, () -> world.client.checkout(staff, BillingWorld.PLAN));
        assertStatus(HttpStatus.FORBIDDEN, () -> world.client.checkout(staff, "NO-PLAN"));
        assertEquals(before, allRows());
        assertEquals("PENDING", world.column("status"));
        assertEquals("02", world.db.role("OWNER-A"));
    }

    @Test void staffCheckoutOnExpiredSubscriptionIs403AndWritesNothing() {
        world.db.jdbc.update("update sys_subscription set status='EXPIRED', provider_end_status='DONE'");
        var before = allRows();
        assertStatus(HttpStatus.FORBIDDEN,
                () -> world.client.checkout(BillingWorld.login("STAFF-A", "STORE-A"), BillingWorld.PLAN));
        assertEquals(before, allRows());
        assertEquals(1, world.count("sys_subscription"));
    }

    private htms.QROrder.system.billing.service.ClientSubscriptionService clientWith(
            htms.QROrder.system.billing.provider.BillingProvider provider) {
        return new htms.QROrder.system.billing.service.ClientSubscriptionService(world.subscriptions(), world.invoices(),
                new htms.QROrder.system.billing.provider.BillingProviderRegistry(java.util.List.of(provider)),
                world.webhooks, world.lifecycle, world.db.transactions,
                new org.springframework.mock.env.MockEnvironment(), world.clock);
    }

    private java.util.Map<String, Object> attempt() {
        return world.db.jdbc.queryForMap("select checkout_attempt_id, provider_customer_id, provider_subscription_id,"
                + " status from sys_subscription where sys_id='SUB-A'");
    }

    /** QA B1: 첫 웹훅 유실 → 시도 만료 → 제공자 조회 실패 중 결제 시작 = 503, 기존 등록 유지, 중복 결제 0. */
    @Test void expiredAttemptReconcileFailureIs503AndKeepsProviderIds() {
        world.autoDeliver = false;
        world.checkoutAndPay(CardScenario.SUCCESS);
        world.clock.advance(Duration.ofMinutes(11));
        var before = attempt();
        world.pg.failNextLookups(1);
        assertStatus(HttpStatus.SERVICE_UNAVAILABLE, () -> world.client.checkout(world.owner(), BillingWorld.PLAN));
        assertEquals(before, attempt());
        assertEquals(1, world.pg.snapshot().subscriptions.size());

        // 조회가 돌아오면 놓친 결제를 반영하고 새 등록은 만들지 않는다.
        assertStatus(HttpStatus.CONFLICT, () -> world.client.checkout(world.owner(), BillingWorld.PLAN));
        assertEquals("ACTIVE", world.column("status"));
        assertEquals("01", world.db.role("OWNER-A"));
        assertEquals(1, world.pg.snapshot().subscriptions.size());
        assertEquals(1, world.pg.snapshot().invoices.size());
    }

    @Test void oldRegistrationEndFailureIs503AndKeepsProviderIds() {
        world.client.checkout(world.owner(), BillingWorld.PLAN);
        world.clock.advance(Duration.ofMinutes(11));
        var before = attempt();
        var endFails = new ForwardingBillingProvider(world.pg) {
            @Override public void endSubscription(String id) {
                throw new htms.QROrder.system.billing.provider.ProviderUnavailableException("down");
            }
        };
        assertStatus(HttpStatus.SERVICE_UNAVAILABLE, () -> clientWith(endFails).checkout(world.owner(), BillingWorld.PLAN));
        assertEquals(before, attempt());
        assertEquals("INCOMPLETE", world.pg.getSubscription((String) before.get("provider_subscription_id")).status());
    }

    @Test void oldRegistrationIsReplacedOnlyIfTheSameAttemptIsStillThereUnderLock() {
        world.client.checkout(world.owner(), BillingWorld.PLAN);
        world.clock.advance(Duration.ofMinutes(11));
        var replacedMeanwhile = new ForwardingBillingProvider(world.pg) {
            @Override public void endSubscription(String id) {
                super.endSubscription(id);
                world.db.jdbc.update("update sys_subscription set checkout_attempt_id='att_other' where sys_id='SUB-A'");
            }
        };
        assertStatus(HttpStatus.CONFLICT, () -> clientWith(replacedMeanwhile).checkout(world.owner(), BillingWorld.PLAN));
        assertEquals("att_other", world.column("checkout_attempt_id"));
        assertEquals(1, world.pg.snapshot().subscriptions.size());
    }

    /** 대사 뒤 종료 직전에 옛 실패 인보이스가 재결제되고 웹훅이 유실됨 → 종료 뒤 다시 대사해 반영, 새 시도로 바꾸지 않는다. */
    @Test void oldFailedInvoiceRepaidRightBeforeEndIsReconciledInsteadOfReplaced() {
        String failed = world.checkoutAndPay(CardScenario.DECLINED);
        world.clock.advance(Duration.ofMinutes(11));
        var before = attempt();
        var repaidBeforeEnd = new ForwardingBillingProvider(world.pg) {
            @Override public void endSubscription(String id) {
                world.autoDeliver = false;
                world.pg.retryInvoice(failed, true);
                super.endSubscription(id);
            }
        };
        assertStatus(HttpStatus.CONFLICT, () -> clientWith(repaidBeforeEnd).checkout(world.owner(), BillingWorld.PLAN));
        assertEquals(before.get("checkout_attempt_id"), world.column("checkout_attempt_id"));
        assertEquals(before.get("provider_subscription_id"), world.column("provider_subscription_id"));
        assertEquals("ACTIVE", world.column("status"));
        assertEquals("01", world.db.role("OWNER-A"));
        assertEquals(1, world.pg.snapshot().subscriptions.size());
    }

    /** 종료 뒤 대사에서 제공자에 결제 진행 중(PENDING) 인보이스가 있으면 교체하지 않는다. */
    @Test void openInvoiceFoundAfterEndBlocksReplacement() {
        world.client.checkout(world.owner(), BillingWorld.PLAN);
        world.clock.advance(Duration.ofMinutes(11));
        var before = attempt();
        String psid = (String) before.get("provider_subscription_id");
        var openAfterEnd = new ForwardingBillingProvider(world.pg) {
            boolean ended;
            @Override public void endSubscription(String id) {
                super.endSubscription(id);
                ended = true;
            }
            @Override public java.util.List<htms.QROrder.system.billing.provider.BillingModels.ProviderInvoice> listInvoices(
                    String id) {
                if (!ended) return super.listInvoices(id);
                var sub = world.pg.getSubscription(psid);
                return java.util.List.of(new htms.QROrder.system.billing.provider.BillingModels.ProviderInvoice(
                        world.pg.storeId(), "inv_open", psid, sub.customerId(), sub.productId(), "RECURRING", "CARD",
                        29000, 0, "KRW", "PENDING", 1, world.clock.instant(), world.clock.instant().plus(Duration.ofDays(30)),
                        null, world.clock.instant(), null));
            }
        };
        assertStatus(HttpStatus.CONFLICT, () -> clientWith(openAfterEnd).checkout(world.owner(), BillingWorld.PLAN));
        assertEquals(before.get("checkout_attempt_id"), world.column("checkout_attempt_id"));
        assertEquals(psid, world.column("provider_subscription_id"));
        assertEquals("PENDING", world.column("status"));
        assertEquals(1, world.pg.snapshot().subscriptions.size());
    }

    /** 만료된 시도의 대사에서 목록 인보이스 고객이 저장 고객과 다르면 연결 미확인: 503, 옛 등록 유지(교체/종료 없음). */
    @Test void expiredAttemptWithAnInvoiceOfAnotherCustomerIs503AndKeepsProviderIds() {
        world.checkoutAndPay(CardScenario.DECLINED);
        world.clock.advance(Duration.ofMinutes(11));
        var before = attempt();
        var otherCustomer = new ForwardingBillingProvider(world.pg) {
            @Override public java.util.List<htms.QROrder.system.billing.provider.BillingModels.ProviderInvoice> listInvoices(
                    String id) {
                return super.listInvoices(id).stream().map(i -> withCustomer(i, "cus_other")).toList();
            }
        };
        assertStatus(HttpStatus.SERVICE_UNAVAILABLE, () -> clientWith(otherCustomer).checkout(world.owner(), BillingWorld.PLAN));
        assertEquals(before, attempt());
        assertEquals("INCOMPLETE", world.pg.getSubscription((String) before.get("provider_subscription_id")).status());
        assertEquals(1, world.pg.snapshot().subscriptions.size());
    }

    /** QA B2 앞부분: 금액 불일치로 결제만 되고 PENDING인 시도가 만료된 뒤 결제 시작 → 결제가 된 옛 등록도 먼저 ENDED. */
    private String paidMismatchThenAttemptExpires() {
        var launch = world.client.checkout(world.owner(), BillingWorld.PLAN);
        world.db.jdbc.update("update sys_subscription set amount = amount + 1000 where sys_id='SUB-A'");
        world.pg.pay(BillingWorld.token(launch), "OWNER-A", CardScenario.SUCCESS);
        assertEquals("MISMATCH", world.db.jdbc.queryForObject(
                "select apply_result from sys_subscription_invoice", String.class));
        assertEquals("PENDING", world.column("status"));
        world.clock.advance(Duration.ofMinutes(11));
        return world.column("provider_subscription_id");
    }

    @Test void paidMismatchOldRegistrationIsEndedBeforeTheNewAttempt() {
        String old = paidMismatchThenAttemptExpires();
        world.client.checkout(world.owner(), BillingWorld.PLAN);
        assertEquals("ENDED", world.pg.getSubscription(old).status());
        assertNotEquals(old, world.column("provider_subscription_id"));
        assertEquals("29000", world.column("amount"));
        assertThrows(IllegalStateException.class, () -> world.pg.chargeNextPeriod(old, true));
        // 결제된 옛 인보이스는 이 구독의 문제 건(환불 대상)으로 남는다.
        assertEquals(1, world.subscriptions().findAdminRow("SUB-A").getProblemCount());
    }

    /** QA B2 뒷부분: 종료되지 않고 연결이 끊긴 옛 등록(수정 전 데이터)의 다음 회차 청구는 이 구독의 문제 건으로 남는다. */
    @Test void chargeOnUnlinkedOldRegistrationIsRecordedAsAProblemRow() {
        String old = paidMismatchThenAttemptExpires();
        world.db.jdbc.update("""
                update sys_subscription set provider_subscription_id = null, provider_customer_id = null,
                  checkout_attempt_id = 'att_new', checkout_expires_at = null where sys_id='SUB-A'
                """);
        String charged = world.pg.chargeNextPeriod(old, true);
        var invoice = world.db.jdbc.queryForMap(
                "select subscription_sys_id, status, apply_result from sys_subscription_invoice where provider_invoice_id=?",
                charged);
        assertEquals("SUB-A", invoice.get("subscription_sys_id"));
        assertEquals("PAID", invoice.get("status"));
        assertEquals("MISMATCH", invoice.get("apply_result"));
        assertEquals(1, world.db.jdbc.queryForObject("select count(*) from sys_billing_webhook_event"
                + " where result = 'MISMATCH' and resource_id = ?", Integer.class, charged));
        assertEquals(0, world.db.jdbc.queryForObject(
                "select count(*) from sys_billing_webhook_event where result = 'IGNORED'", Integer.class));
        assertEquals("PENDING", world.column("status"));
        assertEquals("02", world.db.role("OWNER-A"));
        assertEquals(2, world.subscriptions().findAdminRow("SUB-A").getProblemCount());
        assertEquals(1, world.admin.list(null, true).mismatchEvents().size());
    }

    @Test void parallelCheckoutStartsResumeOneAttemptAndOneRegistration() throws Exception {
        int n = 8;
        var pool = java.util.concurrent.Executors.newFixedThreadPool(n);
        var gate = new java.util.concurrent.CountDownLatch(1);
        try {
            var futures = new java.util.ArrayList<java.util.concurrent.Future<String>>();
            for (int i = 0; i < n; i++) {
                futures.add(pool.submit(() -> {
                    gate.await();
                    return BillingWorld.token(world.client.checkout(world.owner(), BillingWorld.PLAN));
                }));
            }
            gate.countDown();
            var tokens = new java.util.HashSet<String>();
            for (var f : futures) tokens.add(f.get(30, java.util.concurrent.TimeUnit.SECONDS));
            assertEquals(1, tokens.size());
        } finally {
            pool.shutdownNow();
        }
        assertEquals(1, world.pg.snapshot().subscriptions.size());
        assertEquals(world.pg.snapshot().subscriptions.keySet().iterator().next(), world.column("provider_subscription_id"));
    }

    @Test void lostRegistrationResponseIsResumedWithTheSameKey() {
        var lost = new ForwardingBillingProvider(world.pg) {
            boolean dropped;
            @Override public htms.QROrder.system.billing.provider.BillingModels.CheckoutLaunch startCheckout(
                    htms.QROrder.system.billing.provider.BillingModels.CheckoutRequest request) {
                var launch = super.startCheckout(request);
                if (!dropped) {
                    dropped = true;
                    throw new htms.QROrder.system.billing.provider.ProviderUnavailableException("response lost");
                }
                return launch;
            }
        };
        var service = clientWith(lost);
        assertStatus(HttpStatus.SERVICE_UNAVAILABLE, () -> service.checkout(world.owner(), BillingWorld.PLAN));
        String attempt = world.column("checkout_attempt_id");
        assertNotNull(attempt);
        assertNull(world.column("provider_subscription_id"));
        assertEquals(1, world.pg.snapshot().subscriptions.size());

        service.checkout(world.owner(), BillingWorld.PLAN);
        assertEquals(attempt, world.column("checkout_attempt_id"));
        assertEquals(world.pg.snapshot().subscriptions.keySet().iterator().next(), world.column("provider_subscription_id"));
        assertEquals(1, world.pg.snapshot().subscriptions.size());
    }

    @Test void lostRegistrationOfAnExpiredAttemptIsRecoveredAndEndedBeforeANewAttempt() {
        var lost = new ForwardingBillingProvider(world.pg) {
            boolean dropped;
            @Override public htms.QROrder.system.billing.provider.BillingModels.CheckoutLaunch startCheckout(
                    htms.QROrder.system.billing.provider.BillingModels.CheckoutRequest request) {
                var launch = super.startCheckout(request);
                if (!dropped) {
                    dropped = true;
                    throw new htms.QROrder.system.billing.provider.ProviderUnavailableException("response lost");
                }
                return launch;
            }
        };
        assertStatus(HttpStatus.SERVICE_UNAVAILABLE, () -> clientWith(lost).checkout(world.owner(), BillingWorld.PLAN));
        String attempt = world.column("checkout_attempt_id");
        String orphan = world.pg.snapshot().subscriptions.keySet().iterator().next();
        world.clock.advance(Duration.ofMinutes(11));
        world.client.checkout(world.owner(), BillingWorld.PLAN);
        assertNotEquals(attempt, world.column("checkout_attempt_id"));
        assertEquals("ENDED", world.pg.getSubscription(orphan).status());
        assertNotEquals(orphan, world.column("provider_subscription_id"));
        assertEquals(2, world.pg.snapshot().subscriptions.size());
    }

    @Test void registrationArrivingAfterCancelIsEnded() throws Exception {
        var entered = new java.util.concurrent.CountDownLatch(1);
        var release = new java.util.concurrent.CountDownLatch(1);
        var slow = new ForwardingBillingProvider(world.pg) {
            @Override public htms.QROrder.system.billing.provider.BillingModels.CheckoutLaunch startCheckout(
                    htms.QROrder.system.billing.provider.BillingModels.CheckoutRequest request) {
                entered.countDown();
                try {
                    release.await(20, java.util.concurrent.TimeUnit.SECONDS);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                return super.startCheckout(request);
            }
        };
        var pool = java.util.concurrent.Executors.newSingleThreadExecutor();
        try {
            var checkout = pool.submit(() -> clientWith(slow).checkout(world.owner(), BillingWorld.PLAN));
            assertTrue(entered.await(20, java.util.concurrent.TimeUnit.SECONDS));
            assertEquals("EXPIRED", world.client.cancel(world.owner()).status());
            release.countDown();
            var error = assertThrows(java.util.concurrent.ExecutionException.class,
                    () -> checkout.get(30, java.util.concurrent.TimeUnit.SECONDS));
            assertEquals(HttpStatus.CONFLICT, ((ResponseStatusException) error.getCause()).getStatusCode());
        } finally {
            pool.shutdownNow();
        }
        String late = world.pg.snapshot().subscriptions.keySet().iterator().next();
        assertEquals("ENDED", world.pg.getSubscription(late).status());
        assertEquals(late, world.column("provider_subscription_id"));
        assertEquals("DONE", world.column("provider_end_status"));
        assertEquals("EXPIRED", world.column("status"));
    }

    @Test void twoConcurrentReconcilesCallTheProviderOnceAndTheOtherIs429() throws Exception {
        world.autoDeliver = false;
        world.checkoutAndPay(CardScenario.SUCCESS);
        var calls = new java.util.concurrent.atomic.AtomicInteger();
        var slow = new ForwardingBillingProvider(world.pg) {
            @Override public htms.QROrder.system.billing.provider.BillingModels.ProviderSubscription getSubscription(String id) {
                calls.incrementAndGet();
                try {
                    Thread.sleep(300);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                return super.getSubscription(id);
            }
        };
        var service = clientWith(slow);
        var pool = java.util.concurrent.Executors.newFixedThreadPool(2);
        var gate = new java.util.concurrent.CountDownLatch(1);
        try {
            var results = new java.util.ArrayList<java.util.concurrent.Future<HttpStatus>>();
            for (int i = 0; i < 2; i++) {
                results.add(pool.submit(() -> {
                    gate.await();
                    try {
                        service.reconcile(world.owner());
                        return HttpStatus.OK;
                    } catch (ResponseStatusException e) {
                        return HttpStatus.valueOf(e.getStatusCode().value());
                    }
                }));
            }
            gate.countDown();
            var statuses = new java.util.ArrayList<HttpStatus>();
            for (var r : results) statuses.add(r.get(30, java.util.concurrent.TimeUnit.SECONDS));
            assertTrue(statuses.contains(HttpStatus.OK), statuses.toString());
            assertTrue(statuses.contains(HttpStatus.TOO_MANY_REQUESTS), statuses.toString());
        } finally {
            pool.shutdownNow();
        }
        assertEquals(1, calls.get());
        assertEquals("ACTIVE", world.column("status"));
    }
}
