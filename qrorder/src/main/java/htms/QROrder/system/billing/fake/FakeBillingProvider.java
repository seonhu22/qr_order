package htms.QROrder.system.billing.fake;

import htms.QROrder.system.billing.provider.BillingModels;
import htms.QROrder.system.billing.provider.BillingModels.BillingNotice;
import htms.QROrder.system.billing.provider.BillingModels.CheckoutLaunch;
import htms.QROrder.system.billing.provider.BillingModels.CheckoutRequest;
import htms.QROrder.system.billing.provider.BillingModels.ProviderInvoice;
import htms.QROrder.system.billing.provider.BillingModels.ProviderSubscription;
import htms.QROrder.system.billing.provider.BillingProvider;
import htms.QROrder.system.billing.provider.PortOneWebhookEvents;
import htms.QROrder.system.billing.provider.ProviderUnavailableException;
import htms.QROrder.system.billing.webhook.StandardWebhookVerifier;
import htms.QROrder.system.billing.webhook.WebhookVerificationException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 포트원 관리형 구독을 흉내 낸 로컬 가짜 제공자(정책 §6). 상태는 저장소 밖 JSON 파일에 두어 재시작해도 조회된다.
 * 흐름: 고객/구독 사전 등록(INCOMPLETE) → 결제창에서 결제수단 등록 → 첫 인보이스 결제 → 웹훅.
 * 상태 변경은 이 객체 잠금 안에서 하고, 웹훅 HTTP는 잠금을 놓은 뒤 보낸다(웹훅 처리가 다시 조회하므로).
 */
public class FakeBillingProvider implements BillingProvider {
    public static final String NAME = "fake";
    public static final Duration TOKEN_TTL = Duration.ofMinutes(10);
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    public enum CardScenario { SUCCESS, DECLINED, INSUFFICIENT_FUNDS }

    public enum ForgeMode { BAD_SIGNATURE, STALE_TIMESTAMP }

    public record PayResult(boolean paid, String invoiceId, String failureCode) {}

    private final Path stateFile;
    private final String storeId;
    private final StandardWebhookVerifier verifier;
    private final String baseUrl;
    private final Clock clock;
    private final FakeWebhookSender sender;
    private final JsonMapper json = JsonMapper.builder().build();
    private final SecureRandom random = new SecureRandom();
    private FakePgState state;

    public FakeBillingProvider(Path stateFile, String storeId, String webhookSecret, String baseUrl, Clock clock,
                               FakeWebhookSender sender) {
        this.stateFile = stateFile;
        this.storeId = storeId;
        this.verifier = new StandardWebhookVerifier(webhookSecret, clock);
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.clock = clock;
        this.sender = sender;
        this.state = load();
    }

    @Override public String name() { return NAME; }

    @Override public String storeId() { return storeId; }

    // ---- BillingProvider ----

    @Override
    public CheckoutLaunch startCheckout(CheckoutRequest request) {
        synchronized (this) {
            Instant now = clock.instant();
            String subscriptionId = state.attempts.get(request.attemptId());
            FakePgState.Sub sub;
            if (subscriptionId == null) {
                sub = new FakePgState.Sub();
                sub.subscriptionId = "sub_" + next();
                sub.customerId = "cus_" + next();
                sub.subscriptionSysId = request.subscriptionSysId();
                sub.ownerUserSysId = request.ownerUserSysId();
                sub.plantCd = request.plantCd();
                sub.productId = request.productId();
                sub.amount = request.amount();
                sub.currency = request.currency();
                sub.periodMonth = request.periodMonth();
                sub.status = "INCOMPLETE";
                sub.paymentMethodStatus = "NONE";
                sub.updatedAt = now;
                state.subscriptions.put(sub.subscriptionId, sub);
                state.attempts.put(request.attemptId(), sub.subscriptionId);
            } else {
                sub = state.subscriptions.get(subscriptionId);
            }
            FakePgState.Token token = openToken(sub, now);
            if (token == null) {
                token = new FakePgState.Token();
                token.token = randomToken();
                token.subscriptionId = sub.subscriptionId;
                token.subscriptionSysId = sub.subscriptionSysId;
                token.ownerUserSysId = sub.ownerUserSysId;
                token.expiresAt = now.plus(TOKEN_TTL);
                state.tokens.put(token.token, token);
            }
            save();
            return new CheckoutLaunch(NAME, storeId, sub.customerId, sub.subscriptionId,
                    Map.of("redirectUrl", baseUrl + "/fake-pg/checkout?token=" + token.token), token.expiresAt);
        }
    }

