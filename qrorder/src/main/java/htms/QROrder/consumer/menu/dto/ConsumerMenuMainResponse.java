package htms.QROrder.consumer.menu.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ConsumerMenuMainResponse {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String storeName;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer tableNum;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private ConsumerMenuMainHeader header;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private ConsumerMenuMainBody body;
}
