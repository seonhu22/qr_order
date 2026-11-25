package htms.QROrder.system.billing.fake;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

/** 가짜 PG가 우리 웹훅 엔드포인트로 보내는 HTTP. 테스트는 람다로 바꾼다. */
@FunctionalInterface
public interface FakeWebhookSender {
    /** 응답 상태 코드. 연결 실패는 -1. */
    int send(Map<String, String> headers, String body);

    static FakeWebhookSender http(String url) {
        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
        return (headers, body) -> {
            var request = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body));
            headers.forEach(request::header);
            try {
                return client.send(request.build(), HttpResponse.BodyHandlers.discarding()).statusCode();
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                return -1;
            } catch (Exception unreachable) {
                return -1;
            }
        };
    }
}
