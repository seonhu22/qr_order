package htms.QROrder.system.billing.service;

import htms.QROrder.system.billing.domain.Subscription;
import htms.QROrder.system.billing.domain.SubscriptionInvoice;
import htms.QROrder.system.billing.dto.AdminSubscriptionDtos.RefundAccepted;
import htms.QROrder.system.billing.provider.BillingProvider;
import htms.QROrder.system.billing.provider.BillingProviderRegistry;
import htms.QROrder.system.billing.provider.ProviderUnavailableException;
import htms.QROrder.system.billing.repository.SubscriptionInvoiceMapper;
import htms.QROrder.system.billing.repository.SubscriptionMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import htms.QROrder.system.billing.domain.BillingWebhookEvent;
import htms.QROrder.system.billing.domain.SubscriptionStatus;
import htms.QROrder.system.billing.dto.AdminSubscriptionDtos.AdminEvent;
import htms.QROrder.system.billing.dto.AdminSubscriptionDtos.AdminInvoice;
import htms.QROrder.system.billing.dto.AdminSubscriptionDtos.AdminSubscriptionDetail;
import htms.QROrder.system.billing.dto.AdminSubscriptionDtos.AdminSubscriptionList;
import htms.QROrder.system.billing.dto.AdminSubscriptionRow;
import htms.QROrder.system.billing.repository.BillingWebhookEventMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Admin 구독 관리(정책 4C §10). 환불은 제공자에 요청만 하고(잠금 밖), 상태/권한 반영은 환불 웹훅이 재조회 값으로 한다(§4).
 */
@Service
public class AdminSubscriptionService {
    private static final Set<String> REFUNDABLE = Set.of("PAID", "PARTIALLY_REFUNDED");
    private static final Set<String> STATUSES = Set.of("PENDING", "ACTIVE", "PAST_DUE", "CANCEL_SCHEDULED", "EXPIRED");
    static final String ACTOR = "ADMIN_SUBSCRIPTION";

    private final SubscriptionMapper subscriptions;
    private final SubscriptionInvoiceMapper invoices;
    private final BillingWebhookEventMapper events;
    private final BillingProviderRegistry providers;
    private final SubscriptionLifecycleService lifecycle;
    private final TransactionTemplate transaction;
    private final Clock clock;

    @Autowired
    public AdminSubscriptionService(SubscriptionMapper subscriptions, SubscriptionInvoiceMapper invoices,
                                    BillingWebhookEventMapper events, BillingProviderRegistry providers,
                                    SubscriptionLifecycleService lifecycle, PlatformTransactionManager transactionManager) {
        this(subscriptions, invoices, events, providers, lifecycle, transactionManager, Clock.systemUTC());
    }

    public AdminSubscriptionService(SubscriptionMapper subscriptions, SubscriptionInvoiceMapper invoices,
                                    BillingWebhookEventMapper events, BillingProviderRegistry providers,
                                    SubscriptionLifecycleService lifecycle, PlatformTransactionManager transactionManager,
                                    Clock clock) {
        this.subscriptions = subscriptions;
        this.invoices = invoices;
        this.events = events;
        this.providers = providers;
        this.lifecycle = lifecycle;
        this.transaction = new TransactionTemplate(transactionManager);
        this.clock = clock;
    }

