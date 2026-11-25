package htms.QROrder.system.billing.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;

/** local 프로필 1분 주기 만료 배치(정책 4C §8). 기간 이동 시연은 가짜 PG 콘솔의 asOf 실행을 쓴다. */
@Slf4j
@Component
@Profile("local")
public class SubscriptionBatchScheduler {
    private final SubscriptionBatchService batch;
    private final Clock clock = Clock.systemUTC();

    public SubscriptionBatchScheduler(SubscriptionBatchService batch) {
        this.batch = batch;
    }

    @Scheduled(fixedDelayString = "${billing.batch.delay-ms:60000}", initialDelayString = "${billing.batch.initial-delay-ms:60000}")
    public void tick() {
        try {
            batch.run(clock.instant());
        } catch (RuntimeException failure) {
            log.error("billing batch failed", failure);
        }
    }
}
