package htms.QROrder.system.billing.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.system.billing.domain.BillingWebhookEvent;
import htms.QROrder.system.billing.domain.Subscription;
import htms.QROrder.system.billing.domain.SubscriptionAction;
import htms.QROrder.system.billing.domain.SubscriptionEvent;
import htms.QROrder.system.billing.domain.SubscriptionFacts;
import htms.QROrder.system.billing.domain.SubscriptionInvoice;
import htms.QROrder.system.billing.domain.SubscriptionStatus;
import htms.QROrder.system.billing.domain.SubscriptionTransition;
import htms.QROrder.system.billing.provider.BillingModels;
import htms.QROrder.system.billing.provider.BillingModels.BillingNotice;
import htms.QROrder.system.billing.provider.BillingModels.NoticeKind;
import htms.QROrder.system.billing.provider.BillingModels.ProviderInvoice;
import htms.QROrder.system.billing.provider.BillingModels.ProviderSubscription;
import htms.QROrder.system.billing.provider.BillingProvider;
import htms.QROrder.system.billing.provider.BillingProviderRegistry;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * 웹훅 처리(정책 4C §7). 순서: 서명 검증(실패 401, DB 0행) → 처리 완료 webhook_id면 200 →
 * 잠금 밖 제공자 재조회(실패 503) → 한 트랜잭션: 구독 잠금 → 재판정 → 인보이스 upsert → 이벤트 기록 → 대표 역할 → 커밋.
 * 실패하면 이벤트 행도 롤백되어 제공자 재전송 때 다시 처리된다. 인보이스 이벤트는 Paid(E2)/Failed(E3)/환불(E4, E5)을 반영하고,
 * 결제수단 이벤트는 카드 만료(E9)를 반영하고, 그 밖의 이벤트는 IGNORED로 남긴다.
 */
@Slf4j
@Service
public class BillingWebhookService {
    public enum Outcome { OK, UNAUTHORIZED, UNAVAILABLE }

    static final String ACTOR = "BILLING_WEBHOOK";
    private static final Set<String> INVOICE_STATUSES = Set.of("PENDING", "PAID", "FAILED", "PARTIALLY_REFUNDED", "REFUNDED");
    private static final Set<String> PAID_FAMILY = Set.of("PAID", "PARTIALLY_REFUNDED", "REFUNDED");
    private static final Set<String> REFUND_STATUSES = Set.of("PARTIALLY_REFUNDED", "REFUNDED");
    private static final Set<SubscriptionStatus> IN_PROGRESS_PAID = Set.of(SubscriptionStatus.ACTIVE,
            SubscriptionStatus.PAST_DUE, SubscriptionStatus.CANCEL_SCHEDULED);
    /**
     * 허용 이동(§7): FAILED→FAILED/PAID, PAID→PARTIALLY_REFUNDED→REFUNDED. PAID→FAILED 금지.
     * FAILED→환불 상태는 재시도 결제(PAID) 웹훅을 놓친 경우다. 누적 환불액으로 놓친 전이를 복원한다.
     */
    private static final Map<String, Set<String>> MOVES = Map.of(
            "PENDING", INVOICE_STATUSES,
            "FAILED", Set.of("FAILED", "PAID", "PARTIALLY_REFUNDED", "REFUNDED"),
            "PAID", Set.of("PAID", "PARTIALLY_REFUNDED", "REFUNDED"),
            "PARTIALLY_REFUNDED", Set.of("PARTIALLY_REFUNDED", "REFUNDED"),
            "REFUNDED", Set.of("REFUNDED"));

    private final SubscriptionMapper subscriptions;
    private final SubscriptionInvoiceMapper invoices;
    private final BillingWebhookEventMapper events;
    private final TransactionTemplate transaction;
    private final Environment environment;
    private final SubscriptionLifecycleService lifecycle;
    private final Clock clock;

