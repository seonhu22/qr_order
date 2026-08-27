package htms.QROrder.consumer.order.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ConsumerOrderCreateResponse {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String orderId;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String orderNo;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, allowableValues = "RECEIVED")
    private String status;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer totalAmount;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, type = "string", example = "2026-08-27 10:30:00")
    private LocalDateTime orderedAt;
}
