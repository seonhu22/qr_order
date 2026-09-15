package htms.QROrder.consumer.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ConsumerOrderDetailItem {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String orderItemId;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String menuSysId;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String menuName;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer quantity;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer unitAmount;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer lineAmount;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private List<ConsumerOrderDetailOption> options;
}
