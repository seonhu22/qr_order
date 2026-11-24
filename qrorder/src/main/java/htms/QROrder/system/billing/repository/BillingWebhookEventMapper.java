package htms.QROrder.system.billing.repository;

import htms.QROrder.system.billing.domain.BillingWebhookEvent;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/** sys_billing_webhook_event 접근. INSERT는 구독/인보이스 변경과 같은 트랜잭션에서만 한다. */
@Mapper
public interface BillingWebhookEventMapper {
    String findResult(@Param("provider") String provider,
                      @Param("providerStoreId") String providerStoreId,
                      @Param("webhookId") String webhookId);

    int insertEvent(BillingWebhookEvent event);
}