    @Autowired
    public BillingWebhookService(SubscriptionMapper subscriptions, SubscriptionInvoiceMapper invoices,
                                 BillingWebhookEventMapper events, SubscriptionLifecycleService lifecycle,
                                 PlatformTransactionManager transactionManager, Environment environment) {
        this(subscriptions, invoices, events, lifecycle, transactionManager, environment, Clock.systemUTC());
    }

    public BillingWebhookService(SubscriptionMapper subscriptions, SubscriptionInvoiceMapper invoices,
                                 BillingWebhookEventMapper events, SubscriptionLifecycleService lifecycle,
                                 PlatformTransactionManager transactionManager, Environment environment, Clock clock) {
        this.subscriptions = subscriptions;
        this.invoices = invoices;
        this.events = events;
        this.lifecycle = lifecycle;
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
        List<String> siblingInvoiceIds = List.of();
        boolean paymentMethod = notice.kind() == NoticeKind.PAYMENT_METHOD && notice.subscriptionId() != null;
        if ((notice.kind() == NoticeKind.INVOICE && notice.invoiceId() != null) || paymentMethod) {
            try {
                invoice = paymentMethod ? null : provider.getInvoice(notice.invoiceId());
                String lookupId = paymentMethod ? notice.subscriptionId() : invoice == null ? null : invoice.subscriptionId();
                subscription = lookupId == null ? null : provider.getSubscription(lookupId);
                if (invoice != null && invoice.subscriptionId() != null && subscriptions.findByProviderSubscription(
                        provider.name(), provider.storeId(), invoice.subscriptionId()) == null) {
                    // 저장된 구독과 연결이 끊긴 등록의 청구: 같은 등록의 인보이스로 어느 구독 것이었는지 찾는다.
                    siblingInvoiceIds = provider.listInvoices(invoice.subscriptionId()).stream()
                            .filter(Objects::nonNull).map(ProviderInvoice::invoiceId).toList();
                }
            } catch (ProviderUnavailableException unavailable) {
                log.warn("billing webhook provider lookup failed provider={} webhookId={}", provider.name(), notice.webhookId());
                return Outcome.UNAVAILABLE;
            }
        }
        ProviderInvoice fetchedInvoice = invoice;
        ProviderSubscription fetchedSubscription = subscription;
        List<String> siblings = siblingInvoiceIds;
        Boolean ended;
        try {
            ended = transaction.execute(status -> apply(provider, notice, fetchedInvoice, fetchedSubscription, siblings));
        } catch (DuplicateKeyException race) {
            // 같은 webhook-id가 먼저 커밋했으면 처리 완료. 아니면 재전송에 맡긴다.
            return processed(provider, notice) ? Outcome.OK : Outcome.UNAVAILABLE;
        }
        // 만료시킨 구독은 커밋 뒤 잠금 밖에서 제공자 종료를 요청한다(실패하면 배치가 재시도).
        if (Boolean.TRUE.equals(ended) && fetchedInvoice != null) endProviderOf(provider, fetchedInvoice.subscriptionId());
        return Outcome.OK;
    }

    private boolean processed(BillingProvider provider, BillingNotice notice) {
        return events.findResult(provider.name(), provider.storeId(), notice.webhookId()) != null;
    }

    private void endProviderOf(BillingProvider provider, String providerSubscriptionId) {
        Subscription row = subscriptions.findByProviderSubscription(provider.name(), provider.storeId(), providerSubscriptionId);
        if (row != null) lifecycle.endProvider(row.getSysId());
    }

