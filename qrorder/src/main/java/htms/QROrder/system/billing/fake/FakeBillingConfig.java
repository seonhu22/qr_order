package htms.QROrder.system.billing.fake;

import htms.QROrder.config.LocalOnlyGuard;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Conditional;
import org.springframework.context.annotation.Configuration;

import java.nio.file.Path;
import java.time.Clock;

/**
 * 가짜 PG 켜기: {@code local} 프로필 + {@code billing.provider=fake}. 루프백 DB가 아니면(SSH 터널 포함) 기동 실패.
 * 상태 파일({@code billing.fake.state-file})은 저장소 밖 경로를 쓴다. 웹훅 시크릿은 로컬 전용 값이다.
 */
@Slf4j
@Configuration
@Conditional(FakeBillingCondition.class)
public class FakeBillingConfig {
    /** 로컬 가짜 전용 고정 시크릿. 진짜 PG 시크릿은 저장소에 두지 않는다. */
    static final String LOCAL_WEBHOOK_SECRET = "whsec_bG9jYWwtZmFrZS1wZy13ZWJob29rLXNlY3JldC0zMmI=";

    @Bean
    public FakeBillingProvider fakeBillingProvider(
            @Value("${spring.datasource.url:}") String jdbcUrl,
            @Value("${ssh.enabled:false}") boolean sshEnabled,
            @Value("${billing.fake.state-file:${java.io.tmpdir}/qrorder-fake-pg-state.json}") String stateFile,
            @Value("${billing.fake.store-id:store-fake-local}") String storeId,
            @Value("${billing.fake.webhook-secret:" + LOCAL_WEBHOOK_SECRET + "}") String webhookSecret,
            @Value("${billing.fake.base-url:http://localhost:${server.port:8080}}") String baseUrl,
            @Value("${billing.fake.webhook-url:http://127.0.0.1:${server.port:8080}/api/billing/webhook/fake}")
            String webhookUrl) {
        LocalOnlyGuard.requireLoopbackDatabase(jdbcUrl, sshEnabled, "가짜 PG");
        log.warn("LOCAL ONLY: 가짜 PG 켜짐. state={}, webhook={}", stateFile, webhookUrl);
        return new FakeBillingProvider(Path.of(stateFile), storeId, webhookSecret, baseUrl, Clock.systemUTC(),
                FakeWebhookSender.http(webhookUrl));
    }
}
