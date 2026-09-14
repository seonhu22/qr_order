package htms.QROrder.consumer.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ConsumerOrderListResponse {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private List<ConsumerOrderSummary> orders;
}
