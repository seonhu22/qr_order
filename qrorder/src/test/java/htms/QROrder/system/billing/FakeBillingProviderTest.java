package htms.QROrder.system.billing;

import htms.QROrder.system.billing.fake.FakeBillingConfig;
import htms.QROrder.system.billing.fake.FakeBillingProvider;
import htms.QROrder.system.billing.fake.FakeBillingProvider.CardScenario;
import htms.QROrder.system.billing.fake.FakeBillingProvider.ForgeMode;
import htms.QROrder.system.billing.provider.BillingModels.CheckoutLaunch;
import htms.QROrder.system.billing.provider.BillingModels.CheckoutRequest;
import htms.QROrder.system.billing.provider.BillingModels.NoticeKind;
import htms.QROrder.system.billing.provider.PortOneWebhookEvents;
import htms.QROrder.system.billing.provider.ProviderUnavailableException;
import htms.QROrder.system.billing.webhook.WebhookVerificationException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** 가짜 PG: 결제창 토큰, 상태 파일 재시작, 웹훅 서명/재전송/위조/유실, 조회 실패, 프로필/가드(정책 §11 행 8). */
class FakeBillingProviderTest {
    static final String SECRET = "whsec_" + Base64.getEncoder().encodeToString("fake-test-secret-0123456789abcdef".getBytes());

    @TempDir Path dir;
    private final MutableClock clock = new MutableClock(Instant.parse("2026-11-25T00:00:00Z"));
    private final List<Sent> sent = new ArrayList<>();

    record Sent(Map<String, String> headers, String body) {}

    private FakeBillingProvider provider() {
        return new FakeBillingProvider(dir.resolve("state.json"), "store-test", SECRET, "http://localhost:8080/",
                clock, (headers, body) -> { sent.add(new Sent(headers, body)); return 200; });
    }

    private static CheckoutRequest request(String attempt) {
        return new CheckoutRequest("SUB-1", "OWNER-1", "1234567890", "BASIC_MONTHLY", 29000, "KRW", 1, attempt);
    }

    private static String token(CheckoutLaunch launch) {
        String url = launch.launch().get("redirectUrl");
        assertTrue(url.startsWith("http://localhost:8080/fake-pg/checkout?token="), url);
        return url.substring(url.indexOf("token=") + 6);
    }

    @Test void checkoutPreRegistersIncompleteAndSameAttemptReturnsSameRegistration() {
        var pg = provider();
        var first = pg.startCheckout(request("att-1"));
        var again = pg.startCheckout(request("att-1"));
        assertEquals("fake", first.provider());
        assertEquals("store-test", first.providerStoreId());
        assertEquals(first.providerSubscriptionId(), again.providerSubscriptionId());
        assertEquals(token(first), token(again));
        assertEquals("INCOMPLETE", pg.getSubscription(first.providerSubscriptionId()).status());
        assertEquals(clock.instant().plus(Duration.ofMinutes(10)), first.expiresAt());
        assertNotEquals(first.providerSubscriptionId(), pg.startCheckout(request("att-2")).providerSubscriptionId());
    }

    @Test void successfulPaymentActivatesSendsSignedPaidWebhookAndInvoiceIsRecurringCard() {
        var pg = provider();
        var launch = pg.startCheckout(request("att-1"));
        var result = pg.pay(token(launch), "OWNER-1", CardScenario.SUCCESS);
        assertTrue(result.paid());
        var invoice = pg.getInvoice(result.invoiceId());
        assertEquals("PAID", invoice.status());
        assertEquals(29000, invoice.amount());
        assertEquals("KRW", invoice.currency());
        assertEquals("RECURRING", invoice.chargeKind());
        assertEquals("CARD", invoice.paymentMethod());
        assertEquals("BASIC_MONTHLY", invoice.productId());
        assertEquals(Instant.parse("2026-12-25T00:00:00Z"), invoice.periodEndAt());
        assertEquals("ACTIVE", pg.getSubscription(launch.providerSubscriptionId()).status());

        assertEquals(1, sent.size());
        var notice = pg.verifyAndParseWebhook(sent.get(0).headers(), sent.get(0).body().getBytes(StandardCharsets.UTF_8));
        assertEquals(PortOneWebhookEvents.INVOICE_PAID, notice.eventType());
        assertEquals(NoticeKind.INVOICE, notice.kind());
        assertEquals("store-test", notice.storeId());
        assertEquals(result.invoiceId(), notice.invoiceId());
        assertEquals(launch.providerSubscriptionId(), notice.subscriptionId());
    }

