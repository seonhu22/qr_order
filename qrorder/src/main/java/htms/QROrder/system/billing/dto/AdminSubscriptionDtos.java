package htms.QROrder.system.billing.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/** Admin 구독 관리 계약(정책 4C §10). SUPER_ADMIN만(RoleCheckInterceptor). */
public final class AdminSubscriptionDtos {
    private AdminSubscriptionDtos() {}

    public record RefundBody(@Schema(requiredMode = Schema.RequiredMode.REQUIRED) String invoiceSysId,
                             @Schema(description = "원, 1 이상 남은 결제 금액 이하", requiredMode = Schema.RequiredMode.REQUIRED)
                             Integer amount) {}

    @Schema(description = "제공자 환불 요청 결과. 권한/상태 반영은 환불 웹훅 + 재조회로 한다")
    public record RefundAccepted(String invoiceSysId, int requestedAmount, String message) {}
}
