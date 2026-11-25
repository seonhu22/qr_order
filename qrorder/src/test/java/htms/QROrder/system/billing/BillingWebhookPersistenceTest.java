package htms.QROrder.system.billing;

import htms.QROrder.system.billing.fake.FakeBillingProvider;
import htms.QROrder.system.billing.fake.FakeBillingProvider.CardScenario;
import htms.QROrder.system.billing.fake.FakeBillingProvider.ForgeMode;
import htms.QROrder.system.billing.provider.BillingModels;
import htms.QROrder.system.billing.provider.BillingModels.CheckoutLaunch;
import htms.QROrder.system.billing.provider.BillingModels.CheckoutRequest;
import htms.QROrder.system.billing.provider.BillingModels.ProviderInvoice;
import htms.QROrder.system.billing.provider.BillingModels.ProviderSubscription;
import htms.QROrder.system.billing.provider.BillingProvider;
import htms.QROrder.system.billing.repository.BillingWebhookEventMapper;
import htms.QROrder.system.billing.repository.SubscriptionInvoiceMapper;
import htms.QROrder.system.billing.repository.SubscriptionMapper;
import htms.QROrder.system.billing.service.BillingWebhookService;
import htms.QROrder.system.billing.service.BillingWebhookService.Outcome;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.springframework.mock.env.MockEnvironment;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.sql.Timestamp;
import java.time.Clock;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.function.UnaryOperator;

import static org.junit.jupiter.api.Assertions.*;

/** 웹훅 수신 + Paid 적용 + 승격을 실제 PostgreSQL에서 확인한다(정책 4C §7, §11 행 9). */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Execution(ExecutionMode.SAME_THREAD)
class BillingWebhookPersistenceTest {
    private BillingPersistenceSupport db;
    private BillingWebhookService webhooks;
    @TempDir Path dir;
    private FakeBillingProvider pg;
    private final List<Sent> sent = Collections.synchronizedList(new ArrayList<>());
    private CheckoutLaunch launch;

    record Sent(Map<String, String> headers, String body) {}

    @BeforeAll void start() throws Exception {
        db = BillingPersistenceSupport.start("mapper/system/billing/SubscriptionMapper.xml",
                "mapper/system/billing/SubscriptionInvoiceMapper.xml",
                "mapper/system/billing/BillingWebhookEventMapper.xml");
        webhooks = new BillingWebhookService(db.sql.getMapper(SubscriptionMapper.class),
                db.sql.getMapper(SubscriptionInvoiceMapper.class), db.sql.getMapper(BillingWebhookEventMapper.class),
                new htms.QROrder.system.billing.service.SubscriptionLifecycleService(db.sql.getMapper(SubscriptionMapper.class),
                        new htms.QROrder.system.billing.provider.BillingProviderRegistry(List.of()), db.transactions),
                db.transactions, new MockEnvironment());
    }

    @AfterAll void stop() throws Exception {
        if (db != null) db.close();
    }

    @BeforeEach void reset() {
        db.truncateAll();
        sent.clear();
        pg = new FakeBillingProvider(dir.resolve("state-" + System.nanoTime() + ".json"), "store-test",
                FakeBillingProviderTest.SECRET, "http://localhost:8080", Clock.systemUTC(),
                (headers, body) -> { sent.add(new Sent(headers, body)); return 200; });
        db.plant("STORE-A");
        db.user("OWNER-A", "STORE-A", "02");
        db.jdbc.update("""
                insert into sys_payment(sys_id, payment_cd, payment_nm, payment_fee, payment_fee_unit,
                  license_valid_month, insert_user_id, insert_datetime, sys_plant_cd, delete_yn)
                values ('PLAN-1', 'BASIC_MONTHLY', '기본 월간', 29000, 'KRW', 1, 'T', now(), 'ADMIN', 'N')
                """);
        launch = pg.startCheckout(new CheckoutRequest("SUB-A", "OWNER-A", "STORE-A", "BASIC_MONTHLY",
                29000, "KRW", 1, "att-1"));
        db.jdbc.update("""
                insert into sys_subscription(sys_id, plant_cd, owner_user_sys_id, plan_sys_id, amount, currency,
                  period_month, provider, provider_store_id, provider_customer_id, provider_subscription_id,
                  status, role_granted_yn, insert_user_id, insert_datetime)
                values ('SUB-A', 'STORE-A', 'OWNER-A', 'PLAN-1', 29000, 'KRW', 1, 'fake', 'store-test', ?, ?,
                  'PENDING', 'N', 'T', now())
                """, launch.providerCustomerId(), launch.providerSubscriptionId());
    }

