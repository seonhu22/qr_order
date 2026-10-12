package htms.QROrder.client.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderRevisionResponse {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String revisionId;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private List<String> removedDetailIds;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private List<String> cancelledOrderGroupIds;
    @Schema(nullable = true)
    private String createdOrderId;
    @Schema(nullable = true)
    private String createdOrderNo;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer addedTotalAmount;
}
