package htms.QROrder.consumer.session.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class ConsumerSessionEnvelope {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private boolean success;
    @Schema(nullable = true)
    private String message;
    @Schema(nullable = true)
    private String error;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private ConsumerSessionResponse data;
}