    private String token() {
        String url = launch.launch().get("redirectUrl");
        return url.substring(url.indexOf("token=") + 6);
    }

    private Outcome deliver(Sent message) {
        return webhooks.handle(pg, message.headers(), message.body().getBytes(StandardCharsets.UTF_8));
    }

    private Sent last() {
        return sent.get(sent.size() - 1);
    }

    private int count(String table) {
        return db.jdbc.queryForObject("select count(*) from " + table, Integer.class);
    }

    @Test void paidWebhookActivatesSubscriptionAndPromotesOwnerInOneTransaction() {
        var paid = pg.pay(token(), "OWNER-A", CardScenario.SUCCESS);
        assertEquals(Outcome.OK, deliver(last()));

        assertEquals("ACTIVE", db.column("sys_subscription", "status", "SUB-A"));
        assertEquals("Y", db.column("sys_subscription", "role_granted_yn", "SUB-A"));
        assertNotNull(db.column("sys_subscription", "role_granted_at", "SUB-A"));
        // PostgreSQL timestamptz는 마이크로초로 반올림해 저장한다.
        var periodEnd = pg.getInvoice(paid.invoiceId()).periodEndAt();
        var paidThrough = db.jdbc.queryForObject("select paid_through_at from sys_subscription", Timestamp.class).toInstant();
        assertTrue(java.time.Duration.between(periodEnd, paidThrough).abs().toNanos() <= 1_000, paidThrough.toString());
        assertEquals("01", db.role("OWNER-A"));
        assertEquals(1, db.jdbc.queryForObject("select count(*) from sys_user where user_role='01'", Integer.class));
        var invoice = db.jdbc.queryForMap("select * from sys_subscription_invoice");
        assertEquals("PAID", invoice.get("status"));
        assertEquals("APPLIED", invoice.get("apply_result"));
        assertEquals(29000, invoice.get("amount"));
        assertEquals("PROCESSED", db.jdbc.queryForObject("select result from sys_billing_webhook_event", String.class));
        assertEquals(1, count("sys_billing_webhook_event"));
    }

    @Test void replayAndResendChangeNothing() {
        pg.pay(token(), "OWNER-A", CardScenario.SUCCESS);
        var first = last();
        assertEquals(Outcome.OK, deliver(first));
        var before = db.jdbc.queryForMap("select s.modify_datetime s_mod, u.modify_datetime u_mod, s.paid_through_at"
                + " from sys_subscription s join sys_user u on u.sys_id = s.owner_user_sys_id");
        assertEquals(Outcome.OK, deliver(first));
        pg.resend(first.headers().get("webhook-id"));
        assertEquals(first.headers().get("webhook-id"), last().headers().get("webhook-id"));
        assertEquals(2, sent.size());
        assertEquals(Outcome.OK, deliver(last()));
        var after = db.jdbc.queryForMap("select s.modify_datetime s_mod, u.modify_datetime u_mod, s.paid_through_at"
                + " from sys_subscription s join sys_user u on u.sys_id = s.owner_user_sys_id");
        assertEquals(before, after);
        assertEquals(1, count("sys_subscription_invoice"));
        assertEquals(1, count("sys_billing_webhook_event"));
    }

    @Test void forgedWebhookIs401AndWritesNothing() {
        pg.pay(token(), "OWNER-A", CardScenario.SUCCESS);
        String id = last().headers().get("webhook-id");
        pg.forge(id, ForgeMode.BAD_SIGNATURE);
        assertEquals(Outcome.UNAUTHORIZED, deliver(last()));
        pg.forge(id, ForgeMode.STALE_TIMESTAMP);
        assertEquals(Outcome.UNAUTHORIZED, deliver(last()));
        var tampered = new Sent(sent.get(0).headers(), sent.get(0).body().replace("store-test", "store-other"));
        assertEquals(Outcome.UNAUTHORIZED, deliver(tampered));
        assertEquals(0, count("sys_subscription_invoice"));
        assertEquals(0, count("sys_billing_webhook_event"));
        assertEquals("02", db.role("OWNER-A"));
        assertEquals("PENDING", db.column("sys_subscription", "status", "SUB-A"));
    }

