package htms.QROrder.system.billing.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.auth.domain.Login;
import htms.QROrder.system.billing.domain.Subscription;
import htms.QROrder.system.billing.domain.SubscriptionAction;
import htms.QROrder.system.billing.domain.SubscriptionEvent;
import htms.QROrder.system.billing.domain.SubscriptionFacts;
import htms.QROrder.system.billing.domain.SubscriptionPlan;
import htms.QROrder.system.billing.domain.SubscriptionStatus;
import htms.QROrder.system.billing.domain.SubscriptionTransition;
import htms.QROrder.system.billing.dto.ClientSubscriptionDtos.CheckoutLaunchView;
import htms.QROrder.system.billing.dto.ClientSubscriptionDtos.InvoiceItem;
import htms.QROrder.system.billing.dto.ClientSubscriptionDtos.PlanItem;
import htms.QROrder.system.billing.dto.ClientSubscriptionDtos.SubscriptionView;
import htms.QROrder.system.billing.provider.BillingModels.CheckoutLaunch;
import htms.QROrder.system.billing.provider.BillingModels.CheckoutRequest;
import htms.QROrder.system.billing.provider.BillingProvider;
import htms.QROrder.system.billing.provider.BillingProviderRegistry;
import htms.QROrder.system.billing.provider.ProviderUnavailableException;
import htms.QROrder.system.billing.repository.SubscriptionInvoiceMapper;
import htms.QROrder.system.billing.repository.SubscriptionMapper;
import htms.QROrder.system.billing.service.BillingWebhookService.ReconcileResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Client 구독(정책 4C §10). 조회는 자기 매장 누구나, 결제/재확인/이력은 구독 대표 본인만.
 * 결제 시작: 잠금 안에서 시도 ID + 플랜 스냅샷을 먼저 커밋 → 잠금 밖 제공자 사전 등록 → 같은 시도일 때만 등록 ID 저장(§6).
 */
@Slf4j
@Service
public class ClientSubscriptionService {
    /** 재확인 버튼은 구독마다 10초에 1번. */
    public static final Duration RECONCILE_INTERVAL = Duration.ofSeconds(10);
    static final String ACTOR = "CLIENT_SUBSCRIPTION";
    private static final Set<SubscriptionStatus> CHECKOUT_STATUSES =
            Set.of(SubscriptionStatus.PENDING, SubscriptionStatus.PAST_DUE);

    private final SubscriptionMapper subscriptions;
    private final SubscriptionInvoiceMapper invoices;
    private final BillingProviderRegistry providers;
    private final BillingWebhookService billing;
    private final SubscriptionLifecycleService lifecycle;
    private final TransactionTemplate transaction;
    private final Environment environment;
    private final Clock clock;
    private final Map<String, Instant> lastReconcile = new ConcurrentHashMap<>();

    @Autowired
    public ClientSubscriptionService(SubscriptionMapper subscriptions, SubscriptionInvoiceMapper invoices,
                                     BillingProviderRegistry providers, BillingWebhookService billing,
                                     SubscriptionLifecycleService lifecycle,
                                     PlatformTransactionManager transactionManager, Environment environment) {
        this(subscriptions, invoices, providers, billing, lifecycle, transactionManager, environment, Clock.systemUTC());
    }

    public ClientSubscriptionService(SubscriptionMapper subscriptions, SubscriptionInvoiceMapper invoices,
                                     BillingProviderRegistry providers, BillingWebhookService billing,
                                     SubscriptionLifecycleService lifecycle,
                                     PlatformTransactionManager transactionManager, Environment environment,
                                     Clock clock) {
        this.subscriptions = subscriptions;
        this.invoices = invoices;
        this.providers = providers;
        this.billing = billing;
        this.lifecycle = lifecycle;
        this.transaction = new TransactionTemplate(transactionManager);
        this.environment = environment;
        this.clock = clock;
    }

