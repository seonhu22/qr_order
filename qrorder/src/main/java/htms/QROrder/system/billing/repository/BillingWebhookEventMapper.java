package htms.QROrder.system.billing.repository;

import htms.QROrder.system.billing.domain.BillingWebhookEvent;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/** sys_billing_webhook_event 접근. INSERT는 구독/인보이스 변경과 같은 트랜잭션에서만 한다. */
@Mapper
public interface BillingWebhookEventMapper {
    String findResult(@Param("provider") String provider,
                      @Param("providerStoreId") String providerStoreId,
                      @Param("webhookId") String webhookId);

    int insertEvent(BillingWebhookEvent event);

    /** 구독 상세: 이 구독/인보이스 제공자 ID를 가리킨 이벤트, 최근 순. */
    List<BillingWebhookEvent> findByResources(@Param("resourceIds") List<String> resourceIds);

    /** 연결 불일치 이벤트(어느 구독 것인지 믿을 수 없어 따로 본다), 최근 순. */
    List<BillingWebhookEvent> findMismatches(@Param("limit") int limit);
}
