package htms.QROrder.system.billing.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.system.billing.dto.ClientSubscriptionDtos.CheckoutBody;
import htms.QROrder.system.billing.dto.ClientSubscriptionDtos.CheckoutLaunchView;
import htms.QROrder.system.billing.dto.ClientSubscriptionDtos.InvoiceItem;
import htms.QROrder.system.billing.dto.ClientSubscriptionDtos.SubscriptionView;
import htms.QROrder.system.billing.service.ClientSubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Client 구독(정책 4C §10). 로그인 필수(LoginCheckInterceptor), 매장은 세션에서만 정한다. */
@Tag(name = "client-subscription")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/client/subscription")
public class ClientSubscriptionController {
    private final ClientSubscriptionService service;

    @Operation(summary = "자기 매장 구독 상태 + 플랜")
    @GetMapping
    public SubscriptionView view(HttpSession session) {
        return service.view(actor(session));
    }

    @Operation(summary = "결제 시작(구독 대표 본인)", description = "응답 launch로 결제창을 연다. 가짜 PG = launch.redirectUrl")
    @PostMapping("/checkout")
    public CheckoutLaunchView checkout(@RequestBody CheckoutBody body, HttpSession session) {
        return service.checkout(actor(session), body == null ? null : body.planSysId());
    }

    @Operation(summary = "결제 결과 재확인(구독 대표 본인, 10초 1회)", description = "제공자 재조회 뒤 최신 구독 상태. 이후 /api/auth/me 재조회")
    @PostMapping("/reconcile")
    public SubscriptionView reconcile(HttpSession session) {
        return service.reconcile(actor(session));
    }

    @Operation(summary = "해지 예약(구독 대표 본인)", description = "유료기간 끝에 종료. 이미 예약/만료면 그대로 200")
    @PostMapping("/cancel")
    public SubscriptionView cancel(HttpSession session) {
        return service.cancel(actor(session));
    }

    @Operation(summary = "결제 이력(구독 대표 본인)")
    @GetMapping("/invoices")
    public List<InvoiceItem> invoices(HttpSession session) {
        return service.invoices(actor(session));
    }

    private static Login actor(HttpSession session) {
        Object value = session.getAttribute("loginUser");
        return value instanceof Login login ? login : null;
    }
}
