package htms.QROrder.system.billing.fake;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.config.LocalOnlyGuard;
import htms.QROrder.system.billing.fake.FakeBillingProvider.CardScenario;
import htms.QROrder.system.billing.fake.FakeBillingProvider.ForgeMode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.context.annotation.Conditional;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;

import static org.springframework.web.util.HtmlUtils.htmlEscape;

/**
 * 가짜 결제창과 콘솔(정책 §6). 백엔드 HTML, 스크립트 없음(CSP script-src 'self').
 * 가짜 PG가 켜졌을 때만 등록되고, 루프백 요청만 받는다. 결제창은 로그인한 대표 본인만 연다.
 */
@Controller
@Hidden
@Conditional(FakeBillingCondition.class)
@RequestMapping("/fake-pg")
public class FakePgController {
    private final FakeBillingProvider provider;
    private final String returnUrl;

    public FakePgController(FakeBillingProvider provider,
                            @Value("${billing.fake.return-url:http://localhost:3000/client/subscription/result}")
                            String returnUrl) {
        this.provider = provider;
        this.returnUrl = returnUrl;
    }

    /** 이 컨트롤러의 모든 핸들러(아래 catch-all 포함) 앞에서 실행된다. 프록시 헤더는 믿지 않고 소켓 주소만 본다. */
    @ModelAttribute
    void loopbackOnly(HttpServletRequest request) {
        if (!LocalOnlyGuard.isLoopbackHost(request.getRemoteAddr())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "가짜 PG는 이 PC에서만 열 수 있습니다.");
        }
    }

    @GetMapping("/checkout")
    public ResponseEntity<String> checkout(@RequestParam(required = false) String token, HttpSession session) {
        String actor = actorSysId(session);
        if (actor == null) return page(HttpStatus.UNAUTHORIZED, "로그인 필요", "<p>대표 계정으로 로그인한 뒤 다시 여세요.</p>");
        var found = provider.peekToken(token, actor);
        if (found == null) {
            return page(HttpStatus.FORBIDDEN, "결제창을 열 수 없음", "<p>만료되었거나 이미 사용했거나 본인 결제가 아닙니다.</p>");
        }
        var sub = provider.snapshot().subscriptions.get(found.subscriptionId);
        StringBuilder body = new StringBuilder()
                .append("<p>상품 ").append(htmlEscape(sub.productId)).append(" / ")
                .append(sub.amount).append(' ').append(htmlEscape(sub.currency)).append(" / ")
                .append(sub.periodMonth).append("개월 자동 결제</p>")
                .append("<p>만료 ").append(found.expiresAt).append("</p>");
        for (CardScenario scenario : CardScenario.values()) {
            body.append("<form method=\"post\" action=\"/fake-pg/checkout\">")
                    .append(hidden("token", token)).append(hidden("scenario", scenario.name()))
                    .append("<button type=\"submit\">").append(label(scenario)).append("</button></form>");
        }
        return page(HttpStatus.OK, "가짜 결제창", body.toString());
    }

    @PostMapping("/checkout")
    public ResponseEntity<String> pay(@RequestParam String token, @RequestParam CardScenario scenario,
                                      HttpSession session) {
        String actor = actorSysId(session);
        if (actor == null) return page(HttpStatus.UNAUTHORIZED, "로그인 필요", "<p>대표 계정으로 로그인한 뒤 다시 여세요.</p>");
        FakeBillingProvider.PayResult result;
        try {
            result = provider.pay(token, actor, scenario);
        } catch (IllegalStateException rejected) {
            return page(HttpStatus.FORBIDDEN, "결제할 수 없음", "<p>" + htmlEscape(rejected.getMessage()) + "</p>");
        }
        String outcome = result.paid() ? "결제 완료" : "결제 실패(" + htmlEscape(result.failureCode()) + ")";
        return page(HttpStatus.OK, outcome, "<p>인보이스 " + htmlEscape(result.invoiceId()) + "</p>"
                + "<p><a href=\"" + htmlEscape(returnUrl) + "\">결과 화면으로 돌아가기</a></p>");
    }

    @GetMapping("/console")
    public ResponseEntity<String> console() {
        var state = provider.snapshot();
        StringBuilder body = new StringBuilder();
        body.append("<p>웹훅 ").append(state.webhooksEnabled ? "켜짐" : "꺼짐(유실 재현)")
                .append(" / 남은 조회 실패 ").append(state.lookupFailuresRemaining).append("</p>")
                .append(form("webhooks", hidden("enabled", String.valueOf(!state.webhooksEnabled)),
                        state.webhooksEnabled ? "웹훅 끄기" : "웹훅 켜기"))
                .append(form("lookup-failures", "<input name=\"count\" value=\"1\" size=\"3\">", "다음 조회 실패"));
        body.append("<h2>구독</h2><table><tr><th>ID</th><th>매장</th><th>상태</th><th>결제수단</th><th>동작</th></tr>");
        state.subscriptions.values().forEach(sub -> body.append("<tr><td>").append(htmlEscape(sub.subscriptionId))
                .append("</td><td>").append(htmlEscape(sub.plantCd)).append("</td><td>").append(htmlEscape(sub.status))
                .append("</td><td>").append(htmlEscape(sub.paymentMethodStatus)).append("</td><td>")
                .append(form("next-period", hidden("subscriptionId", sub.subscriptionId) + hidden("success", "true"), "다음 회차 성공"))
                .append(form("next-period", hidden("subscriptionId", sub.subscriptionId) + hidden("success", "false"), "다음 회차 실패"))
                .append(form("expire-card", hidden("subscriptionId", sub.subscriptionId), "카드 만료"))
                .append("</td></tr>"));
        body.append("</table><h2>인보이스</h2><table><tr><th>ID</th><th>구독</th><th>상태</th><th>금액/환불</th><th>기간 끝</th><th>동작</th></tr>");
        state.invoices.values().forEach(inv -> body.append("<tr><td>").append(htmlEscape(inv.invoiceId))
                .append("</td><td>").append(htmlEscape(inv.subscriptionId)).append("</td><td>").append(htmlEscape(inv.status))
                .append("</td><td>").append(inv.amount).append(" / ").append(inv.refundedAmount)
                .append("</td><td>").append(inv.periodEndAt).append("</td><td>")
                .append(form("retry", hidden("invoiceId", inv.invoiceId) + hidden("success", "true"), "재시도 성공"))
                .append(form("retry", hidden("invoiceId", inv.invoiceId) + hidden("success", "false"), "재시도 실패"))
                .append(form("refund", hidden("invoiceId", inv.invoiceId)
                        + "<input name=\"amount\" value=\"" + (inv.amount - inv.refundedAmount) + "\" size=\"7\">", "환불"))
                .append("</td></tr>"));
        body.append("</table><h2>웹훅</h2><table><tr><th>webhook-id</th><th>type</th><th>마지막 상태</th><th>전송 수</th><th>동작</th></tr>");
        state.deliveries.forEach(d -> body.append("<tr><td>").append(htmlEscape(d.webhookId)).append("</td><td>")
                .append(htmlEscape(d.type)).append("</td><td>").append(d.lastStatus).append("</td><td>").append(d.sendCount)
                .append("</td><td>")
                .append(form("resend", hidden("webhookId", d.webhookId), "재전송"))
                .append(form("forge", hidden("webhookId", d.webhookId) + hidden("mode", ForgeMode.BAD_SIGNATURE.name()), "위조: 서명 틀림"))
                .append(form("forge", hidden("webhookId", d.webhookId) + hidden("mode", ForgeMode.STALE_TIMESTAMP.name()), "위조: 5분 초과"))
                .append("</td></tr>"));
        body.append("</table><p>asOf 배치 실행은 만료 배치(정책 §11 행 11)와 함께 추가한다.</p>");
        return page(HttpStatus.OK, "가짜 PG 콘솔", body.toString());
    }

    @PostMapping("/console/{action}")
    public ResponseEntity<String> act(@PathVariable String action,
                                      @RequestParam(required = false) String subscriptionId,
                                      @RequestParam(required = false) String invoiceId,
                                      @RequestParam(required = false) String webhookId,
                                      @RequestParam(required = false) Boolean success,
                                      @RequestParam(required = false) Boolean enabled,
                                      @RequestParam(required = false) Integer amount,
                                      @RequestParam(required = false) Integer count,
                                      @RequestParam(required = false) ForgeMode mode) {
        try {
            switch (action) {
                case "next-period" -> provider.chargeNextPeriod(subscriptionId, Boolean.TRUE.equals(success));
                case "retry" -> provider.retryInvoice(invoiceId, Boolean.TRUE.equals(success));
                case "refund" -> provider.refund(invoiceId, amount == null ? 0 : amount, "console");
                case "expire-card" -> provider.expireCard(subscriptionId);
                case "resend" -> provider.resend(webhookId);
                case "forge" -> provider.forge(webhookId, mode == null ? ForgeMode.BAD_SIGNATURE : mode);
                case "webhooks" -> provider.setWebhooksEnabled(Boolean.TRUE.equals(enabled));
                case "lookup-failures" -> provider.failNextLookups(count == null ? 1 : count);
                default -> throw new ResponseStatusException(HttpStatus.NOT_FOUND);
            }
        } catch (IllegalArgumentException | IllegalStateException rejected) {
            return page(HttpStatus.BAD_REQUEST, "처리할 수 없음", "<p>" + htmlEscape(rejected.getMessage())
                    + "</p><p><a href=\"/fake-pg/console\">콘솔로</a></p>");
        }
        return ResponseEntity.status(HttpStatus.SEE_OTHER).location(URI.create("/fake-pg/console")).build();
    }

    /**
     * 등록되지 않은 /fake-pg 경로. 더 구체적인 매핑이 먼저 고른다. 이게 없으면 SPA 폴백(WebMvcConfig)이 index.html을 준다.
     * 같은 컨트롤러라 루프백 가드가 먼저 돈다: 비루프백 403, 루프백 404.
     */
    @RequestMapping({"", "/", "/**"})
    public ResponseEntity<Void> unknown() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    private static String actorSysId(HttpSession session) {
        Object value = session == null ? null : session.getAttribute("loginUser");
        return value instanceof Login login ? login.getSysId() : null;
    }

    private static String label(CardScenario scenario) {
        return switch (scenario) {
            case SUCCESS -> "카드 결제 성공";
            case DECLINED -> "카드 거절";
            case INSUFFICIENT_FUNDS -> "잔액 부족";
        };
    }

    private static String form(String action, String fields, String label) {
        return "<form method=\"post\" action=\"/fake-pg/console/" + action + "\" style=\"display:inline\">"
                + fields + "<button type=\"submit\">" + htmlEscape(label) + "</button></form> ";
    }

    private static String hidden(String name, String value) {
        return "<input type=\"hidden\" name=\"" + name + "\" value=\"" + htmlEscape(value == null ? "" : value) + "\">";
    }

    private static ResponseEntity<String> page(HttpStatus status, String title, String body) {
        String html = "<!doctype html><html lang=\"ko\"><head><meta charset=\"utf-8\"><title>" + htmlEscape(title)
                + "</title><style>body{font-family:sans-serif;margin:24px}table{border-collapse:collapse}"
                + "td,th{border:1px solid #ccc;padding:4px 6px}.warn{color:#b00}</style></head><body>"
                + "<p class=\"warn\">LOCAL FAKE PG: 실제 결제가 아닙니다.</p><h1>" + htmlEscape(title) + "</h1>"
                + body + "</body></html>";
        return ResponseEntity.status(status).contentType(new MediaType("text", "html", java.nio.charset.StandardCharsets.UTF_8))
                .body(html);
    }
}
