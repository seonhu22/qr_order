package htms.QROrder.system.billing.controller;

import htms.QROrder.system.billing.provider.BillingProvider;
import htms.QROrder.system.billing.service.BillingWebhookService;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 제공자 웹훅 수신. 로그인 대신 서명으로 인증한다(WebConfig에서 이 경로만 로그인 제외).
 * 200 = 처리 완료 또는 이미 처리, 401 = 서명 실패, 404 = 켜지지 않은 제공자, 503 = 제공자 조회 실패(재전송 대기).
 * 프론트가 부르지 않는 API라 OpenAPI 생성물에서 뺀다.
 */
@Hidden
@RestController
public class BillingWebhookController {
    private final ObjectProvider<BillingProvider> providers;
    private final BillingWebhookService webhooks;

    public BillingWebhookController(ObjectProvider<BillingProvider> providers, BillingWebhookService webhooks) {
        this.providers = providers;
        this.webhooks = webhooks;
    }

    @PostMapping("/api/billing/webhook/{provider}")
    public ResponseEntity<Void> receive(@PathVariable("provider") String providerName,
                                        @RequestHeader HttpHeaders headers,
                                        @RequestBody(required = false) byte[] body) {
        BillingProvider provider = providers.stream().filter(p -> p.name().equals(providerName)).findFirst().orElse(null);
        if (provider == null) return ResponseEntity.notFound().build();
        Map<String, String> flat = new LinkedHashMap<>();
        headers.forEach((name, values) -> { if (!values.isEmpty()) flat.put(name, values.get(0)); });
        var outcome = webhooks.handle(provider, flat, body == null ? new byte[0] : body);
        return ResponseEntity.status(switch (outcome) {
            case OK -> HttpStatus.OK;
            case UNAUTHORIZED -> HttpStatus.UNAUTHORIZED;
            case UNAVAILABLE -> HttpStatus.SERVICE_UNAVAILABLE;
        }).build();
    }
}
