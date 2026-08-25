package htms.QROrder.consumer.menu.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class ConsumerMenuMainEnvelope {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private boolean success;
    @Schema(nullable = true)
    private String message;
    @Schema(nullable = true)
    private String error;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private ConsumerMenuMainResponse data;
}
