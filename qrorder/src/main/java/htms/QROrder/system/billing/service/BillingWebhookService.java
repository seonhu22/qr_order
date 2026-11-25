package htms.QROrder.system.billing.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.system.billing.domain.BillingWebhookEvent;
import htms.QROrder.system.billing.domain.Subscription;
import htms.QROrder.system.billing.domain.SubscriptionAction;
import htms.QROrder.system.billing.domain.SubscriptionEvent;
import htms.QROrder.system.billing.domain.SubscriptionFacts;
import htms.QROrder.system.billing.domain.SubscriptionInvoice;
import htms.QROrder.system.billing.domain.SubscriptionTransition;
import htms.QROrder.system.billing.provider.BillingModels;
import htms.QROrder.system.billing.provider.BillingModels.BillingNotice;
import htms.QROrder.system.billing.provider.BillingModels.NoticeKind;
import htms.QROrder.system.billing.provider.BillingModels.ProviderInvoice;
import htms.QROrder.system.billing.provider.BillingModels.ProviderSubscription;
import htms.QROrder.system.billing.provider.BillingProvider;
import htms.QROrder.system.billing.provider.ProviderUnavailableException;
import htms.QROrder.system.billing.repository.BillingWebhookEventMapper;
import htms.QROrder.system.billing.repository.SubscriptionInvoiceMapper;
import htms.QROrder.system.billing.repository.SubscriptionMapper;
import htms.QROrder.system.billing.webhook.WebhookVerificationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * 웹훅 처리(정책 4C §7). 순서: 서명 검증(실패 401, DB 0행) → 처리 완료 webhook_id면 200 →
 * 잠금 밖 제공자 재조회(실패 503) → 한 트랜잭션: 구독 잠금 → 재판정 → 인보이스 upsert → 이벤트 기록 → 대표 역할 → 커밋.
 * 실패하면 이벤트 행도 롤백되어 제공자 재전송 때 다시 처리된다. 이번 단계(§11 행 9)는 Paid만 상태를 바꾸고,
 * 그 밖의 인보이스 상태는 인보이스 사본만 갱신, 인보이스가 아닌 이벤트는 IGNORED로 남긴다.
 */
@Slf4j
@Service
public class BillingWebhookService {
    public enum Outcome { OK, UNAUTHORIZED, UNAVAILABLE }

    static final String ACTOR = "BILLING_WEBHOOK";
    private static final Set<String> INVOICE_STATUSES = Set.of("PENDING", "PAID", "FAILED", "PARTIALLY_REFUNDED", "REFUNDED");
    private static final Set<String> PAID_FAMILY = Set.of("PAID", "PARTIALLY_REFUNDED", "REFUNDED");
    /** 허용 이동(§7): FAILED→FAILED/PAID, PAID→PARTIALLY_REFUNDED→REFUNDED. PAID→FAILED 금지. */
    private static final Map<String, Set<String>> MOVES = Map.of(
            "PENDING", INVOICE_STATUSES,
            "FAILED", Set.of("FAILED", "PAID"),
            "PAID", Set.of("PAID", "PARTIALLY_REFUNDED", "REFUNDED"),
            "PARTIALLY_REFUNDED", Set.of("PARTIALLY_REFUNDED", "REFUNDED"),
            "REFUNDED", Set.of("REFUNDED"));

    private final SubscriptionMapper subscriptions;
    private final SubscriptionInvoiceMapper invoices;
    private final BillingWebhookEventMapper events;
    private final TransactionTemplate transaction;
    private final Environment environment;
    private final Clock clock;

    @Autowired
    public BillingWebhookService(SubscriptionMapper subscriptions, SubscriptionInvoiceMapper invoices,
                                 BillingWebhookEventMapper events, PlatformTransactionManager transactionManager,
                                 Environment environment) {
        this(subscriptions, invoices, events, transactionManager, environment, Clock.systemUTC());
    }