    public SubscriptionView view(Login actor) {
        String plantCd = plantOf(actor);
        Subscription row = subscriptions.findLatestByPlant(plantCd);
        List<PlanItem> plans = subscriptions.findPlans().stream()
                .map(p -> new PlanItem(p.getPlanSysId(), p.getPlanName(), p.getAmount(), p.getCurrency(), p.getPeriodMonth()))
                .toList();
        if (row == null) {
            return new SubscriptionView(false, null, false, null, null, null, null, null, null, null, null,
                    null, false, null, false, false, plans);
        }
        boolean owner = actor.getSysId().equals(row.getOwnerUserSysId());
        SubscriptionPlan plan = row.getPlanSysId() == null ? null : subscriptions.findPlan(row.getPlanSysId());
        SubscriptionStatus status = row.getStatus();
        boolean providerOn = providers.active().isPresent();
        boolean canCheckout = owner && providerOn
                && (CHECKOUT_STATUSES.contains(status) || status == SubscriptionStatus.EXPIRED);
        boolean canCancel = owner && status != SubscriptionStatus.EXPIRED && status != SubscriptionStatus.CANCEL_SCHEDULED;
        return new SubscriptionView(true, status.name(), owner, row.getPlanSysId(),
                plan == null ? null : plan.getPlanName(), row.getAmount(), row.getCurrency(), row.getPeriodMonth(),
                row.getPaidThroughAt(), row.getGraceUntil(), row.getEndAt(), row.getPaymentMethodStatus(),
                "Y".equals(row.getRoleGrantedYn()), owner ? row.getLastFailureCode() : null,
                canCheckout, canCancel, owner ? plans : List.of());
    }

    public List<InvoiceItem> invoices(Login actor) {
        Subscription row = ownedRow(actor);
        return invoices.listBySubscription(row.getSysId()).stream()
                .map(i -> new InvoiceItem(i.getSysId(), i.getStatus(), i.getAmount(), i.getRefundedAmount(),
                        i.getCurrency(), i.getAttemptCount(), i.getPeriodStartAt(), i.getPeriodEndAt(), i.getPaidAt()))
                .toList();
    }

