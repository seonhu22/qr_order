package htms.QROrder.consumer.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ConsumerOrderDetailOption {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String optionSysId;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String optionName;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer quantity;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer unitAmount;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer lineAmount;
}