    public BillingWebhookService(SubscriptionMapper subscriptions, SubscriptionInvoiceMapper invoices,
                                 BillingWebhookEventMapper events, PlatformTransactionManager transactionManager,
                                 Environment environment, Clock clock) {
        this.subscriptions = subscriptions;
        this.invoices = invoices;
        this.events = events;
        this.transaction = new TransactionTemplate(transactionManager);
        this.environment = environment;
        this.clock = clock;
    }

    public Outcome handle(BillingProvider provider, Map<String, String> headers, byte[] body) {
        BillingNotice notice;
        try {
            notice = provider.verifyAndParseWebhook(headers, body);
        } catch (WebhookVerificationException rejected) {
            log.warn("billing webhook rejected provider={} reason={}", provider.name(), rejected.reason());
            return Outcome.UNAUTHORIZED;
        }
        if (!provider.storeId().equals(notice.storeId())) {
            log.warn("billing webhook rejected provider={} reason=STORE_MISMATCH", provider.name());
            return Outcome.UNAUTHORIZED;
        }
        if (processed(provider, notice)) return Outcome.OK;

        ProviderInvoice invoice = null;
        ProviderSubscription subscription = null;
        if (notice.kind() == NoticeKind.INVOICE && notice.invoiceId() != null) {
            try {
                invoice = provider.getInvoice(notice.invoiceId());
                subscription = invoice == null ? null : provider.getSubscription(invoice.subscriptionId());
            } catch (ProviderUnavailableException unavailable) {
                log.warn("billing webhook provider lookup failed provider={} webhookId={}", provider.name(), notice.webhookId());
                return Outcome.UNAVAILABLE;
            }
        }
        ProviderInvoice fetchedInvoice = invoice;
        ProviderSubscription fetchedSubscription = subscription;
        try {
            transaction.executeWithoutResult(status -> apply(provider, notice, fetchedInvoice, fetchedSubscription));
        } catch (DuplicateKeyException race) {
            // 같은 webhook-id가 먼저 커밋했으면 처리 완료. 아니면 재전송에 맡긴다.
            return processed(provider, notice) ? Outcome.OK : Outcome.UNAVAILABLE;
        }
        return Outcome.OK;
    }

    private boolean processed(BillingProvider provider, BillingNotice notice) {
        return events.findResult(provider.name(), provider.storeId(), notice.webhookId()) != null;
    }

    private void apply(BillingProvider provider, BillingNotice notice, ProviderInvoice invoice,
                       ProviderSubscription subscription) {
        Instant now = clock.instant();
        String subscriptionId = invoice != null ? invoice.subscriptionId() : notice.subscriptionId();
        Subscription row = subscriptionId == null ? null
                : subscriptions.lockByProviderSubscription(provider.name(), provider.storeId(), subscriptionId);
        // 잠금을 기다리는 동안 같은 webhook-id가 처리됐을 수 있다.
        if (processed(provider, notice)) return;
        if (invoice != null && !noticeMatchesLookup(notice, invoice)) {
            mismatch(provider, notice, "NOTICE_LOOKUP", now);
            return;
        }
        if (invoice == null || row == null || invoice.updatedAt() == null
                || !INVOICE_STATUSES.contains(invoice.status())) {
            insertEvent(provider, notice, "IGNORED", now);
            return;
        }
        if (notice.customerId() != null && !notice.customerId().equals(row.getProviderCustomerId())) {
            mismatch(provider, notice, "NOTICE_CUSTOMER", now);
            return;
        }

        SubscriptionInvoice existing = invoices.lockByProviderInvoice(provider.name(), provider.storeId(), invoice.invoiceId());
        if (existing != null && !row.getSysId().equals(existing.getSubscriptionSysId())) {
            mismatch(provider, notice, "INVOICE_OF_OTHER_SUBSCRIPTION", now);
            return;
        }
        boolean newer = existing == null || invoice.updatedAt().isAfter(existing.getProviderUpdatedAt());
        boolean allowed = existing == null || MOVES.getOrDefault(existing.getStatus(), Set.of()).contains(invoice.status());
        String grantFor = null;
        if (newer && allowed) {
            boolean firstPaid = "PAID".equals(invoice.status())
                    && (existing == null || !PAID_FAMILY.contains(existing.getStatus()));
            String applyResult = null;
            if (!matches(provider, row, invoice, subscription)) {
                applyResult = "MISMATCH";
                log.warn("billing invoice mismatch subscription={} invoice={}", row.getSysId(), invoice.invoiceId());
            } else if (firstPaid) {
                PaidDecision decision = decidePaid(row, invoice, now);
                applyResult = decision.applyResult();
                grantFor = decision.grantRole() ? row.getSysId() : null;
            }
            upsertInvoice(existing, row, provider, invoice, applyResult);
        }
        insertEvent(provider, notice, "PROCESSED", now);
        // sys_user는 잠금 순서의 마지막.
        if (grantFor != null && subscriptions.grantOwnerRole(grantFor, ACTOR) == 1) {
            subscriptions.markRoleGranted(grantFor, now, ACTOR);
        }
    }