    @Test void amountMismatchRecordsMismatchWithoutPromotion() {
        db.jdbc.update("update sys_subscription set amount = 30000");
        pg.pay(token(), "OWNER-A", CardScenario.SUCCESS);
        assertEquals(Outcome.OK, deliver(last()));
        assertEquals("MISMATCH", db.jdbc.queryForObject("select apply_result from sys_subscription_invoice", String.class));
        assertEquals("PENDING", db.column("sys_subscription", "status", "SUB-A"));
        assertEquals("N", db.column("sys_subscription", "role_granted_yn", "SUB-A"));
        assertEquals("02", db.role("OWNER-A"));
        assertEquals(1, count("sys_billing_webhook_event"));
    }

    @Test void productMismatchAlsoBlocksPromotion() {
        db.jdbc.update("update sys_payment set payment_cd = 'PREMIUM_MONTHLY'");
        pg.pay(token(), "OWNER-A", CardScenario.SUCCESS);
        assertEquals(Outcome.OK, deliver(last()));
        assertEquals("MISMATCH", db.jdbc.queryForObject("select apply_result from sys_subscription_invoice", String.class));
        assertEquals("02", db.role("OWNER-A"));
    }

    @Test void providerLookupFailureIs503WithNoRowsAndResendSucceeds() {
        pg.pay(token(), "OWNER-A", CardScenario.SUCCESS);
        pg.failNextLookups(1);
        assertEquals(Outcome.UNAVAILABLE, deliver(last()));
        assertEquals(0, count("sys_subscription_invoice"));
        assertEquals(0, count("sys_billing_webhook_event"));
        assertEquals("02", db.role("OWNER-A"));
        pg.resend(last().headers().get("webhook-id"));
        assertEquals(Outcome.OK, deliver(last()));
        assertEquals("ACTIVE", db.column("sys_subscription", "status", "SUB-A"));
        assertEquals("01", db.role("OWNER-A"));
    }

    @Test void chargeOfUnknownSubscriptionIsAMismatchProblemOnce() {
        db.jdbc.update("update sys_subscription set provider_subscription_id = 'sub_other'");
        pg.pay(token(), "OWNER-A", CardScenario.SUCCESS);
        assertEquals(Outcome.OK, deliver(last()));
        // 우리 상점에서 결제됐는데 연결된 구독이 없다: 조용히 IGNORED가 아니라 Admin 불일치 웹훅으로 남긴다.
        assertEquals("MISMATCH", db.jdbc.queryForObject("select result from sys_billing_webhook_event", String.class));
        assertEquals("PENDING", db.column("sys_subscription", "status", "SUB-A"));
        assertEquals("02", db.role("OWNER-A"));
        assertEquals(0, count("sys_subscription_invoice"));
        assertEquals(Outcome.OK, deliver(last()));
        assertEquals(1, count("sys_billing_webhook_event"));
    }

    @Test void ownerAlreadyPermanent01StaysUngranted() {
        db.jdbc.update("update sys_user set user_role = '01' where sys_id = 'OWNER-A'");
        pg.pay(token(), "OWNER-A", CardScenario.SUCCESS);
        assertEquals(Outcome.OK, deliver(last()));
        assertEquals("ACTIVE", db.column("sys_subscription", "status", "SUB-A"));
        assertEquals("N", db.column("sys_subscription", "role_granted_yn", "SUB-A"));
        assertEquals("01", db.role("OWNER-A"));
    }

