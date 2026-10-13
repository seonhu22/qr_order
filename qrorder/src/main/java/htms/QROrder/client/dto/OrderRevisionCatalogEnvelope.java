package htms.QROrder.client.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class OrderRevisionCatalogEnvelope {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private boolean success;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String message;
    @Schema(nullable = true)
    private String error;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private OrderRevisionCatalogResponse data;
}