    public AdminSubscriptionList list(String status, boolean problemOnly) {
        if (status != null && !status.isBlank() && !STATUSES.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "알 수 없는 구독 상태입니다.");
        }
        return new AdminSubscriptionList(subscriptions.findAdminRows(status, problemOnly),
                events.findMismatches(50).stream().map(AdminSubscriptionService::event).toList());
    }

    public AdminSubscriptionDetail detail(String subscriptionSysId) {
        AdminSubscriptionRow row = subscriptions.findAdminRow(subscriptionSysId);
        Subscription subscription = subscriptions.findById(subscriptionSysId);
        if (row == null || subscription == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "구독을 찾을 수 없습니다.");
        List<SubscriptionInvoice> rows = invoices.listBySubscription(subscriptionSysId);
        List<String> resources = new ArrayList<>();
        if (subscription.getProviderSubscriptionId() != null) resources.add(subscription.getProviderSubscriptionId());
        rows.forEach(i -> resources.add(i.getProviderInvoiceId()));
        List<AdminEvent> found = resources.isEmpty() ? List.of()
                : events.findByResources(resources).stream().map(AdminSubscriptionService::event).toList();
        return new AdminSubscriptionDetail(row, subscription.getProviderSubscriptionId(),
                rows.stream().map(AdminSubscriptionService::invoice).toList(), found,
                subscription.getStatus() != SubscriptionStatus.EXPIRED);
    }

    /**
     * 즉시 종료(대표 소실, 매장 삭제 등 운영 판단). 잠근 행을 만료 + 이 구독이 올린 01 회수, 커밋 뒤 제공자 종료.
     * 이미 만료면 그대로(제공자 종료가 남아 있으면 다시 요청).
     */
    public AdminSubscriptionDetail end(String subscriptionSysId) {
        Boolean found = transaction.execute(status -> {
            Instant now = clock.instant();
            Subscription row = subscriptions.lockById(subscriptionSysId);
            if (row == null) return false;
            if (row.getStatus() != SubscriptionStatus.EXPIRED) {
                lifecycle.expireLocked(row, now);
                lifecycle.revokeLocked(row.getSysId(), now);
            }
            return true;
        });
        if (!Boolean.TRUE.equals(found)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "구독을 찾을 수 없습니다.");
        lifecycle.endProvider(subscriptionSysId);
        return detail(subscriptionSysId);
    }

    private static boolean problem(SubscriptionInvoice i) {
        String result = i.getApplyResult();
        return "MISMATCH".equals(result) || "OWNER_MISSING".equals(result)
                || (("STALE".equals(result) || "AFTER_CANCEL".equals(result)) && !"REFUNDED".equals(i.getStatus()));
    }

    private static AdminInvoice invoice(SubscriptionInvoice i) {
        int refundable = REFUNDABLE.contains(i.getStatus()) ? i.getAmount() - i.getRefundedAmount() : 0;
        return new AdminInvoice(i.getSysId(), i.getProviderInvoiceId(), i.getStatus(), i.getAmount(), i.getRefundedAmount(),
                i.getAttemptCount(), i.getPeriodStartAt(), i.getPeriodEndAt(), i.getPaidAt(), i.getApplyResult(),
                problem(i), refundable);
    }

    private static AdminEvent event(BillingWebhookEvent e) {
        return new AdminEvent(e.getWebhookId(), e.getEventType(), e.getResourceId(), e.getOccurredAt(),
                e.getReceivedAt(), e.getResult());
    }

    public RefundAccepted refund(String subscriptionSysId, String invoiceSysId, Integer amount) {
        Subscription row = subscriptions.findById(subscriptionSysId);
        SubscriptionInvoice invoice = invoiceSysId == null ? null : invoices.findById(invoiceSysId);
        if (row == null || invoice == null || !row.getSysId().equals(invoice.getSubscriptionSysId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "구독 또는 인보이스를 찾을 수 없습니다.");
        }
        if (!REFUNDABLE.contains(invoice.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "결제 완료된 인보이스만 환불할 수 있습니다.");
        }
        int remaining = invoice.getAmount() - invoice.getRefundedAmount();
        if (amount == null || amount <= 0 || amount > remaining) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "환불 금액은 1원 이상 " + remaining + "원 이하입니다.");
        }
        BillingProvider provider = providers.find(row.getProvider()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "결제 제공자가 설정되지 않았습니다."));
        try {
            provider.refund(invoice.getProviderInvoiceId(), amount, "admin");
        } catch (ProviderUnavailableException unavailable) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "결제사 환불 요청에 실패했습니다.");
        } catch (IllegalArgumentException | IllegalStateException rejected) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, rejected.getMessage());
        }
        return new RefundAccepted(invoice.getSysId(), amount, "환불을 요청했습니다. 결제사 알림으로 반영됩니다.");
    }
}