    @Test void deletedOwnerIsRecordedAsOwnerMissing() {
        db.jdbc.update("update sys_user set delete_yn = 'Y' where sys_id = 'OWNER-A'");
        pg.pay(token(), "OWNER-A", CardScenario.SUCCESS);
        assertEquals(Outcome.OK, deliver(last()));
        assertEquals("OWNER_MISSING", db.jdbc.queryForObject("select apply_result from sys_subscription_invoice", String.class));
        assertEquals("N", db.column("sys_subscription", "role_granted_yn", "SUB-A"));
        assertEquals("02", db.role("OWNER-A"));
    }

    @Test void failedFirstPaymentIsRecordedThenRetrySuccessPromotes() {
        var failed = pg.pay(token(), "OWNER-A", CardScenario.DECLINED);
        assertEquals(Outcome.OK, deliver(last()));
        assertEquals("FAILED", db.jdbc.queryForObject("select status from sys_subscription_invoice", String.class));
        assertEquals("PENDING", db.column("sys_subscription", "status", "SUB-A"));
        assertEquals("02", db.role("OWNER-A"));
        pg.retryInvoice(failed.invoiceId(), true);
        assertEquals(Outcome.OK, deliver(last()));
        var invoice = db.jdbc.queryForMap("select status, attempt_count, apply_result from sys_subscription_invoice");
        assertEquals("PAID", invoice.get("status"));
        assertEquals(2, invoice.get("attempt_count"));
        assertEquals("APPLIED", invoice.get("apply_result"));
        assertEquals("01", db.role("OWNER-A"));
        assertEquals(2, count("sys_billing_webhook_event"));
    }

    @Test void subscriptionEventIsIgnored() {
        pg.pay(token(), "OWNER-A", CardScenario.SUCCESS);
        assertEquals(Outcome.OK, deliver(last()));
        pg.endSubscription(launch.providerSubscriptionId());
        assertEquals(Outcome.OK, deliver(last()));
        assertEquals(1, db.jdbc.queryForObject(
                "select count(*) from sys_billing_webhook_event where result='IGNORED'", Integer.class));
        assertEquals("ACTIVE", db.column("sys_subscription", "status", "SUB-A"));
    }

    @Test void concurrentDuplicateDeliveriesPromoteOnce() throws Exception {
        pg.pay(token(), "OWNER-A", CardScenario.SUCCESS);
        var message = last();
        var executor = Executors.newFixedThreadPool(4);
        var startGate = new CountDownLatch(1);
        try {
            List<Future<Outcome>> results = new ArrayList<>();
            for (int i = 0; i < 4; i++) {
                results.add(executor.submit(() -> { startGate.await(); return deliver(message); }));
            }
            startGate.countDown();
            for (var result : results) assertEquals(Outcome.OK, result.get(20, TimeUnit.SECONDS));
        } finally {
            executor.shutdownNow();
        }
        assertEquals(1, count("sys_subscription_invoice"));
        assertEquals(1, count("sys_billing_webhook_event"));
        assertEquals("01", db.role("OWNER-A"));
        assertEquals("Y", db.column("sys_subscription", "role_granted_yn", "SUB-A"));
    }

    /** 재조회 결과만 바꿔 돌려주는 제공자. 서명 검증/본문 해석은 진짜 가짜 PG 그대로. */
    private BillingProvider lookupReturns(UnaryOperator<ProviderInvoice> change) {
        return new BillingProvider() {
            public String name() { return pg.name(); }
            public String storeId() { return pg.storeId(); }
            public CheckoutLaunch startCheckout(CheckoutRequest request) { return pg.startCheckout(request); }
            public ProviderSubscription getSubscription(String id) { return pg.getSubscription(id); }
            public ProviderInvoice getInvoice(String id) { return change.apply(pg.getInvoice(id)); }
            public List<ProviderInvoice> listInvoices(String id) { return pg.listInvoices(id).stream().map(change).toList(); }
            public CheckoutLaunch reregisterPaymentMethod(String id, String owner) { return pg.reregisterPaymentMethod(id, owner); }
            public void endSubscription(String id) { pg.endSubscription(id); }
            public void refund(String id, int amount, String reason) { pg.refund(id, amount, reason); }
            public BillingModels.BillingNotice verifyAndParseWebhook(Map<String, String> headers, byte[] body) {
                return pg.verifyAndParseWebhook(headers, body);
            }
        };
    }