    @Test void tokenIsOneTimeOwnerBoundAndExpiresAfterTenMinutes() {
        var pg = provider();
        var launch = pg.startCheckout(request("att-1"));
        String token = token(launch);
        assertNull(pg.peekToken(token, "SOMEONE-ELSE"));
        assertThrows(IllegalStateException.class, () -> pg.pay(token, "SOMEONE-ELSE", CardScenario.SUCCESS));
        pg.pay(token, "OWNER-1", CardScenario.DECLINED);
        assertThrows(IllegalStateException.class, () -> pg.pay(token, "OWNER-1", CardScenario.SUCCESS));

        String second = token(pg.startCheckout(request("att-1")));
        assertNotEquals(token, second);
        clock.advance(Duration.ofMinutes(10));
        assertNull(pg.peekToken(second, "OWNER-1"));
        assertThrows(IllegalStateException.class, () -> pg.pay(second, "OWNER-1", CardScenario.SUCCESS));
    }

    @Test void declinedCardFailsInvoiceAndKeepsSubscriptionIncomplete() {
        var pg = provider();
        var launch = pg.startCheckout(request("att-1"));
        var result = pg.pay(token(launch), "OWNER-1", CardScenario.INSUFFICIENT_FUNDS);
        assertFalse(result.paid());
        assertEquals("FAILED", pg.getInvoice(result.invoiceId()).status());
        assertEquals("INSUFFICIENT_FUNDS", pg.getInvoice(result.invoiceId()).failureCode());
        assertEquals("INCOMPLETE", pg.getSubscription(launch.providerSubscriptionId()).status());
        assertTrue(sent.get(0).body().contains(PortOneWebhookEvents.INVOICE_PAYMENT_FAILED));
        pg.retryInvoice(result.invoiceId(), true);
        assertEquals("PAID", pg.getInvoice(result.invoiceId()).status());
        assertEquals(2, pg.getInvoice(result.invoiceId()).attemptCount());
    }

    @Test void stateSurvivesRestart() {
        var pg = provider();
        var launch = pg.startCheckout(request("att-1"));
        var paid = pg.pay(token(launch), "OWNER-1", CardScenario.SUCCESS);
        String next = pg.chargeNextPeriod(launch.providerSubscriptionId(), true);

        var restarted = provider();
        assertEquals("ACTIVE", restarted.getSubscription(launch.providerSubscriptionId()).status());
        assertEquals("PAID", restarted.getInvoice(paid.invoiceId()).status());
        assertEquals(Instant.parse("2027-01-25T00:00:00Z"), restarted.getInvoice(next).periodEndAt());
        // ID 순번도 파일에 남아 재시작 뒤 새 등록이 옛 ID를 다시 쓰지 않는다.
        assertNotEquals(launch.providerSubscriptionId(),
                restarted.startCheckout(request("att-2")).providerSubscriptionId());
    }

    @Test void refundsAccumulateToFullAndRejectOverRefund() {
        var pg = provider();
        var launch = pg.startCheckout(request("att-1"));
        String invoice = pg.pay(token(launch), "OWNER-1", CardScenario.SUCCESS).invoiceId();
        pg.refund(invoice, 9000, "partial");
        assertEquals("PARTIALLY_REFUNDED", pg.getInvoice(invoice).status());
        assertThrows(IllegalArgumentException.class, () -> pg.refund(invoice, 20001, "too much"));
        pg.refund(invoice, 20000, "rest");
        assertEquals("REFUNDED", pg.getInvoice(invoice).status());
        assertEquals(29000, pg.getInvoice(invoice).refundedAmount());
    }

    @Test void resendKeepsIdAndBodyWithNewTimestampAndSignature() {
        var pg = provider();
        pg.pay(token(pg.startCheckout(request("att-1"))), "OWNER-1", CardScenario.SUCCESS);
        clock.advance(Duration.ofMinutes(3));
        pg.resend(sent.get(0).headers().get("webhook-id"));
        var original = sent.get(0);
        var resent = sent.get(1);
        assertEquals(original.headers().get("webhook-id"), resent.headers().get("webhook-id"));
        assertEquals(original.body(), resent.body());
        assertNotEquals(original.headers().get("webhook-timestamp"), resent.headers().get("webhook-timestamp"));
        assertNotEquals(original.headers().get("webhook-signature"), resent.headers().get("webhook-signature"));
        assertDoesNotThrow(() -> pg.verifyAndParseWebhook(resent.headers(), resent.body().getBytes(StandardCharsets.UTF_8)));
    }

