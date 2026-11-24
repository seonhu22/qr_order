package htms.QROrder.system.billing.provider;

import htms.QROrder.system.billing.provider.BillingModels.BillingNotice;
import htms.QROrder.system.billing.provider.BillingModels.CheckoutLaunch;
import htms.QROrder.system.billing.provider.BillingModels.CheckoutRequest;
import htms.QROrder.system.billing.provider.BillingModels.ProviderInvoice;
import htms.QROrder.system.billing.provider.BillingModels.ProviderSubscription;

import java.util.Map;

/**
 * 결제 제공자 어댑터(정책 4C §6). 도메인은 이 인터페이스와 내부 모델만 안다.
 * 진짜 PG는 어댑터 1개 + 설정이다. 모든 메서드는 HTTP 호출일 수 있으므로 DB 잠금 밖에서 부른다.
 * 조회/요청 실패는 {@link ProviderUnavailableException}(웹훅 처리에서는 503).
 */
public interface BillingProvider {
    /** URL 경로와 DB provider 열에 쓰는 이름. 예: fake, portone. */
    String name();

    /** 이 제공자 상점 ID. 모든 제공자 ID는 (provider, storeId)와 함께 유일하다. */
    String storeId();

    /** 고객/구독 사전 등록(INCOMPLETE) 후 결제수단 등록 창을 연다. 같은 attemptId면 같은 등록을 돌려준다. */
    CheckoutLaunch startCheckout(CheckoutRequest request);

    ProviderSubscription getSubscription(String providerSubscriptionId);

    ProviderInvoice getInvoice(String providerInvoiceId);

    /** 제공자 구독 종료. 이미 끝났으면 그대로 성공. */
    void endSubscription(String providerSubscriptionId);

    /** 인보이스 부분/전액 환불 요청. 결과는 웹훅 + 재조회로 반영한다. */
    void refund(String providerInvoiceId, int amount, String reason);

    /** 서명 검증 뒤 본문의 ID만 꺼낸다. 실패하면 WebhookVerificationException. */
    BillingNotice verifyAndParseWebhook(Map<String, String> headers, byte[] body);
}