    /** true = 이 트랜잭션이 구독을 만료시켰다(커밋 뒤 제공자 종료 필요). */
    private boolean apply(BillingProvider provider, BillingNotice notice, ProviderInvoice invoice,
                          ProviderSubscription subscription, List<String> siblingInvoiceIds) {
        Instant now = clock.instant();
        String subscriptionId = invoice != null ? invoice.subscriptionId() : notice.subscriptionId();
        Subscription row = subscriptionId == null ? null
                : subscriptions.lockByProviderSubscription(provider.name(), provider.storeId(), subscriptionId);
        // 잠금을 기다리는 동안 같은 webhook-id가 처리됐을 수 있다.
        if (processed(provider, notice)) return false;
        if (notice.kind() == NoticeKind.PAYMENT_METHOD) {
            applyPaymentMethodNotice(provider, notice, row, subscription, now);
            return false;
        }
        if (invoice != null && !noticeMatchesLookup(notice, invoice)) {
            mismatch(provider, notice, "NOTICE_LOOKUP", now);
            return false;
        }
        if (invoice == null || invoice.updatedAt() == null || !INVOICE_STATUSES.contains(invoice.status())) {
            insertEvent(provider, notice, "IGNORED", now);
            return false;
        }
        if (row == null) {
            unlinkedCharge(provider, notice, invoice, siblingInvoiceIds, now);
            return false;
        }
        if (notice.customerId() != null && !notice.customerId().equals(row.getProviderCustomerId())) {
            mismatch(provider, notice, "NOTICE_CUSTOMER", now);
            return false;
        }

        Applied applied = applyInvoiceLocked(provider, row, invoice, subscription, now);
        if (applied == Applied.OTHER_SUBSCRIPTION) {
            mismatch(provider, notice, "INVOICE_OF_OTHER_SUBSCRIPTION", now);
            return false;
        }
        if (applied == Applied.LINK_MISMATCH) {
            mismatch(provider, notice, "LOOKUP_LINK", now);
            return false;
        }
        if (applied == Applied.DECIDED_MISMATCH) {
            mismatch(provider, notice, "DECIDED_SNAPSHOT", now);
            return false;
        }
        // 인보이스 반영 뒤, 같은 조회의 최신 결제수단 상태를 반영한다(결제 성공이 카드 만료 표시를 덮지 않는다).
        // 중복/허용 안 된 이동으로 전이를 생략한 인보이스는 결제수단도 쓰지 않는다.
        if (applied != Applied.SKIPPED) applyPaymentMethodLocked(subscriptions.findById(row.getSysId()), subscription, now);
        insertEvent(provider, notice, "PROCESSED", now);
        finishUser(row, applied, now);
        return applied.expired();
    }

    /** 결제수단 이벤트(E9 카드 만료 / 재등록). 본문 ID와 재조회 구독, 저장된 구독이 같은 고객/구독이어야 한다. */
    private void applyPaymentMethodNotice(BillingProvider provider, BillingNotice notice, Subscription row,
                                          ProviderSubscription subscription, Instant now) {
        if (row == null || subscription == null) {
            insertEvent(provider, notice, "IGNORED", now);
            return;
        }
        boolean linked = notice.subscriptionId().equals(subscription.subscriptionId())
                && provider.storeId().equals(subscription.storeId())
                && Objects.equals(row.getProviderCustomerId(), subscription.customerId())
                && (notice.customerId() == null || notice.customerId().equals(row.getProviderCustomerId()));
        if (!linked) {
            mismatch(provider, notice, "PAYMENT_METHOD_LINK", now);
            return;
        }
        applyPaymentMethodLocked(row, subscription, now);
        insertEvent(provider, notice, "PROCESSED", now);
    }

