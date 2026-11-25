package htms.QROrder.system.billing.domain;

import lombok.Data;

import java.time.Instant;

/** sys_billing_webhook_event 행. 상태 변경과 같은 트랜잭션에서만 INSERT한다. */
@Data
public class BillingWebhookEvent {
    private String sysId;
    private String provider;
    private String providerStoreId;
    private String webhookId;
    private String eventType;
    private String resourceId;
    private Instant occurredAt;
    private Instant receivedAt;
    private Instant processedAt;
    private String result;
}