    @Override
    public synchronized ProviderSubscription getSubscription(String providerSubscriptionId) {
        failLookupIfRequested();
        FakePgState.Sub sub = state.subscriptions.get(providerSubscriptionId);
        if (sub == null) return null;
        return new ProviderSubscription(storeId, sub.subscriptionId, sub.customerId, sub.productId, sub.status,
                sub.paymentMethodStatus, sub.updatedAt);
    }

    @Override
    public synchronized ProviderInvoice getInvoice(String providerInvoiceId) {
        failLookupIfRequested();
        FakePgState.Invoice inv = state.invoices.get(providerInvoiceId);
        if (inv == null) return null;
        return new ProviderInvoice(storeId, inv.invoiceId, inv.subscriptionId, inv.customerId, inv.productId,
                inv.chargeKind, inv.paymentMethod, inv.amount, inv.refundedAmount, inv.currency, inv.status,
                inv.attemptCount, inv.periodStartAt, inv.periodEndAt, inv.paidAt, inv.updatedAt, inv.failureCode);
    }

    @Override
    public void endSubscription(String providerSubscriptionId) {
        List<FakePgState.Delivery> out = new ArrayList<>();
        synchronized (this) {
            FakePgState.Sub sub = requireSub(providerSubscriptionId);
            if (!"ENDED".equals(sub.status)) {
                sub.status = "ENDED";
                sub.updatedAt = clock.instant();
                // 끝난 구독의 결제창은 다시 열리지 않는다.
                state.tokens.values().stream().filter(t -> t.subscriptionId.equals(sub.subscriptionId))
                        .forEach(t -> t.used = true);
                out.add(event(PortOneWebhookEvents.SUBSCRIPTION_ENDED, sub, null));
                save();
            }
        }
        deliver(out);
    }

    @Override
    public void refund(String providerInvoiceId, int amount, String reason) {
        List<FakePgState.Delivery> out = new ArrayList<>();
        synchronized (this) {
            FakePgState.Invoice inv = requireInvoice(providerInvoiceId);
            if (amount <= 0 || inv.refundedAmount + amount > inv.amount
                    || !(inv.status.equals("PAID") || inv.status.equals("PARTIALLY_REFUNDED"))) {
                throw new IllegalArgumentException("환불할 수 없는 금액 또는 상태입니다.");
            }
            inv.refundedAmount += amount;
            inv.status = inv.refundedAmount == inv.amount ? "REFUNDED" : "PARTIALLY_REFUNDED";
            inv.updatedAt = clock.instant();
            out.add(event(PortOneWebhookEvents.INVOICE_PAYMENT_REFUNDED, requireSub(inv.subscriptionId), inv));
            save();
        }
        deliver(out);
    }

    @Override
    public BillingNotice verifyAndParseWebhook(Map<String, String> headers, byte[] body) {
        String id = header(headers, StandardWebhookVerifier.HEADER_ID);
        verifier.verify(id, header(headers, StandardWebhookVerifier.HEADER_TIMESTAMP),
                header(headers, StandardWebhookVerifier.HEADER_SIGNATURE), body);
        JsonNode root;
        try {
            root = json.readTree(body);
        } catch (RuntimeException malformed) {
            throw new WebhookVerificationException(WebhookVerificationException.Reason.SIGNATURE_MISMATCH);
        }
        String type = text(root, "type");
        JsonNode data = root.path("data");
        String occurred = text(root, "timestamp");
        return new BillingNotice(id, type, PortOneWebhookEvents.kindOf(type), text(data, "storeId"),
                text(data, "subscriptionId"), text(data, "invoiceId"), text(data, "customerId"),
                occurred == null ? null : Instant.parse(occurred));
    }

    // ---- 결제창 / 콘솔(가짜 전용) ----

