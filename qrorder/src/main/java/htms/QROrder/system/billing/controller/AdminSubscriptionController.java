package htms.QROrder.system.billing.controller;

import htms.QROrder.system.billing.dto.AdminSubscriptionDtos.RefundAccepted;
import htms.QROrder.system.billing.dto.AdminSubscriptionDtos.RefundBody;
import htms.QROrder.system.billing.service.AdminSubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Admin 구독 관리(정책 4C §10). /api/system/** 라 SUPER_ADMIN만(RoleCheckInterceptor). */
@Tag(name = "admin-subscription")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/system/subscriptions")
public class AdminSubscriptionController {
    private final AdminSubscriptionService service;

    @Operation(summary = "인보이스 환불 요청", description = "제공자 환불 → 환불 웹훅으로 반영. 현재 회차 누적 전액이면 만료 + 권한 회수")
    @PostMapping("/{sysId}/refund")
    public RefundAccepted refund(@PathVariable String sysId, @RequestBody RefundBody body) {
        return service.refund(sysId, body == null ? null : body.invoiceSysId(), body == null ? null : body.amount());
    }
}