    /**
     * E9: 재조회한 결제수단 상태가 EXPIRED면 진행 중(A/D/C) 구독에 payment_method_status=EXPIRED(배너).
     * ACTIVE면(첫 결제, 재등록) A/D/C 구독의 표시도 ACTIVE로. 상태/권한은 바꾸지 않는다. 제공자 값이 기준이고
     * 인보이스 반영 뒤에 호출한다(잠긴 행을 다시 읽어 넘긴다). 조회는 잠금 밖이라 늦게 커밋되는 옛 조회가 있다:
     * 제공자 구독 updatedAt이 이미 반영한 조회보다 오래됐거나 없으면 쓰지 않는다.
     */
    private void applyPaymentMethodLocked(Subscription row, ProviderSubscription subscription, Instant now) {
        if (subscription == null || subscription.updatedAt() == null) return;
        if (row.getProviderUpdatedAt() != null && subscription.updatedAt().isBefore(row.getProviderUpdatedAt())) return;
        subscriptions.markProviderUpdatedAt(row.getSysId(), subscription.updatedAt(), ACTOR);
        if ("EXPIRED".equals(subscription.paymentMethodStatus())) {
            var outcome = SubscriptionTransition.apply(row.getStatus(), SubscriptionEvent.PAYMENT_METHOD_EXPIRED,
                    SubscriptionFacts.at(now));
            if (outcome.actions().contains(SubscriptionAction.MARK_PAYMENT_METHOD_EXPIRED)) {
                subscriptions.markPaymentMethod(row.getSysId(), "EXPIRED", ACTOR);
            }
        } else if ("ACTIVE".equals(subscription.paymentMethodStatus()) && !"ACTIVE".equals(row.getPaymentMethodStatus())
                && IN_PROGRESS_PAID.contains(row.getStatus())) {
            subscriptions.markPaymentMethod(row.getSysId(), "ACTIVE", ACTOR);
        }
    }

    /**
     * 재확인 결과. CHECKED만 "저장 키와 일치하는 제공자 구독/인보이스 조회를 마쳤다"는 뜻이다(E8 만료 판단에 쓸 수 있음).
     * NOTHING_TO_CHECK = 등록 없음 또는 다른 제공자/상점, UNVERIFIED = 조회는 됐지만 저장 키와 다른 구독이거나 없음,
     * FAILED = 제공자 조회 실패. 셋 다 아무것도 바꾸지 않는다.
     */
    public enum ReconcileResult { NOTHING_TO_CHECK, CHECKED, UNVERIFIED, FAILED }

    /**
     * 웹훅을 기다리지 않고 제공자를 다시 조회해 같은 반영 경로({@link #applyInvoiceLocked})로 맞춘다.
     * 조회는 잠금 밖, 인보이스마다 짧은 트랜잭션(구독 → 인보이스 → 사용자). 웹훅 이벤트 행은 쓰지 않는다.
     */
    public ReconcileResult reconcile(BillingProvider provider, String subscriptionSysId) {
        Subscription before = subscriptions.findById(subscriptionSysId);
        if (before == null || before.getProviderSubscriptionId() == null
                || !provider.name().equals(before.getProvider()) || !provider.storeId().equals(before.getProviderStoreId())) {
            return ReconcileResult.NOTHING_TO_CHECK;
        }
        String providerSubscriptionId = before.getProviderSubscriptionId();
        ProviderSubscription subscription;
        List<ProviderInvoice> found;
        try {
            subscription = provider.getSubscription(providerSubscriptionId);
            found = provider.listInvoices(providerSubscriptionId);
        } catch (ProviderUnavailableException unavailable) {
            log.warn("billing reconcile lookup failed subscription={}", subscriptionSysId);
            return ReconcileResult.FAILED;
        }
        if (subscription == null || !providerSubscriptionId.equals(subscription.subscriptionId())
                || !provider.storeId().equals(subscription.storeId()) || before.getProviderCustomerId() == null
                || !before.getProviderCustomerId().equals(subscription.customerId())) {
            log.warn("billing reconcile lookup does not match stored keys subscription={}", subscriptionSysId);
            return ReconcileResult.UNVERIFIED;
        }
        List<ProviderInvoice> ordered = new ArrayList<>(found);
        ordered.sort(Comparator.comparing(ProviderInvoice::periodStartAt, Comparator.nullsLast(Comparator.naturalOrder())));
        for (ProviderInvoice invoice : ordered) {
            if (invoice == null || invoice.updatedAt() == null || !INVOICE_STATUSES.contains(invoice.status())
                    || !providerSubscriptionId.equals(invoice.subscriptionId())) continue;
            Boolean ended = transaction.execute(status -> {
                Instant now = clock.instant();
                Subscription row = subscriptions.lockById(subscriptionSysId);
                // 잠금 전 판단은 버린다: 그사이 새 결제 시도로 등록이 바뀌었으면 건너뛴다.
                if (row == null || !providerSubscriptionId.equals(row.getProviderSubscriptionId())) return false;
                Applied applied = applyInvoiceLocked(provider, row, invoice, subscription, now);
                finishUser(row, applied, now);
                return applied.expired();
            });
            if (Boolean.TRUE.equals(ended)) lifecycle.endProvider(subscriptionSysId);
        }
        // 결제수단 상태는 인보이스를 모두 반영한 뒤에 최신 조회 값으로 맞춘다(놓친 Paid → 카드 만료 순서).
        transaction.executeWithoutResult(status -> {
            Subscription row = subscriptions.lockById(subscriptionSysId);
            if (row != null && providerSubscriptionId.equals(row.getProviderSubscriptionId())
                    && Objects.equals(row.getProviderCustomerId(), subscription.customerId())) {
                applyPaymentMethodLocked(row, subscription, clock.instant());
            }
        });
        return ReconcileResult.CHECKED;
    }