    /** 결제창 토큰 확인. 없거나, 썼거나, 만료됐거나, 다른 사람이거나, 구독이 결제수단 등록 전(INCOMPLETE)이 아니면 null. */
    public synchronized FakePgState.Token peekToken(String token, String actorUserSysId) {
        FakePgState.Token found = token == null ? null : state.tokens.get(token);
        if (found == null || found.used || !clock.instant().isBefore(found.expiresAt)
                || actorUserSysId == null || !actorUserSysId.equals(found.ownerUserSysId)) {
            return null;
        }
        FakePgState.Sub sub = state.subscriptions.get(found.subscriptionId);
        return sub != null && "INCOMPLETE".equals(sub.status) ? found : null;
    }

    /** 결제수단 등록 + 첫 인보이스. 토큰은 결과와 관계없이 1회만 쓴다. */
    public PayResult pay(String token, String actorUserSysId, CardScenario scenario) {
        List<FakePgState.Delivery> out = new ArrayList<>();
        PayResult result;
        synchronized (this) {
            FakePgState.Token found = peekToken(token, actorUserSysId);
            if (found == null) {
                throw new IllegalStateException("결제창이 만료되었거나 본인 결제가 아닙니다.");
            }
            found.used = true;
            FakePgState.Sub sub = requireSub(found.subscriptionId);
            Instant now = clock.instant();
            FakePgState.Invoice inv = newInvoice(sub, now, addMonths(now, sub.periodMonth));
            if (scenario == CardScenario.SUCCESS) {
                sub.status = "ACTIVE";
                sub.paymentMethodStatus = "ACTIVE";
                sub.updatedAt = now;
                markPaid(inv, now);
                out.add(event(PortOneWebhookEvents.INVOICE_PAID, sub, inv));
            } else {
                markFailed(inv, now, scenario.name());
                out.add(event(PortOneWebhookEvents.INVOICE_PAYMENT_FAILED, sub, inv));
            }
            result = new PayResult(scenario == CardScenario.SUCCESS, inv.invoiceId, inv.failureCode);
            save();
        }
        deliver(out);
        return result;
    }

    /** 다음 회차 청구(성공/실패). 기간은 마지막 인보이스 끝에서 이어진다. */
    public String chargeNextPeriod(String providerSubscriptionId, boolean success) {
        List<FakePgState.Delivery> out = new ArrayList<>();
        String invoiceId;
        synchronized (this) {
            FakePgState.Sub sub = requireSub(providerSubscriptionId);
            if (!"ACTIVE".equals(sub.status)) throw new IllegalStateException("ACTIVE 구독만 청구합니다.");
            Instant start = state.invoices.values().stream().filter(i -> i.subscriptionId.equals(sub.subscriptionId))
                    .map(i -> i.periodEndAt).max(Instant::compareTo).orElse(clock.instant());
            FakePgState.Invoice inv = newInvoice(sub, start, addMonths(start, sub.periodMonth));
            Instant now = clock.instant();
            if (success) {
                markPaid(inv, now);
                out.add(event(PortOneWebhookEvents.INVOICE_PAID, sub, inv));
            } else {
                markFailed(inv, now, "DECLINED");
                out.add(event(PortOneWebhookEvents.INVOICE_PAYMENT_FAILED, sub, inv));
            }
            invoiceId = inv.invoiceId;
            save();
        }
        deliver(out);
        return invoiceId;
    }

    /** 실패한 회차를 같은 인보이스 ID로 재시도. */
    public void retryInvoice(String providerInvoiceId, boolean success) {
        List<FakePgState.Delivery> out = new ArrayList<>();
        synchronized (this) {
            FakePgState.Invoice inv = requireInvoice(providerInvoiceId);
            if (!"FAILED".equals(inv.status)) throw new IllegalStateException("실패한 인보이스만 재시도합니다.");
            FakePgState.Sub sub = requireSub(inv.subscriptionId);
            if ("ENDED".equals(sub.status)) throw new IllegalStateException("끝난 구독의 인보이스는 재시도하지 않습니다.");
            Instant now = clock.instant();
            if (success) {
                sub.status = "ACTIVE";
                sub.paymentMethodStatus = "ACTIVE";
                sub.updatedAt = now;
                markPaid(inv, now);
                out.add(event(PortOneWebhookEvents.INVOICE_PAID, sub, inv));
            } else {
                markFailed(inv, now, "DECLINED");
                out.add(event(PortOneWebhookEvents.INVOICE_PAYMENT_FAILED, sub, inv));
            }
            save();
        }
        deliver(out);
    }

