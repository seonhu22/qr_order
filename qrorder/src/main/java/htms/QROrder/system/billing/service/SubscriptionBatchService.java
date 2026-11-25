package htms.QROrder.system.billing.service;

import htms.QROrder.system.billing.domain.ProviderReconcile;
import htms.QROrder.system.billing.domain.Subscription;
import htms.QROrder.system.billing.domain.SubscriptionEvent;
import htms.QROrder.system.billing.domain.SubscriptionFacts;
import htms.QROrder.system.billing.domain.SubscriptionStatus;
import htms.QROrder.system.billing.domain.SubscriptionTransition;
import htms.QROrder.system.billing.provider.BillingProvider;
import htms.QROrder.system.billing.provider.BillingProviderRegistry;
import htms.QROrder.system.billing.repository.SubscriptionMapper;
import htms.QROrder.system.billing.service.BillingWebhookService.ReconcileResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;

/**
 * 기한 도래(E8) 배치(정책 4C §8). 후보는 잠금 없이 고르고, 행마다 잠근 뒤 조건을 다시 계산한다(잠금 전 판단은 버린다).
 * ACTIVE는 먼저 잠금 밖에서 제공자를 대사해 놓친 결제를 반영하고, 대사가 성공했을 때만 만료할 수 있다.
 * 만료 뒤 제공자 종료를 요청하고, 종료가 REQUESTED/FAILED로 남은 행은 다음 실행에서 다시 요청한다.
 */
@Slf4j
@Service
public class SubscriptionBatchService {
    private final SubscriptionMapper subscriptions;
    private final BillingProviderRegistry providers;
    private final BillingWebhookService billing;
    private final SubscriptionLifecycleService lifecycle;
    private final TransactionTemplate transaction;

    public record Report(int candidates, int expired, int revoked, int providerEnded, int providerEndFailed,
                         int reconcileFailed) {}

    public SubscriptionBatchService(SubscriptionMapper subscriptions, BillingProviderRegistry providers,
                                    BillingWebhookService billing, SubscriptionLifecycleService lifecycle,
                                    PlatformTransactionManager transactionManager) {
        this.subscriptions = subscriptions;
        this.providers = providers;
        this.billing = billing;
        this.lifecycle = lifecycle;
        this.transaction = new TransactionTemplate(transactionManager);
    }

    private record RowResult(boolean expired, boolean revoked) {}

    public Report run(Instant asOf) {
        var ids = subscriptions.findBatchCandidates(asOf, asOf.minus(SubscriptionTransition.GRACE));
        int expired = 0, revoked = 0, ended = 0, endFailed = 0, reconcileFailed = 0;
        for (String id : ids) {
            Subscription seen = subscriptions.findById(id);
            if (seen == null) continue;
            ProviderReconcile reconcile = ProviderReconcile.NOT_RUN;
            if (seen.getStatus() == SubscriptionStatus.ACTIVE) {
                reconcile = reconcile(seen);
                if (reconcile == ProviderReconcile.FAILED) reconcileFailed++;
            }
            ProviderReconcile reconciled = reconcile;
            RowResult result = transaction.execute(status -> due(id, asOf, reconciled));
            if (result != null && result.expired()) expired++;
            if (result != null && result.revoked()) revoked++;
            String end = lifecycle.endProvider(id);
            if ("DONE".equals(end) && !"DONE".equals(seen.getProviderEndStatus())) ended++;
            if ("FAILED".equals(end)) endFailed++;
        }
        var report = new Report(ids.size(), expired, revoked, ended, endFailed, reconcileFailed);
        if (!ids.isEmpty()) log.info("billing batch asOf={} report={}", asOf, report);
        return report;
    }

    private ProviderReconcile reconcile(Subscription seen) {
        BillingProvider provider = providers.find(seen.getProvider()).orElse(null);
        if (provider == null) return ProviderReconcile.FAILED;
        // 저장 키와 일치하는 조회를 마친 경우만 성공. 등록 없음/상점 불일치/다른 구독은 만료 근거가 아니다.
        return billing.reconcile(provider, seen.getSysId()) == ReconcileResult.CHECKED
                ? ProviderReconcile.NO_UNSEEN_PAYMENT : ProviderReconcile.FAILED;
    }

    private RowResult due(String id, Instant asOf, ProviderReconcile reconcile) {
        Subscription row = subscriptions.lockById(id);
        if (row == null) return new RowResult(false, false);
        SubscriptionFacts facts = SubscriptionFacts.at(asOf).withPaidThroughAt(row.getPaidThroughAt())
                .withGraceUntil(row.getGraceUntil()).withEndAt(row.getEndAt()).withReconcile(reconcile);
        var outcome = SubscriptionTransition.apply(row.getStatus(), SubscriptionEvent.DUE, facts);
        if (outcome.kind() != SubscriptionTransition.Kind.APPLY || outcome.next() != SubscriptionStatus.EXPIRED) {
            return new RowResult(false, false);
        }
        lifecycle.expireLocked(row, asOf);
        return new RowResult(true, lifecycle.revokeLocked(row.getSysId(), asOf));
    }
}
