package htms.QROrder.system.billing.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Client 구독 화면 계약(정책 4C §10). 시각은 ISO-8601 UTC. */
public final class ClientSubscriptionDtos {
    private ClientSubscriptionDtos() {}

    @Schema(description = "판매 중 플랜(sys_payment)")
    public record PlanItem(String planSysId, String planName, int amount, String currency, int periodMonth) {}

    @Schema(description = "자기 매장 구독. hasSubscription=false면 레거시/관리자 매장(구독 없음)")
    public record SubscriptionView(
            boolean hasSubscription,
            @Schema(description = "PENDING / ACTIVE / PAST_DUE / CANCEL_SCHEDULED / EXPIRED") String status,
            @Schema(description = "로그인 사용자가 구독 대표인지. 대표만 결제/해지/이력") boolean owner,
            String planSysId,
            String planName,
            Integer amount,
            String currency,
            Integer periodMonth,
            Instant paidThroughAt,
            Instant graceUntil,
            Instant endAt,
            @Schema(description = "NONE / ACTIVE / EXPIRED") String paymentMethodStatus,
            @Schema(description = "이 구독 결제가 대표를 01로 올렸는지") boolean roleGranted,
            String lastFailureCode,
            @Schema(description = "결제 시작 가능(대표 + 제공자 켜짐 + 상태 허용)") boolean canCheckout,
            @Schema(description = "해지 예약 가능(대표 + 진행 중)") boolean canCancel,
            List<PlanItem> plans) {}

    public record CheckoutBody(@Schema(requiredMode = Schema.RequiredMode.REQUIRED) String planSysId) {}

    @Schema(description = "공통 결제 시작 계약. 가짜 launch.redirectUrl, 포트원 launch = SDK 인자")
    public record CheckoutLaunchView(String provider, Map<String, String> launch, Instant expiresAt) {}

    public record InvoiceItem(String invoiceSysId,
                              @Schema(description = "PENDING / PAID / FAILED / PARTIALLY_REFUNDED / REFUNDED") String status,
                              int amount, int refundedAmount, String currency, int attemptCount,
                              Instant periodStartAt, Instant periodEndAt, Instant paidAt) {}
}