    private static ProviderInvoice copy(ProviderInvoice i, String invoiceId, String subscriptionId, String customerId) {
        return new ProviderInvoice(i.storeId(), invoiceId, subscriptionId, customerId, i.productId(), i.chargeKind(),
                i.paymentMethod(), i.amount(), i.refundedAmount(), i.currency(), i.status(), i.attemptCount(),
                i.periodStartAt(), i.periodEndAt(), i.paidAt(), i.updatedAt(), i.failureCode());
    }

    private Outcome deliverVia(BillingProvider provider, Sent message) {
        return provider == null ? deliver(message)
                : webhooks.handle(provider, message.headers(), message.body().getBytes(StandardCharsets.UTF_8));
    }

    private void otherStoreSubscription() {
        db.plant("STORE-B");
        db.user("OWNER-B", "STORE-B", "02");
        db.jdbc.update("""
                insert into sys_subscription(sys_id, plant_cd, owner_user_sys_id, plan_sys_id, amount, currency,
                  period_month, provider, provider_store_id, provider_customer_id, provider_subscription_id,
                  status, role_granted_yn, insert_user_id, insert_datetime)
                values ('SUB-B', 'STORE-B', 'OWNER-B', 'PLAN-1', 29000, 'KRW', 1, 'fake', 'store-test', 'cus_B',
                  'psub-B', 'PENDING', 'N', 'T', now())
                """);
    }

    private void assertMismatchChangedNothing() {
        assertEquals("MISMATCH", db.jdbc.queryForObject("select result from sys_billing_webhook_event", String.class));
        assertEquals("PENDING", db.column("sys_subscription", "status", "SUB-A"));
        assertEquals("N", db.column("sys_subscription", "role_granted_yn", "SUB-A"));
        assertEquals("02", db.role("OWNER-A"));
    }

    @Test void lookedUpInvoiceIdOtherThanSignedIdIsMismatch() {
        pg.pay(token(), "OWNER-A", CardScenario.SUCCESS);
        var lying = lookupReturns(i -> copy(i, "inv_other", i.subscriptionId(), i.customerId()));
        assertEquals(Outcome.OK, deliverVia(lying, last()));
        assertMismatchChangedNothing();
        assertEquals(0, count("sys_subscription_invoice"));
    }

    @Test void lookedUpInvoiceOfAnotherSubscriptionIsMismatchAndOtherRowsStay() {
        otherStoreSubscription();
        pg.pay(token(), "OWNER-A", CardScenario.SUCCESS);
        var lying = lookupReturns(i -> copy(i, i.invoiceId(), "psub-B", "cus_B"));
        assertEquals(Outcome.OK, deliverVia(lying, last()));
        assertMismatchChangedNothing();
        assertEquals("PENDING", db.column("sys_subscription", "status", "SUB-B"));
        assertEquals("02", db.role("OWNER-B"));
        assertEquals(0, count("sys_subscription_invoice"));
    }

    @Test void signedCustomerOtherThanStoredCustomerIsMismatch() {
        db.jdbc.update("update sys_subscription set provider_customer_id = 'cus_other' where sys_id = 'SUB-A'");
        pg.pay(token(), "OWNER-A", CardScenario.SUCCESS);
        assertEquals(Outcome.OK, deliver(last()));
        assertMismatchChangedNothing();
        assertEquals(0, count("sys_subscription_invoice"));
    }

    @Test void storedInvoiceOwnedByAnotherSubscriptionIsMismatchAndStaysUntouched() {
        otherStoreSubscription();
        var paid = pg.pay(token(), "OWNER-A", CardScenario.SUCCESS);
        db.jdbc.update("""
                insert into sys_subscription_invoice(sys_id, subscription_sys_id, provider, provider_store_id,
                  provider_invoice_id, charge_kind, amount, currency, status, provider_updated_at,
                  insert_user_id, insert_datetime)
                values ('INV-B', 'SUB-B', 'fake', 'store-test', ?, 'RECURRING', 29000, 'KRW', 'PENDING',
                  '2000-01-01T00:00:00Z', 'T', now())
                """, paid.invoiceId());
        var before = db.jdbc.queryForMap("select * from sys_subscription_invoice");
        assertEquals(Outcome.OK, deliver(last()));
        assertMismatchChangedNothing();
        assertEquals(before, db.jdbc.queryForMap("select * from sys_subscription_invoice"));
        assertEquals("PENDING", db.column("sys_subscription", "status", "SUB-B"));
        assertEquals("02", db.role("OWNER-B"));
    }

