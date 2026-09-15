package htms.QROrder.consumer.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class ConsumerOrderCreateOptionRequest {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, maxLength = 64)
    private String optionSysId;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, minimum = "1")
    private Integer quantity;
}