    /** 결제창이 돌아온 뒤 웹훅을 기다리지 않고 제공자를 다시 조회한다(같은 검증 경로). 10초 1회. */
    public SubscriptionView reconcile(Login actor) {
        Subscription row = ownedRow(actor);
        Instant now = clock.instant();
        Instant previous = lastReconcile.get(row.getSysId());
        if (previous != null && now.isBefore(previous.plus(RECONCILE_INTERVAL))) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "10초 뒤에 다시 확인해 주세요.");
        }
        lastReconcile.put(row.getSysId(), now);
        BillingProvider provider = providers.find(row.getProvider()).orElse(null);
        if (provider != null && billing.reconcile(provider, row.getSysId()) == ReconcileResult.FAILED) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "결제사 확인에 실패했습니다. 잠시 뒤 다시 확인해 주세요.");
        }
        return view(actor);
    }

    /**
     * E6 해지 예약. ACTIVE = 유료기간 끝에 끝나도록 end_at 고정(이후 결제는 AFTER_CANCEL로 연장 없음),
     * PAST_DUE = 기간이 남았으면 같은 예약, 끝났으면 즉시 만료 + 회수, PENDING = 즉시 만료. 이미 예약/만료면 그대로 200.
     */
    public SubscriptionView cancel(Login actor) {
        String plantCd = plantOf(actor);
        Boolean endProvider = transaction.execute(status -> {
            Instant now = clock.instant();
            Subscription row = subscriptions.lockOpenByPlant(plantCd);
            if (row == null) {
                ownedRow(actor);
                return false;
            }
            if (!actor.getSysId().equals(row.getOwnerUserSysId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "구독 대표만 해지할 수 있습니다.");
            }
            var outcome = SubscriptionTransition.apply(row.getStatus(), SubscriptionEvent.CANCEL_REQUEST,
                    SubscriptionFacts.at(now).withPaidThroughAt(row.getPaidThroughAt()));
            if (outcome.kind() != SubscriptionTransition.Kind.APPLY) return false;
            if (outcome.actions().contains(SubscriptionAction.FIX_END_AT)) {
                subscriptions.scheduleCancel(row.getSysId(), now, ACTOR);
                return false;
            }
            lifecycle.expireLocked(row, now);
            if (outcome.actions().contains(SubscriptionAction.REVOKE_ROLE)) lifecycle.revokeLocked(row.getSysId(), now);
            return outcome.actions().contains(SubscriptionAction.END_PROVIDER);
        });
        if (Boolean.TRUE.equals(endProvider)) {
            Subscription latest = subscriptions.findLatestByPlant(plantCd);
            if (latest != null) lifecycle.endProvider(latest.getSysId());
        }
        return view(actor);
    }

    private record Step(String subscriptionSysId, boolean reregister, String attemptId, String providerSubscriptionId,
                        String productId, Integer amount, String currency, Integer periodMonth) {}

    public CheckoutLaunchView checkout(Login actor, String planSysId) {
        // 매장/대표 확인이 먼저다. 직원 요청은 플랜 검증이나 대사(구독/역할 쓰기) 전에 403으로 끝난다. 잠금 뒤 다시 확인한다.
        String plantCd = plantOf(actor);
        ownedRow(actor, "구독 대표만 결제할 수 있습니다.");
        BillingProvider provider = providers.active().orElseThrow(() ->
                new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "결제 제공자가 설정되지 않았습니다."));
        SubscriptionPlan plan = planSysId == null ? null : subscriptions.findPlan(planSysId);
        if (plan == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "플랜을 선택해 주세요.");
        reconcileExpiredAttempt(provider, plantCd);

        Step step;
        try {
            step = transaction.execute(status -> prepare(provider, actor, plantCd, plan));
        } catch (DuplicateKeyException race) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "다른 결제 시도가 먼저 시작되었습니다. 새로고침해 주세요.");
        }
        CheckoutLaunch launch;
        try {
            launch = step.reregister()
                    ? provider.reregisterPaymentMethod(step.providerSubscriptionId(), actor.getSysId())
                    : provider.startCheckout(new CheckoutRequest(step.subscriptionSysId(), actor.getSysId(), plantCd,
                    step.productId(), step.amount(), step.currency(), step.periodMonth(), step.attemptId()));
        } catch (ProviderUnavailableException unavailable) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "결제사 연결에 실패했습니다. 잠시 뒤 다시 시도해 주세요.");
        } catch (IllegalStateException | IllegalArgumentException rejected) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, rejected.getMessage());
        }
        if (!step.reregister()) {
            Integer saved = transaction.execute(status -> {
                subscriptions.lockById(step.subscriptionSysId());
                return subscriptions.saveCheckoutRegistration(step.subscriptionSysId(), step.attemptId(),
                        launch.providerCustomerId(), launch.providerSubscriptionId(), launch.expiresAt(), ACTOR);
            });
            if (saved == null || saved != 1) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "다른 결제 시도가 먼저 시작되었습니다. 새로고침해 주세요.");
            }
        }
        return new CheckoutLaunchView(launch.provider(), launch.launch(), launch.expiresAt());
    }

    /** 만료된 시도의 등록은 버리기 전에 대사한다(창이 닫힌 뒤 결제 + 웹훅 유실). */
    private void reconcileExpiredAttempt(BillingProvider provider, String plantCd) {
        Subscription open = subscriptions.findOpenByPlant(plantCd);
        if (open != null && open.getStatus() == SubscriptionStatus.PENDING && open.getProviderSubscriptionId() != null
                && !checkoutOpen(open, open.getPlanSysId(), clock.instant())) {
            billing.reconcile(provider, open.getSysId());
        }
    }

    private Step prepare(BillingProvider provider, Login actor, String plantCd, SubscriptionPlan plan) {
        Instant now = clock.instant();
        Subscription row = subscriptions.lockOpenByPlant(plantCd);
        if (row == null) row = resubscribe(actor, plantCd, now);
        if (!actor.getSysId().equals(row.getOwnerUserSysId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "구독 대표만 결제할 수 있습니다.");
        }
        SubscriptionFacts facts = SubscriptionFacts.at(now).withCheckoutOpen(checkoutOpen(row, plan.getPlanSysId(), now));
        var outcome = SubscriptionTransition.apply(row.getStatus(), SubscriptionEvent.CHECKOUT_START, facts);
        if (outcome.rejected()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 결제된 구독입니다.");
        }
        String productId = BillingProviderRegistry.productIdFor(environment, plan.getPlanCode());
        if (outcome.actions().contains(SubscriptionAction.REREGISTER_PAYMENT_METHOD)) {
            if (row.getProviderSubscriptionId() == null || !provider.name().equals(row.getProvider())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "결제사 등록 정보가 없습니다. 관리자에게 문의해 주세요.");
            }
            return new Step(row.getSysId(), true, null, row.getProviderSubscriptionId(), productId,
                    row.getAmount(), row.getCurrency(), row.getPeriodMonth());
        }
        if (outcome.actions().contains(SubscriptionAction.RESUME_CHECKOUT)) {
            return new Step(row.getSysId(), false, row.getCheckoutAttemptId(), null, productId,
                    row.getAmount(), row.getCurrency(), row.getPeriodMonth());
        }
        // START_NEW_CHECKOUT: 새 시도 ID와 스냅샷을 제공자 호출 전에 커밋한다. 옛 등록(INCOMPLETE)은 결제되지 않은 채 남는다.
        String attemptId = "att_" + UlidCreator.getUlid();
        subscriptions.startCheckoutAttempt(row.getSysId(), plan.getPlanSysId(), plan.getAmount(), plan.getCurrency(),
                plan.getPeriodMonth(), provider.name(), provider.storeId(), attemptId,
                now.plus(Duration.ofMinutes(10)), ACTOR);
        return new Step(row.getSysId(), false, attemptId, null, productId, plan.getAmount(), plan.getCurrency(),
                plan.getPeriodMonth());
    }

    /** EXPIRED 뒤 재구독: 직전 대표 본인, 제공자 종료 확인, 결제 진행 중 인보이스 0건(§1). 새 PENDING 행. */
    private Subscription resubscribe(Login actor, String plantCd, Instant now) {
        Subscription latest = subscriptions.findLatestByPlant(plantCd);
        if (latest == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "이 매장은 구독 대상이 아닙니다.");
        if (!actor.getSysId().equals(latest.getOwnerUserSysId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "구독 대표만 결제할 수 있습니다.");
        }
        boolean allowed = Set.of("NONE", "DONE").contains(latest.getProviderEndStatus())
                && subscriptions.countPendingInvoices(latest.getSysId()) == 0;
        var outcome = SubscriptionTransition.apply(SubscriptionStatus.EXPIRED, SubscriptionEvent.CHECKOUT_START,
                SubscriptionFacts.at(now).withResubscribeAllowed(allowed));
        if (outcome.rejected()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "재구독은 직전 대표가 결제사 종료 확인 뒤에만 할 수 있습니다.");
        }
        Subscription created = new Subscription();
        created.setSysId(UlidCreator.getUlid().toString());
        created.setPlantCd(plantCd);
        created.setOwnerUserSysId(actor.getSysId());
        created.setStatus(SubscriptionStatus.PENDING);
        created.setInsertUserId(ACTOR);
        subscriptions.insertSubscription(created);
        return subscriptions.lockById(created.getSysId());
    }

    private static boolean checkoutOpen(Subscription row, String planSysId, Instant now) {
        return row.getCheckoutAttemptId() != null && row.getProviderSubscriptionId() != null
                && row.getCheckoutExpiresAt() != null && now.isBefore(row.getCheckoutExpiresAt())
                && Objects.equals(planSysId, row.getPlanSysId());
    }

    private Subscription ownedRow(Login actor) {
        return ownedRow(actor, "구독 대표만 볼 수 있습니다.");
    }

    private Subscription ownedRow(Login actor, String forbidden) {
        Subscription row = subscriptions.findLatestByPlant(plantOf(actor));
        if (row == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "구독 정보가 없습니다.");
        if (!actor.getSysId().equals(row.getOwnerUserSysId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, forbidden);
        }
        return row;
    }

    private static String plantOf(Login actor) {
        if (actor == null || actor.getSysId() == null || actor.getSysPlantCd() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return actor.getSysPlantCd();
    }
}
