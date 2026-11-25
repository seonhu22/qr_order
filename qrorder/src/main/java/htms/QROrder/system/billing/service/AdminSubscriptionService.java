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

import java.util.Set;

/**
 * Admin 구독 관리(정책 4C §10). 환불은 제공자에 요청만 하고(잠금 밖), 상태/권한 반영은 환불 웹훅이 재조회 값으로 한다(§4).
 */
@Service
public class AdminSubscriptionService {
    private static final Set<String> REFUNDABLE = Set.of("PAID", "PARTIALLY_REFUNDED");

    private final SubscriptionMapper subscriptions;
    private final SubscriptionInvoiceMapper invoices;
    private final BillingProviderRegistry providers;

    public AdminSubscriptionService(SubscriptionMapper subscriptions, SubscriptionInvoiceMapper invoices,
                                    BillingProviderRegistry providers) {
        this.subscriptions = subscriptions;
        this.invoices = invoices;
        this.providers = providers;
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
