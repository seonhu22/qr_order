package htms.QROrder.system.billing.service;

import htms.QROrder.system.billing.domain.Subscription;
import htms.QROrder.system.billing.domain.SubscriptionStatus;
import htms.QROrder.system.billing.provider.BillingProvider;
import htms.QROrder.system.billing.provider.BillingProviderRegistry;
import htms.QROrder.system.billing.provider.ProviderUnavailableException;
import htms.QROrder.system.billing.repository.SubscriptionMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.Set;

/**
 * 만료(X)와 그 뒤처리(정책 4C §3 "회수", "종료"). 만료/회수는 호출자가 잠근 행에서, 제공자 종료는 커밋 뒤 잠금 밖에서.
 * 제공자 종료가 실패하면 FAILED로 남기고 배치가 다시 요청한다(§8).
 */
@Slf4j
@Service
public class SubscriptionLifecycleService {
    static final String ACTOR = "BILLING_LIFECYCLE";
    private static final Set<String> END_PENDING = Set.of("REQUESTED", "FAILED");

    private final SubscriptionMapper subscriptions;
    private final BillingProviderRegistry providers;
    private final TransactionTemplate transaction;

    public SubscriptionLifecycleService(SubscriptionMapper subscriptions, BillingProviderRegistry providers,
                                        PlatformTransactionManager transactionManager) {
        this.subscriptions = subscriptions;
        this.providers = providers;
        this.transaction = new TransactionTemplate(transactionManager);
    }

    /** 잠긴 진행 중 행을 EXPIRED로. 제공자 등록이 있으면 종료 요청 대기(REQUESTED). sys_user는 아직 건드리지 않는다. */
    public void expireLocked(Subscription row, Instant now) {
        String end = row.getProviderSubscriptionId() == null ? "DONE" : "REQUESTED";
        subscriptions.expire(row.getSysId(), now, end, ACTOR);
    }

    /** 회수: 이 구독이 올린 01만 02로(role_granted_yn='Y', role_revoked_at 없음). 잠금 순서의 마지막(sys_user). */
    public boolean revokeLocked(String subscriptionSysId, Instant now) {
        if (subscriptions.revokeOwnerRole(subscriptionSysId, ACTOR) != 1) return false;
        subscriptions.markRoleRevoked(subscriptionSysId, now, ACTOR);
        return true;
    }

    /** 커밋 뒤 호출. 종료 요청 대기 중인 EXPIRED 행만 제공자에 종료를 요청하고 결과를 DONE/FAILED로 남긴다. */
    public String endProvider(String subscriptionSysId) {
        Subscription row = subscriptions.findById(subscriptionSysId);
        if (row == null || row.getStatus() != SubscriptionStatus.EXPIRED || !END_PENDING.contains(row.getProviderEndStatus())) {
            return row == null ? null : row.getProviderEndStatus();
        }
        BillingProvider provider = providers.find(row.getProvider()).orElse(null);
        String result;
        if (provider == null) {
            result = "FAILED";
        } else {
            try {
                provider.endSubscription(row.getProviderSubscriptionId());
                result = "DONE";
            } catch (ProviderUnavailableException | IllegalStateException | IllegalArgumentException failed) {
                log.warn("billing provider end failed subscription={} reason={}", subscriptionSysId, failed.getMessage());
                result = "FAILED";
            }
        }
        String outcome = result;
        transaction.executeWithoutResult(status -> {
            subscriptions.lockById(subscriptionSysId);
            subscriptions.markProviderEnd(subscriptionSysId, outcome, ACTOR);
        });
        return outcome;
    }
}
