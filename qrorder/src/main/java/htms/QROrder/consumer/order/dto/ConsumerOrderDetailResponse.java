package htms.QROrder.consumer.order.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
public class ConsumerOrderDetailResponse {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String orderId;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String orderNo;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String status;
    @Schema(nullable = true, description = "MVP 스키마에는 저장 컬럼이 없어 null")
    private String requestNote;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer totalAmount;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, type = "string")
    private LocalDateTime orderedAt;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, type = "string")
    private LocalDateTime updatedAt;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private List<ConsumerOrderDetailItem> items;
}
