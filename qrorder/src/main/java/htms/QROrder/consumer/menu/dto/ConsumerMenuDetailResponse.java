package htms.QROrder.consumer.menu.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ConsumerMenuDetailResponse {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private ConsumerMenuDetailBody body;
}