    private static ProviderInvoice withPeriod(ProviderInvoice i, java.time.Instant start, java.time.Instant end) {
        return new ProviderInvoice(i.storeId(), i.invoiceId(), i.subscriptionId(), i.customerId(), i.productId(),
                i.chargeKind(), i.paymentMethod(), i.amount(), i.refundedAmount(), i.currency(), i.status(),
                i.attemptCount(), start, end, i.paidAt(), i.updatedAt(), i.failureCode());
    }

    @Test void paidWithoutValidProviderPeriodIsNotApplied() {
        pg.pay(token(), "OWNER-A", CardScenario.SUCCESS);
        var message = last();
        var start = java.time.Instant.parse("2026-11-25T00:00:00Z");
        List<UnaryOperator<ProviderInvoice>> broken = List.of(
                i -> withPeriod(i, i.periodStartAt(), null),
                i -> withPeriod(i, null, i.periodEndAt()),
                i -> withPeriod(i, start, start),
                i -> withPeriod(i, start, start.minusSeconds(1)));
        for (var change : broken) {
            db.jdbc.update("truncate table sys_billing_webhook_event, sys_subscription_invoice");
            assertEquals(Outcome.OK, deliverVia(lookupReturns(change), message));
            assertEquals("MISMATCH", db.jdbc.queryForObject("select apply_result from sys_subscription_invoice", String.class));
            assertEquals("PENDING", db.column("sys_subscription", "status", "SUB-A"));
            assertNull(db.column("sys_subscription", "paid_through_at", "SUB-A"));
            assertEquals("N", db.column("sys_subscription", "role_granted_yn", "SUB-A"));
            assertEquals("02", db.role("OWNER-A"));
        }
    }

    @Test void outOfInstantRangeTimestampIs401AndWritesNothing() {
        pg.pay(token(), "OWNER-A", CardScenario.SUCCESS);
        var original = last();
        var headers = new java.util.HashMap<>(original.headers());
        headers.put("webhook-timestamp", String.valueOf(Long.MAX_VALUE));
        assertEquals(Outcome.UNAUTHORIZED, deliver(new Sent(headers, original.body())));
        assertEquals(0, count("sys_subscription_invoice"));
        assertEquals(0, count("sys_billing_webhook_event"));
        assertEquals("PENDING", db.column("sys_subscription", "status", "SUB-A"));
        assertEquals("02", db.role("OWNER-A"));
    }

    @Test void lookupCustomerOtherThanStoredLeavesExistingRowsIdentical() {
        var paid = pg.pay(token(), "OWNER-A", CardScenario.SUCCESS);
        assertEquals(Outcome.OK, deliver(last()));
        pg.refund(paid.invoiceId(), 29000, "test");
        var refund = last();
        String rows = "select i.*, s.status s_status, s.paid_through_at, s.modify_datetime s_mod, u.user_role, u.modify_datetime u_mod"
                + " from sys_subscription_invoice i join sys_subscription s on s.sys_id = i.subscription_sys_id"
                + " join sys_user u on u.sys_id = s.owner_user_sys_id";
        var before = db.jdbc.queryForMap(rows);
        // 본문에 고객 ID가 없고, 조회한 인보이스(1) 또는 구독(2)의 고객이 저장 고객과 다르다.
        var invoiceCustomer = new ForwardingBillingProvider(pg) {
            @Override public ProviderInvoice getInvoice(String id) { return withCustomer(pg.getInvoice(id), "cus_other"); }
            @Override public BillingModels.BillingNotice verifyAndParseWebhook(Map<String, String> h, byte[] b) {
                return withoutCustomer(pg.verifyAndParseWebhook(h, b));
            }
        };
        var subscriptionCustomer = new ForwardingBillingProvider(pg) {
            @Override public ProviderSubscription getSubscription(String id) {
                return withCustomer(pg.getSubscription(id), "cus_other");
            }
            @Override public BillingModels.BillingNotice verifyAndParseWebhook(Map<String, String> h, byte[] b) {
                return withWebhookId(withoutCustomer(pg.verifyAndParseWebhook(h, b)), "msg_second");
            }
        };
        assertEquals(Outcome.OK, deliverVia(invoiceCustomer, refund));
        assertEquals(Outcome.OK, deliverVia(subscriptionCustomer, refund));
        assertEquals(before, db.jdbc.queryForMap(rows));
        assertEquals("APPLIED", before.get("apply_result"));
        assertEquals("PAID", before.get("status"));
        assertEquals(2, db.jdbc.queryForObject(
                "select count(*) from sys_billing_webhook_event where result = 'MISMATCH'", Integer.class));
        assertEquals(1, count("sys_subscription_invoice"));
        assertEquals("01", db.role("OWNER-A"));
    }

