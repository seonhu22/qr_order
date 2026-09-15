package htms.QROrder.consumer.order.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ConsumerOrderSummary {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String orderId;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String orderNo;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String status;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer totalAmount;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer itemCount;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, type = "string")
    private LocalDateTime orderedAt;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, type = "string")
    private LocalDateTime updatedAt;
}