    /** 서명된 요청의 ID와 재조회 결과가 같은 인보이스/구독을 가리켜야 한다. 본문에 없는 ID는 비교하지 않는다. */
    private static boolean noticeMatchesLookup(BillingNotice notice, ProviderInvoice invoice) {
        return Objects.equals(notice.invoiceId(), invoice.invoiceId())
                && (notice.subscriptionId() == null || notice.subscriptionId().equals(invoice.subscriptionId()))
                && (notice.customerId() == null || notice.customerId().equals(invoice.customerId()));
    }

    /** 연결 불일치: 구독/인보이스/사용자 행은 그대로 두고 이벤트만 MISMATCH로 남긴다(Admin 문제 건). */
    private void mismatch(BillingProvider provider, BillingNotice notice, String reason, Instant now) {
        log.warn("billing webhook mismatch provider={} webhookId={} reason={}", provider.name(), notice.webhookId(), reason);
        insertEvent(provider, notice, "MISMATCH", now);
    }

    private record PaidDecision(String applyResult, boolean grantRole) {}

    /** 첫 PAID 이동 1회만 상태/기간을 바꾼다. 역할 UPDATE는 호출자가 마지막에 한다. */
    private PaidDecision decidePaid(Subscription row, ProviderInvoice invoice, Instant now) {
        SubscriptionFacts facts = SubscriptionFacts.at(now)
                .withPaidThroughAt(row.getPaidThroughAt())
                .withGraceUntil(row.getGraceUntil())
                .withEndAt(row.getEndAt())
                .withNextPeriodInvoice(row.getPaidThroughAt() == null || (invoice.periodEndAt() != null
                        && invoice.periodEndAt().isAfter(row.getPaidThroughAt())));
        var outcome = SubscriptionTransition.apply(row.getStatus(), SubscriptionEvent.INVOICE_PAID, facts);
        var actions = outcome.actions();
        if (actions.contains(SubscriptionAction.HOLD_REFUND_AFTER_CANCEL)) return new PaidDecision("AFTER_CANCEL", false);
        if (actions.contains(SubscriptionAction.HOLD_REFUND_STALE)) return new PaidDecision("STALE", false);
        if (outcome.kind() != SubscriptionTransition.Kind.APPLY) {
            // ACTIVE인데 다음 회차가 아닌 결제 = 이미 낸 기간의 중복 결제. 환불 대상으로 표시만 한다.
            return new PaidDecision("STALE", false);
        }
        subscriptions.applyPaid(row.getSysId(), outcome.next().name(),
                actions.contains(SubscriptionAction.EXTEND_PERIOD) ? invoice.periodEndAt() : null,
                actions.contains(SubscriptionAction.CLEAR_GRACE), ACTOR);
        if (!actions.contains(SubscriptionAction.GRANT_ROLE)) return new PaidDecision("APPLIED", false);
        String ownerRole = subscriptions.findOwnerRole(row.getSysId());
        if (ownerRole == null) return new PaidDecision("OWNER_MISSING", false);
        // 이미 01(레거시/수동)이면 UPDATE 0행이라 role_granted_yn은 N 그대로다.
        return new PaidDecision("APPLIED", "02".equals(ownerRole));
    }