    /** 잠긴 구독 행 기준으로 반영한 결과. 사용자 행 변경은 호출자가 잠금 순서의 마지막에 한다. */
    private enum Applied {
        NONE, GRANT_ROLE, EXPIRED, GRANT_THEN_EXPIRE, OTHER_SUBSCRIPTION, LINK_MISMATCH, DECIDED_MISMATCH,
        /** 저장값보다 새롭지 않거나 허용되지 않는 이동이라 아무것도 쓰지 않았다. */
        SKIPPED;

        boolean granted() { return this == GRANT_ROLE || this == GRANT_THEN_EXPIRE; }

        boolean expired() { return this == EXPIRED || this == GRANT_THEN_EXPIRE; }

        static Applied of(boolean grant, boolean expire) {
            return grant && expire ? GRANT_THEN_EXPIRE : grant ? GRANT_ROLE : expire ? EXPIRED : NONE;
        }
    }

    /**
     * 재조회한 인보이스를 잠긴 구독 행에 반영한다(§7 인보이스 상태 이동). 웹훅과 재확인이 같이 쓴다.
     * 순서: 인보이스 행 잠금 → 연결 확인(어긋나면 어떤 행도 쓰지 않음) → 이동 허용/더 새로운 값 확인 → 확인 항목
     * → 상태 전이 → 인보이스 upsert.
     */
    private Applied applyInvoiceLocked(BillingProvider provider, Subscription row, ProviderInvoice invoice,
                                       ProviderSubscription subscription, Instant now) {
        SubscriptionInvoice existing = invoices.lockByProviderInvoice(provider.name(), provider.storeId(), invoice.invoiceId());
        if (existing != null && !row.getSysId().equals(existing.getSubscriptionSysId())) return Applied.OTHER_SUBSCRIPTION;
        // 조회한 인보이스/구독이 저장된 구독/고객과 다르면 남의 결제일 수 있다. 기존 인보이스도 덮지 않는다.
        if (!linked(provider, row, invoice, subscription)) {
            log.warn("billing invoice link mismatch subscription={} invoice={}", row.getSysId(), invoice.invoiceId());
            return Applied.LINK_MISMATCH;
        }
        boolean newer = existing == null || invoice.updatedAt().isAfter(existing.getProviderUpdatedAt());
        boolean allowed = existing == null || MOVES.getOrDefault(existing.getStatus(), Set.of()).contains(invoice.status());
        if (!newer || !allowed) return Applied.SKIPPED;
        // 첫 PAID 이동, 또는 이전 PAID가 MISMATCH로만 기록돼 아직 반영되지 않은 결제의 새 스냅샷. 반영된 PAID는 다시 반영하지 않는다.
        // 결제(Paid) 웹훅을 놓치고 환불 스냅샷이 먼저 오면, 현재 회차일 때만 검증된 결제를 먼저 반영하고 이어서 누적 환불을
        // 판정한다. 과거/미래 회차의 반영 전 환불은 기록만 한다(돈은 이미 돌아갔고 권한 기간에 영향이 없다).
        boolean firstPaid = PAID_FAMILY.contains(invoice.status()) && unapplied(existing)
                && ("PAID".equals(invoice.status()) || currentPeriod(invoice, now));
        String applyResult = null;
        Applied applied = Applied.NONE;
        if (!matches(row, invoice, subscription)) {
            if (decided(existing)) {
                // 이미 판정한(APPLIED 등) 결제의 뒤 스냅샷이 어긋남: 반영 이력과 인보이스 행을 덮지 않는다.
                // 불일치는 웹훅 이벤트(MISMATCH)로 따로 남기고, 정정된 다음 스냅샷은 저장된 이력 기준으로 판정한다.
                log.warn("billing decided invoice snapshot mismatch subscription={} invoice={}", row.getSysId(),
                        invoice.invoiceId());
                return Applied.DECIDED_MISMATCH;
            }
            applyResult = "MISMATCH";
            log.warn("billing invoice mismatch subscription={} invoice={}", row.getSysId(), invoice.invoiceId());
        } else if (firstPaid) {
            PaidDecision decision = decidePaid(row, invoice, now);
            applyResult = decision.applyResult();
            boolean expire = REFUND_STATUSES.contains(invoice.status())
                    && applyRefund(row, decision.next(), "APPLIED".equals(applyResult), invoice, now);
            applied = Applied.of(decision.grantRole(), expire);
        } else if ("FAILED".equals(invoice.status())) {
            applyFailure(row, invoice, now);
        } else if (REFUND_STATUSES.contains(invoice.status()) && refundedMore(existing, invoice)
                && applyRefund(row, row.getStatus(),
                        existing != null && "APPLIED".equals(existing.getApplyResult()), invoice, now)) {
            applied = Applied.EXPIRED;
        }
        upsertInvoice(existing, row, provider, invoice, applyResult);
        return applied;
    }