    /** 카드 만료. 포트원 문서에 전용 이벤트가 없어 결제수단 해지 이벤트로 보낸다. */
    public void expireCard(String providerSubscriptionId) {
        List<FakePgState.Delivery> out = new ArrayList<>();
        synchronized (this) {
            FakePgState.Sub sub = requireSub(providerSubscriptionId);
            sub.paymentMethodStatus = "EXPIRED";
            sub.updatedAt = clock.instant();
            out.add(event(PortOneWebhookEvents.CUSTOMER_PAYMENT_METHOD_REVOKED, sub, null));
            save();
        }
        deliver(out);
    }

    /** 같은 webhook-id/본문(같은 이벤트 시각), 새 전송 시각/서명. */
    public void resend(String webhookId) {
        FakePgState.Delivery delivery;
        synchronized (this) {
            delivery = requireDelivery(webhookId);
        }
        sendSigned(delivery, clock.instant().getEpochSecond(), true, true);
    }

    /** 위조 전송: 서명 틀림 또는 5분 넘은 전송 시각. 상태는 바꾸지 않는다. */
    public int forge(String webhookId, ForgeMode mode) {
        FakePgState.Delivery delivery;
        synchronized (this) {
            delivery = requireDelivery(webhookId);
        }
        long now = clock.instant().getEpochSecond();
        if (mode == ForgeMode.STALE_TIMESTAMP) {
            return sendSigned(delivery, now - Duration.ofMinutes(6).toSeconds(), true, false);
        }
        return sendSigned(delivery, now, false, false);
    }

    public synchronized void setWebhooksEnabled(boolean enabled) {
        state.webhooksEnabled = enabled;
        save();
    }

    public synchronized void failNextLookups(int count) {
        state.lookupFailuresRemaining = Math.max(0, count);
        save();
    }

    /** 콘솔 화면용 읽기 전용 사본. */
    public synchronized FakePgState snapshot() {
        return json.readValue(json.writeValueAsString(state), FakePgState.class);
    }

    // ---- 내부 ----

    private FakePgState.Token openToken(FakePgState.Sub sub, Instant now) {
        if (!"INCOMPLETE".equals(sub.status)) {
            throw new IllegalStateException("이미 결제수단이 등록된 구독입니다.");
        }
        return state.tokens.values().stream()
                .filter(t -> t.subscriptionId.equals(sub.subscriptionId) && !t.used && now.isBefore(t.expiresAt))
                .findFirst().orElse(null);
    }

    private FakePgState.Invoice newInvoice(FakePgState.Sub sub, Instant start, Instant end) {
        FakePgState.Invoice inv = new FakePgState.Invoice();
        inv.invoiceId = "inv_" + next();
        inv.subscriptionId = sub.subscriptionId;
        inv.customerId = sub.customerId;
        inv.productId = sub.productId;
        inv.chargeKind = BillingModels.CHARGE_RECURRING;
        inv.paymentMethod = BillingModels.METHOD_CARD;
        inv.amount = sub.amount;
        inv.currency = sub.currency;
        inv.status = "PENDING";
        inv.periodStartAt = start;
        inv.periodEndAt = end;
        state.invoices.put(inv.invoiceId, inv);
        return inv;
    }

    private static void markPaid(FakePgState.Invoice inv, Instant now) {
        inv.status = "PAID";
        inv.attemptCount += 1;
        inv.paidAt = now;
        inv.failureCode = null;
        inv.updatedAt = now;
    }

    private static void markFailed(FakePgState.Invoice inv, Instant now, String code) {
        inv.status = "FAILED";
        inv.attemptCount += 1;
        inv.failureCode = code;
        inv.updatedAt = now;
    }

    private static Instant addMonths(Instant from, int months) {
        return from.atZone(KST).plusMonths(months).toInstant();
    }