    @Test void forgedWebhooksFailVerification() {
        var pg = provider();
        pg.pay(token(pg.startCheckout(request("att-1"))), "OWNER-1", CardScenario.SUCCESS);
        String id = sent.get(0).headers().get("webhook-id");
        pg.forge(id, ForgeMode.BAD_SIGNATURE);
        pg.forge(id, ForgeMode.STALE_TIMESTAMP);
        for (var forged : sent.subList(1, 3)) {
            assertThrows(WebhookVerificationException.class,
                    () -> pg.verifyAndParseWebhook(forged.headers(), forged.body().getBytes(StandardCharsets.UTF_8)));
        }
    }

    @Test void disabledWebhooksAreLostUntilResent() {
        var pg = provider();
        pg.setWebhooksEnabled(false);
        pg.pay(token(pg.startCheckout(request("att-1"))), "OWNER-1", CardScenario.SUCCESS);
        assertEquals(0, sent.size());
        var delivery = pg.snapshot().deliveries.get(0);
        assertEquals(0, delivery.lastStatus);
        pg.setWebhooksEnabled(true);
        pg.resend(delivery.webhookId);
        assertEquals(1, sent.size());
        assertEquals(200, pg.snapshot().deliveries.get(0).lastStatus);
    }

    @Test void lookupFailureCanBeInjectedThenRecovers() {
        var pg = provider();
        var launch = pg.startCheckout(request("att-1"));
        pg.failNextLookups(1);
        assertThrows(ProviderUnavailableException.class, () -> pg.getSubscription(launch.providerSubscriptionId()));
        assertNotNull(pg.getSubscription(launch.providerSubscriptionId()));
    }

    @Test void cardExpiryAndEndSendDocumentedEvents() {
        var pg = provider();
        var launch = pg.startCheckout(request("att-1"));
        pg.pay(token(launch), "OWNER-1", CardScenario.SUCCESS);
        pg.expireCard(launch.providerSubscriptionId());
        pg.endSubscription(launch.providerSubscriptionId());
        pg.endSubscription(launch.providerSubscriptionId());
        assertEquals("EXPIRED", pg.getSubscription(launch.providerSubscriptionId()).paymentMethodStatus());
        assertEquals("ENDED", pg.getSubscription(launch.providerSubscriptionId()).status());
        assertEquals(3, sent.size());
        assertTrue(sent.get(1).body().contains(PortOneWebhookEvents.CUSTOMER_PAYMENT_METHOD_REVOKED));
        assertTrue(sent.get(2).body().contains(PortOneWebhookEvents.SUBSCRIPTION_ENDED));
    }

    // ---- 프로필/가드 ----

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(FakeBillingConfig.class);

    @Test void fakeProviderExistsOnlyWithLocalProfileAndSetting() {
        String file = "billing.fake.state-file=" + dir.resolve("ctx.json").toString().replace('\\', '/');
        runner.withPropertyValues("billing.provider=fake", file,
                        "spring.datasource.url=jdbc:postgresql://127.0.0.1:55432/qrdemo")
                .run(context -> assertTrue(context.getBeansOfType(FakeBillingProvider.class).isEmpty()));
        runner.withInitializer(c -> c.getEnvironment().setActiveProfiles("local"))
                .withPropertyValues(file, "spring.datasource.url=jdbc:postgresql://127.0.0.1:55432/qrdemo")
                .run(context -> assertTrue(context.getBeansOfType(FakeBillingProvider.class).isEmpty()));
        runner.withInitializer(c -> c.getEnvironment().setActiveProfiles("local"))
                .withPropertyValues("billing.provider=fake", file,
                        "spring.datasource.url=jdbc:postgresql://127.0.0.1:55432/qrdemo")
                .run(context -> assertEquals(1, context.getBeansOfType(FakeBillingProvider.class).size()));
    }

    @Test void fakeProviderRefusesNonLoopbackOrTunneledDatabase() {
        var local = runner.withInitializer(c -> c.getEnvironment().setActiveProfiles("local"))
                .withPropertyValues("billing.provider=fake",
                        "billing.fake.state-file=" + dir.resolve("ctx.json").toString().replace('\\', '/'));
        local.withPropertyValues("spring.datasource.url=jdbc:postgresql://10.1.2.3:5432/qr")
                .run(context -> assertNotNull(context.getStartupFailure()));
        local.withPropertyValues("spring.datasource.url=jdbc:postgresql://localhost:15432/qr", "ssh.enabled=true")
                .run(context -> assertNotNull(context.getStartupFailure()));
    }

    static final class MutableClock extends Clock {
        private Instant now;
        MutableClock(Instant now) { this.now = now; }
        void advance(Duration duration) { now = now.plus(duration); }
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    }
}
