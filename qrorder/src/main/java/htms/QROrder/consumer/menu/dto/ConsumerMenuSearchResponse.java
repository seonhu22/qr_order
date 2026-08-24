package htms.QROrder.consumer.menu.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ConsumerMenuSearchResponse {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private ConsumerMenuMainBody body;
}
