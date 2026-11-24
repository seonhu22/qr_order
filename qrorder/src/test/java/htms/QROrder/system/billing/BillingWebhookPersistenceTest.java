package htms.QROrder.system.billing;

import htms.QROrder.system.billing.fake.FakeBillingProvider;
import htms.QROrder.system.billing.fake.FakeBillingProvider.CardScenario;
import htms.QROrder.system.billing.fake.FakeBillingProvider.ForgeMode;
import htms.QROrder.system.billing.provider.BillingModels.CheckoutLaunch;
import htms.QROrder.system.billing.provider.BillingModels.CheckoutRequest;
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

    @Test void unknownSubscriptionIsIgnoredOnce() {
        db.jdbc.update("update sys_subscription set provider_subscription_id = 'sub_other'");
        pg.pay(token(), "OWNER-A", CardScenario.SUCCESS);
        assertEquals(Outcome.OK, deliver(last()));
        assertEquals("IGNORED", db.jdbc.queryForObject("select result from sys_billing_webhook_event", String.class));
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

    @Test void nonInvoiceEventIsIgnored() {
        pg.pay(token(), "OWNER-A", CardScenario.SUCCESS);
        assertEquals(Outcome.OK, deliver(last()));
        pg.expireCard(launch.providerSubscriptionId());
        assertEquals(Outcome.OK, deliver(last()));
        assertEquals(1, db.jdbc.queryForObject(
                "select count(*) from sys_billing_webhook_event where result='IGNORED'", Integer.class));
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
}
