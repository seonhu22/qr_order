package htms.QROrder.consumer.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
public class ConsumerOrderCreateItemRequest {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, maxLength = 64)
    private String menuSysId;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, minimum = "1", maximum = "99")
    private Integer quantity;
    @Schema(nullable = true, description = "옵션이 없으면 생략하거나 빈 배열 사용")
    private List<ConsumerOrderCreateOptionRequest> options;
}