    /** 이 인보이스의 결제가 아직 구독에 반영되지 않았다(없음, 결제 전 상태, 또는 MISMATCH로만 기록됨). */
    private static boolean unapplied(SubscriptionInvoice existing) {
        return existing == null || !PAID_FAMILY.contains(existing.getStatus())
                || "MISMATCH".equals(existing.getApplyResult());
    }

    /** 반영 여부를 이미 판정한 인보이스(APPLIED/STALE/AFTER_CANCEL/OWNER_MISSING). MISMATCH와 미기록(null)은 아니다. */
    private static boolean decided(SubscriptionInvoice existing) {
        return existing != null && existing.getApplyResult() != null && !"MISMATCH".equals(existing.getApplyResult());
    }

    private static boolean refundedMore(SubscriptionInvoice existing, ProviderInvoice invoice) {
        return existing == null || invoice.refundedAmount() > existing.getRefundedAmount();
    }

    /**
     * E4/E5. 판정은 이벤트 금액이 아니라 재조회한 누적 환불액(§4). 현재 회차(시작 <= now < 끝)이고 이 구독 기간을 실제로
     * 준(APPLIED) 결제가 누적 전액 환불되면 E4(만료 + 회수 + 종료), 그 밖(부분, 과거 회차, 환불 대기 결제)은 E5 기록만.
     * true = 만료시켰다(회수와 제공자 종료는 호출자).
     */
    private boolean applyRefund(Subscription row, SubscriptionStatus status, boolean grantedThisPeriod,
                                ProviderInvoice invoice, Instant now) {
        boolean full = invoice.refundedAmount() >= invoice.amount();
        SubscriptionEvent event = full && currentPeriod(invoice, now) && grantedThisPeriod
                ? SubscriptionEvent.CURRENT_PERIOD_FULL_REFUND : SubscriptionEvent.OTHER_REFUND;
        var outcome = SubscriptionTransition.apply(status, event, SubscriptionFacts.at(now));
        if (outcome.kind() != SubscriptionTransition.Kind.APPLY || outcome.next() != SubscriptionStatus.EXPIRED) return false;
        lifecycle.expireLocked(row, now);
        return true;
    }