    /** 제공자/상점/고객/구독/상품, 정기 자동 카드 결제, 금액 = 스냅샷(0원 제외), KRW, 결제된 회차는 기간 시작 < 끝(§7 확인 항목). */
    private boolean matches(BillingProvider provider, Subscription row, ProviderInvoice invoice,
                            ProviderSubscription subscription) {
        String planCode = row.getPlanSysId() == null ? null : subscriptions.findPlanCode(row.getPlanSysId());
        String expectedProduct = planCode == null ? null : environment.getProperty("billing.products." + planCode, planCode);
        return subscription != null
                && provider.storeId().equals(invoice.storeId())
                && provider.storeId().equals(subscription.storeId())
                && Objects.equals(row.getProviderSubscriptionId(), invoice.subscriptionId())
                && Objects.equals(row.getProviderSubscriptionId(), subscription.subscriptionId())
                && row.getProviderCustomerId() != null
                && row.getProviderCustomerId().equals(invoice.customerId())
                && row.getProviderCustomerId().equals(subscription.customerId())
                && expectedProduct != null && expectedProduct.equals(invoice.productId())
                && expectedProduct.equals(subscription.productId())
                && BillingModels.CHARGE_RECURRING.equals(invoice.chargeKind())
                && BillingModels.METHOD_CARD.equals(invoice.paymentMethod())
                && invoice.amount() > 0 && row.getAmount() != null && invoice.amount() == row.getAmount()
                && "KRW".equals(invoice.currency()) && "KRW".equals(row.getCurrency())
                && (!PAID_FAMILY.contains(invoice.status()) || validPeriod(invoice));
    }

    /** 기간이 없거나 거꾸로면 paid_through_at을 정할 수 없어 E8 만료도 못 한다. 그런 결제는 반영하지 않는다. */
    private static boolean validPeriod(ProviderInvoice invoice) {
        return invoice.periodStartAt() != null && invoice.periodEndAt() != null
                && invoice.periodStartAt().isBefore(invoice.periodEndAt());
    }

    private void upsertInvoice(SubscriptionInvoice existing, Subscription row, BillingProvider provider,
                               ProviderInvoice invoice, String applyResult) {
        SubscriptionInvoice value = new SubscriptionInvoice();
        value.setSysId(existing == null ? UlidCreator.getUlid().toString() : existing.getSysId());
        value.setSubscriptionSysId(row.getSysId());
        value.setProvider(provider.name());
        value.setProviderStoreId(provider.storeId());
        value.setProviderInvoiceId(invoice.invoiceId());
        value.setChargeKind(invoice.chargeKind() == null ? "UNKNOWN" : invoice.chargeKind());
        value.setAmount(invoice.amount());
        value.setRefundedAmount(invoice.refundedAmount());
        value.setCurrency(invoice.currency());
        value.setStatus(invoice.status());
        value.setAttemptCount(invoice.attemptCount());
        value.setProviderUpdatedAt(invoice.updatedAt());
        value.setPeriodStartAt(invoice.periodStartAt());
        value.setPeriodEndAt(invoice.periodEndAt());
        value.setPaidAt(invoice.paidAt());
        value.setApplyResult(applyResult);
        value.setInsertUserId(ACTOR);
        if (existing == null) invoices.insertInvoice(value);
        else invoices.updateFromProvider(value);
    }

    private void insertEvent(BillingProvider provider, BillingNotice notice, String result, Instant now) {
        BillingWebhookEvent event = new BillingWebhookEvent();
        event.setSysId(UlidCreator.getUlid().toString());
        event.setProvider(provider.name());
        event.setProviderStoreId(provider.storeId());
        event.setWebhookId(notice.webhookId());
        event.setEventType(notice.eventType() == null ? "UNKNOWN" : notice.eventType());
        event.setResourceId(notice.invoiceId() != null ? notice.invoiceId() : notice.subscriptionId());
        event.setOccurredAt(notice.occurredAt());
        event.setReceivedAt(now);
        event.setProcessedAt(now);
        event.setResult(result);
        events.insertEvent(event);
    }
}
