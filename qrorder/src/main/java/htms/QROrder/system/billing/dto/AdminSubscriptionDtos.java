package htms.QROrder.system.billing.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

/** Admin 구독 관리 계약(정책 4C §10). SUPER_ADMIN만(RoleCheckInterceptor). */
public final class AdminSubscriptionDtos {
    private AdminSubscriptionDtos() {}

    public record RefundBody(@Schema(requiredMode = Schema.RequiredMode.REQUIRED) String invoiceSysId,
                             @Schema(description = "원, 1 이상 남은 결제 금액 이하", requiredMode = Schema.RequiredMode.REQUIRED)
                             Integer amount) {}

    @Schema(description = "제공자 환불 요청 결과. 권한/상태 반영은 환불 웹훅 + 재조회로 한다")
    public record RefundAccepted(String invoiceSysId, int requestedAmount, String message) {}

    public record AdminInvoice(String invoiceSysId, String providerInvoiceId,
                               @Schema(description = "PENDING / PAID / FAILED / PARTIALLY_REFUNDED / REFUNDED") String status,
                               int amount, int refundedAmount, int attemptCount,
                               Instant periodStartAt, Instant periodEndAt, Instant paidAt,
                               @Schema(description = "APPLIED / MISMATCH / STALE / AFTER_CANCEL / OWNER_MISSING") String applyResult,
                               @Schema(description = "미해결 문제 건") boolean problem,
                               @Schema(description = "환불 가능 금액(원)") int refundable) {}

    public record AdminEvent(String webhookId, String eventType, String resourceId, Instant occurredAt,
                             Instant receivedAt,
                             @Schema(description = "PROCESSED / IGNORED / MISMATCH") String result) {}

    public record AdminSubscriptionList(List<AdminSubscriptionRow> rows,
                                        @Schema(description = "연결 불일치 웹훅(구독에 붙이지 않음), 최근 50건")
                                        List<AdminEvent> mismatchEvents) {}

    public record AdminSubscriptionDetail(AdminSubscriptionRow subscription, String providerSubscriptionId,
                                          List<AdminInvoice> invoices, List<AdminEvent> events,
                                          @Schema(description = "즉시 종료 가능(만료 전)") boolean canEnd) {}
}