    /** 조회 결과를 바꾸고 webhook-id도 새로 붙이는 제공자(같은 인보이스의 다른 웹훅). */
    private BillingProvider snapshot(String webhookId, UnaryOperator<ProviderInvoice> change) {
        return new ForwardingBillingProvider(pg) {
            @Override public ProviderInvoice getInvoice(String id) { return change.apply(pg.getInvoice(id)); }
            @Override public BillingModels.BillingNotice verifyAndParseWebhook(Map<String, String> h, byte[] b) {
                return withWebhookId(pg.verifyAndParseWebhook(h, b), webhookId);
            }
        };
    }

    private static ProviderInvoice updatedLater(ProviderInvoice i, long seconds) {
        return new ProviderInvoice(i.storeId(), i.invoiceId(), i.subscriptionId(), i.customerId(), i.productId(),
                i.chargeKind(), i.paymentMethod(), i.amount(), i.refundedAmount(), i.currency(), i.status(),
                i.attemptCount(), i.periodStartAt(), i.periodEndAt(), i.paidAt(), i.updatedAt().plusSeconds(seconds),
                i.failureCode());
    }

    @Test void correctedSnapshotOfPeriodErrorPaidAppliesOnceAndNeverAgain() {
        pg.pay(token(), "OWNER-A", CardScenario.SUCCESS);
        var message = last();
        assertEquals(Outcome.OK, deliverVia(snapshot("msg_broken", i -> withPeriod(i, i.periodStartAt(), null)), message));
        assertEquals("MISMATCH", db.jdbc.queryForObject("select apply_result from sys_subscription_invoice", String.class));
        assertEquals("PENDING", db.column("sys_subscription", "status", "SUB-A"));
        assertEquals("02", db.role("OWNER-A"));

        assertEquals(Outcome.OK, deliverVia(snapshot("msg_fixed", i -> updatedLater(i, 1)), message));
        assertEquals("APPLIED", db.jdbc.queryForObject("select apply_result from sys_subscription_invoice", String.class));
        assertEquals("ACTIVE", db.column("sys_subscription", "status", "SUB-A"));
        assertEquals("Y", db.column("sys_subscription", "role_granted_yn", "SUB-A"));
        assertEquals("01", db.role("OWNER-A"));
        var applied = db.jdbc.queryForMap("select s.modify_datetime, s.paid_through_at, s.role_granted_at,"
                + " u.modify_datetime u_mod from sys_subscription s join sys_user u on u.sys_id = s.owner_user_sys_id");

        assertEquals(Outcome.OK, deliverVia(snapshot("msg_again", i -> updatedLater(i, 2)), message));
        assertEquals(applied, db.jdbc.queryForMap("select s.modify_datetime, s.paid_through_at, s.role_granted_at,"
                + " u.modify_datetime u_mod from sys_subscription s join sys_user u on u.sys_id = s.owner_user_sys_id"));
        assertEquals("APPLIED", db.jdbc.queryForObject("select apply_result from sys_subscription_invoice", String.class));
        assertEquals(3, count("sys_billing_webhook_event"));
        assertEquals(1, count("sys_subscription_invoice"));
    }
}