    private FakePgState.Delivery event(String type, FakePgState.Sub sub, FakePgState.Invoice inv) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("storeId", storeId);
        data.put("customerId", sub.customerId);
        data.put("subscriptionId", sub.subscriptionId);
        if (inv != null) data.put("invoiceId", inv.invoiceId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("type", type);
        body.put("timestamp", clock.instant().toString());
        body.put("data", data);
        FakePgState.Delivery delivery = new FakePgState.Delivery();
        delivery.webhookId = "msg_" + next();
        delivery.type = type;
        delivery.body = json.writeValueAsString(body);
        state.deliveries.add(delivery);
        return delivery;
    }

    private void deliver(List<FakePgState.Delivery> deliveries) {
        for (FakePgState.Delivery delivery : deliveries) {
            sendSigned(delivery, clock.instant().getEpochSecond(), true, true);
        }
    }

    /** record=true면 전송 결과를 상태에 남긴다. 웹훅을 꺼두면 보내지 않고 유실(0)로 남긴다. */
    private int sendSigned(FakePgState.Delivery delivery, long timestamp, boolean validSignature, boolean record) {
        boolean enabled;
        synchronized (this) {
            enabled = state.webhooksEnabled;
        }
        int status = 0;
        if (enabled || !record) {
            byte[] body = delivery.body.getBytes(StandardCharsets.UTF_8);
            String signature = validSignature ? verifier.sign(delivery.webhookId, timestamp, body)
                    : "v1," + Base64.getEncoder().encodeToString(new byte[32]);
            status = sender.send(Map.of(
                    StandardWebhookVerifier.HEADER_ID, delivery.webhookId,
                    StandardWebhookVerifier.HEADER_TIMESTAMP, String.valueOf(timestamp),
                    StandardWebhookVerifier.HEADER_SIGNATURE, signature), delivery.body);
        }
        if (record) {
            synchronized (this) {
                FakePgState.Delivery stored = requireDelivery(delivery.webhookId);
                stored.lastSentAt = clock.instant();
                stored.lastStatus = status;
                stored.sendCount += enabled ? 1 : 0;
                save();
            }
        }
        return status;
    }

    private void failLookupIfRequested() {
        if (state.lookupFailuresRemaining > 0) {
            state.lookupFailuresRemaining -= 1;
            save();
            throw new ProviderUnavailableException("가짜 PG 조회 실패(콘솔 설정)");
        }
    }

    private FakePgState.Sub requireSub(String id) {
        FakePgState.Sub sub = state.subscriptions.get(id);
        if (sub == null) throw new IllegalArgumentException("모르는 구독: " + id);
        return sub;
    }

    private FakePgState.Invoice requireInvoice(String id) {
        FakePgState.Invoice inv = state.invoices.get(id);
        if (inv == null) throw new IllegalArgumentException("모르는 인보이스: " + id);
        return inv;
    }

    private FakePgState.Delivery requireDelivery(String webhookId) {
        return state.deliveries.stream().filter(d -> d.webhookId.equals(webhookId)).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("모르는 웹훅: " + webhookId));
    }

    private String next() {
        state.sequence += 1;
        return String.format("%06d", state.sequence);
    }

    private String randomToken() {
        byte[] bytes = new byte[24];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String header(Map<String, String> headers, String name) {
        if (headers == null) return null;
        for (var entry : headers.entrySet()) {
            if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(name)) return entry.getValue();
        }
        return null;
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asString();
    }

    private FakePgState load() {
        if (!Files.exists(stateFile)) return new FakePgState();
        try {
            return json.readValue(Files.readString(stateFile), FakePgState.class);
        } catch (IOException failure) {
            throw new UncheckedIOException("가짜 PG 상태 파일을 읽지 못했습니다: " + stateFile, failure);
        }
    }

    private void save() {
        try {
            Path parent = stateFile.toAbsolutePath().getParent();
            if (parent != null) Files.createDirectories(parent);
            Path temp = Files.createTempFile(parent, "fake-pg-", ".tmp");
            Files.writeString(temp, json.writerWithDefaultPrettyPrinter().writeValueAsString(state));
            Files.move(temp, stateFile, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException failure) {
            throw new UncheckedIOException("가짜 PG 상태 파일을 저장하지 못했습니다: " + stateFile, failure);
        }
    }
}