    /**
     * E3. 재조회 결과가 FAILED인 회차만 온다. ACTIVE는 아직 내지 않은 다음 회차(최신 미결)일 때만 PAST_DUE + 7일 유예.
     * 이미 낸 기간의 실패(늦게 온 옛 회차)는 기록만 한다.
     */
    private void applyFailure(Subscription row, ProviderInvoice invoice, Instant now) {
        boolean latestOpen = row.getPaidThroughAt() == null
                || (invoice.periodEndAt() != null && invoice.periodEndAt().isAfter(row.getPaidThroughAt()));
        SubscriptionFacts facts = SubscriptionFacts.at(now).withPaidThroughAt(row.getPaidThroughAt())
                .withGraceUntil(row.getGraceUntil()).withConfirmedLatestFailure(true, latestOpen);
        var actions = SubscriptionTransition.apply(row.getStatus(), SubscriptionEvent.INVOICE_FAILED, facts).actions();
        String code = invoice.failureCode() == null ? "FAILED" : invoice.failureCode();
        if (actions.contains(SubscriptionAction.SET_GRACE)) {
            subscriptions.markPastDue(row.getSysId(), row.getPaidThroughAt().plus(SubscriptionTransition.GRACE), code, ACTOR);
        } else if (actions.contains(SubscriptionAction.RECORD_FAILURE)) {
            subscriptions.recordFailure(row.getSysId(), code, ACTOR);
        }
    }

    /** 기간 시작 <= now < 끝. */
    private static boolean currentPeriod(ProviderInvoice invoice, Instant now) {
        return invoice.periodStartAt() != null && invoice.periodEndAt() != null
                && !now.isBefore(invoice.periodStartAt()) && now.isBefore(invoice.periodEndAt());
    }

    /** sys_user는 잠금 순서의 마지막. 복원한 결제 뒤 전액 환불이면 승격 뒤 바로 회수한다. */
    private void finishUser(Subscription row, Applied applied, Instant now) {
        if (applied.granted() && subscriptions.grantOwnerRole(row.getSysId(), ACTOR) == 1) {
            subscriptions.markRoleGranted(row.getSysId(), now, ACTOR);
        }
        if (applied.expired()) lifecycle.revokeLocked(row.getSysId(), now);
    }

    /** 서명된 요청의 ID와 재조회 결과가 같은 인보이스/구독을 가리켜야 한다. 본문에 없는 ID는 비교하지 않는다. */
    private static boolean noticeMatchesLookup(BillingNotice notice, ProviderInvoice invoice) {
        return Objects.equals(notice.invoiceId(), invoice.invoiceId())
                && (notice.subscriptionId() == null || notice.subscriptionId().equals(invoice.subscriptionId()))
                && (notice.customerId() == null || notice.customerId().equals(invoice.customerId()));
    }

    /**
     * 우리 상점 인보이스인데 그 제공자 구독이 어떤 구독 행에도 연결돼 있지 않다(예: 교체 전 옛 등록이 종료되지 않고 청구됨).
     * 조용히 IGNORED로 넘기지 않는다. 같은 등록의 인보이스를 기록한 구독이 하나로 정해지면 그 구독의 MISMATCH 인보이스로
     * 남겨 Admin 문제 건(환불 대상)에 보이고, 아니면 연결 불일치 웹훅으로만 남긴다. 구독 상태/권한은 바꾸지 않는다.
     */
    private void unlinkedCharge(BillingProvider provider, BillingNotice notice, ProviderInvoice invoice,
                                List<String> siblingInvoiceIds, Instant now) {
        String owner = siblingInvoiceIds.isEmpty() ? null
                : invoices.findSubscriptionOfProviderInvoices(provider.name(), provider.storeId(), siblingInvoiceIds);
        Subscription ownerRow = owner == null ? null : subscriptions.lockById(owner);
        if (ownerRow != null && provider.storeId().equals(invoice.storeId())) {
            SubscriptionInvoice existing = invoices.lockByProviderInvoice(provider.name(), provider.storeId(), invoice.invoiceId());
            boolean sameOwner = existing == null || ownerRow.getSysId().equals(existing.getSubscriptionSysId());
            boolean newer = existing == null || invoice.updatedAt().isAfter(existing.getProviderUpdatedAt());
            if (sameOwner && newer) upsertInvoice(existing, ownerRow, provider, invoice, "MISMATCH");
        }
        mismatch(provider, notice, "UNLINKED_REGISTRATION", now);
    }

