package htms.QROrder.consumer.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
public class ConsumerOrderCreateRequest {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, maxLength = 36)
    private String clientRequestId;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, minLength = 1)
    private List<ConsumerOrderCreateItemRequest> items;
    @Schema(nullable = true, description = "MVP에서는 null 또는 공백만 허용")
    private String requestNote;
}
