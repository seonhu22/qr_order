package htms.QROrder.system.billing;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.system.billing.dto.ClientSubscriptionDtos.CheckoutLaunchView;
import htms.QROrder.system.billing.fake.FakeBillingProvider;
import htms.QROrder.system.billing.provider.BillingProviderRegistry;
import htms.QROrder.system.billing.repository.BillingWebhookEventMapper;
import htms.QROrder.system.billing.repository.SubscriptionInvoiceMapper;
import htms.QROrder.system.billing.repository.SubscriptionMapper;
import htms.QROrder.system.billing.service.BillingWebhookService;
import htms.QROrder.system.billing.service.ClientSubscriptionService;
import htms.QROrder.system.billing.service.SubscriptionBatchService;
import htms.QROrder.system.billing.service.SubscriptionLifecycleService;
import org.springframework.mock.env.MockEnvironment;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * 구독 결제 전체를 실제 PostgreSQL + 가짜 PG로 묶은 테스트 세계. 가짜 PG 웹훅은 기본으로 바로 서비스에 전달된다
 * (로컬 앱에서 HTTP로 자기 자신에게 보내는 것과 같은 순서). 모든 서비스가 같은 움직이는 시계를 쓴다.
 */
final class BillingWorld implements AutoCloseable {
    static final String PLAN = "PLAN-1";

    final BillingPersistenceSupport db;
    final TestClock clock = new TestClock(Instant.parse("2026-11-25T03:00:00Z"));
    final List<Sent> sent = Collections.synchronizedList(new ArrayList<>());
    volatile boolean autoDeliver = true;
    FakeBillingProvider pg;
    BillingProviderRegistry providers;
    BillingWebhookService webhooks;
    ClientSubscriptionService client;
    SubscriptionLifecycleService lifecycle;
    SubscriptionBatchService batch;

    record Sent(Map<String, String> headers, String body) {}

    private BillingWorld(BillingPersistenceSupport db) {
        this.db = db;
    }

    static BillingWorld start() throws Exception {
        return new BillingWorld(BillingPersistenceSupport.start("mapper/system/billing/SubscriptionMapper.xml",
                "mapper/system/billing/SubscriptionInvoiceMapper.xml",
                "mapper/system/billing/BillingWebhookEventMapper.xml"));
    }

    SubscriptionMapper subscriptions() { return db.sql.getMapper(SubscriptionMapper.class); }

    SubscriptionInvoiceMapper invoices() { return db.sql.getMapper(SubscriptionInvoiceMapper.class); }

    /** 매장 STORE-A, 대표 OWNER-A(02), 직원 STAFF-A(02), 플랜 1개, 가입 직후 PENDING 구독 SUB-A. */
    void reset(Path stateFile) {
        db.truncateAll();
        sent.clear();
        autoDeliver = true;
        clock.set(Instant.parse("2026-11-25T03:00:00Z"));
        pg = new FakeBillingProvider(stateFile, "store-test", FakeBillingProviderTest.SECRET, "http://localhost:8080",
                clock, (headers, body) -> {
                    sent.add(new Sent(headers, body));
                    return autoDeliver ? status(deliver(new Sent(headers, body))) : 200;
                });
        providers = new BillingProviderRegistry(List.of(pg));
        var env = new MockEnvironment();
        webhooks = new BillingWebhookService(subscriptions(), invoices(), db.sql.getMapper(BillingWebhookEventMapper.class),
                db.transactions, env, clock);
        client = new ClientSubscriptionService(subscriptions(), invoices(), providers, webhooks, db.transactions, env, clock);
        lifecycle = new SubscriptionLifecycleService(subscriptions(), providers, db.transactions);
        batch = new SubscriptionBatchService(subscriptions(), providers, webhooks, lifecycle, db.transactions);
        db.plant("STORE-A");
        db.user("OWNER-A", "STORE-A", "02");
        db.user("STAFF-A", "STORE-A", "02");
        db.jdbc.update("""
                insert into sys_payment(sys_id, payment_cd, payment_nm, payment_fee, payment_fee_unit,
                  license_valid_month, insert_user_id, insert_datetime, sys_plant_cd, delete_yn)
                values (?, 'BASIC_MONTHLY', '기본 월간', 29000, 'KRW', 1, 'T', now(), 'ADMIN', 'N')
                """, PLAN);
        db.jdbc.update("""
                insert into sys_subscription(sys_id, plant_cd, owner_user_sys_id, status, role_granted_yn,
                  insert_user_id, insert_datetime)
                values ('SUB-A', 'STORE-A', 'OWNER-A', 'PENDING', 'N', 'T', now())
                """);
    }

    BillingWebhookService.Outcome deliver(Sent message) {
        return webhooks.handle(pg, message.headers(), message.body().getBytes(StandardCharsets.UTF_8));
    }

    private static int status(BillingWebhookService.Outcome outcome) {
        return switch (outcome) {
            case OK -> 200;
            case UNAUTHORIZED -> 401;
            case UNAVAILABLE -> 503;
        };
    }

    static Login login(String sysId, String plantCd) {
        var login = new Login();
        login.setSysId(sysId);
        login.setUserId(sysId);
        login.setSysPlantCd(plantCd);
        return login;
    }

    Login owner() { return login("OWNER-A", "STORE-A"); }

    static String token(CheckoutLaunchView launch) {
        String url = launch.launch().get("redirectUrl");
        return url.substring(url.indexOf("token=") + 6);
    }

    /** 대표가 결제를 시작하고 카드 결제 성공까지. 웹훅은 autoDeliver를 따른다. */
    String checkoutAndPay(FakeBillingProvider.CardScenario scenario) {
        var launch = client.checkout(owner(), PLAN);
        return pg.pay(token(launch), "OWNER-A", scenario).invoiceId();
    }

    java.time.Instant instant(String column) {
        var value = db.jdbc.queryForObject("select " + column + " from sys_subscription where sys_id='SUB-A'",
                java.sql.Timestamp.class);
        return value == null ? null : value.toInstant();
    }

    String column(String column) {
        return db.column("sys_subscription", column, "SUB-A");
    }

    int count(String table) {
        return db.jdbc.queryForObject("select count(*) from " + table, Integer.class);
    }

    @Override
    public void close() throws Exception {
        db.close();
    }

    static final class TestClock extends Clock {
        private volatile Instant now;

        TestClock(Instant now) { this.now = now; }

        void set(Instant value) { now = value; }

        void advance(Duration duration) { now = now.plus(duration); }

        @Override public ZoneId getZone() { return ZoneOffset.UTC; }

        @Override public Clock withZone(ZoneId zone) { return this; }

        @Override public Instant instant() { return now; }
    }
}