    /** 연결 불일치: 구독/인보이스/사용자 행은 그대로 두고 이벤트만 MISMATCH로 남긴다(Admin 문제 건). */
    private void mismatch(BillingProvider provider, BillingNotice notice, String reason, Instant now) {
        log.warn("billing webhook mismatch provider={} webhookId={} reason={}", provider.name(), notice.webhookId(), reason);
        insertEvent(provider, notice, "MISMATCH", now);
    }

    /** next = 반영 뒤 구독 상태(반영하지 않았으면 지금 상태). */
    private record PaidDecision(String applyResult, boolean grantRole, SubscriptionStatus next) {}

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
        if (actions.contains(SubscriptionAction.HOLD_REFUND_AFTER_CANCEL)) {
            return new PaidDecision("AFTER_CANCEL", false, row.getStatus());
        }
        if (actions.contains(SubscriptionAction.HOLD_REFUND_STALE)) return new PaidDecision("STALE", false, row.getStatus());
        if (outcome.kind() != SubscriptionTransition.Kind.APPLY) {
            // ACTIVE인데 다음 회차가 아닌 결제 = 이미 낸 기간의 중복 결제. 환불 대상으로 표시만 한다.
            return new PaidDecision("STALE", false, row.getStatus());
        }
        subscriptions.applyPaid(row.getSysId(), outcome.next().name(),
                actions.contains(SubscriptionAction.EXTEND_PERIOD) ? invoice.periodEndAt() : null,
                actions.contains(SubscriptionAction.CLEAR_GRACE), ACTOR);
        if (!actions.contains(SubscriptionAction.GRANT_ROLE)) return new PaidDecision("APPLIED", false, outcome.next());
        String ownerRole = subscriptions.findOwnerRole(row.getSysId());
        if (ownerRole == null) return new PaidDecision("OWNER_MISSING", false, outcome.next());
        // 이미 01(레거시/수동)이면 UPDATE 0행이라 role_granted_yn은 N 그대로다.
        return new PaidDecision("APPLIED", "02".equals(ownerRole), outcome.next());
    }

    /** 제공자/상점/고객/구독 연결: 조회한 인보이스와 구독이 잠긴 구독 행의 저장 키를 가리킨다(§7 확인 항목). */
    private static boolean linked(BillingProvider provider, Subscription row, ProviderInvoice invoice,
                                  ProviderSubscription subscription) {
        return subscription != null
                && provider.storeId().equals(invoice.storeId())
                && provider.storeId().equals(subscription.storeId())
                && row.getProviderSubscriptionId() != null
                && row.getProviderSubscriptionId().equals(invoice.subscriptionId())
                && row.getProviderSubscriptionId().equals(subscription.subscriptionId())
                && row.getProviderCustomerId() != null
                && row.getProviderCustomerId().equals(invoice.customerId())
                && row.getProviderCustomerId().equals(subscription.customerId());
    }

    /** 연결 확인 뒤의 확인 항목: 상품, 정기 자동 카드 결제, 금액 = 스냅샷(0원 제외), KRW, 결제된 회차는 기간 시작 < 끝. */
    private boolean matches(Subscription row, ProviderInvoice invoice, ProviderSubscription subscription) {
        String planCode = row.getPlanSysId() == null ? null : subscriptions.findPlanCode(row.getPlanSysId());
        String expectedProduct = BillingProviderRegistry.productIdFor(environment, planCode);
        return expectedProduct != null && expectedProduct.equals(invoice.productId())
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
