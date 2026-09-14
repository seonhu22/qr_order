package htms.QROrder.consumer.menu.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class ConsumerMenuCategoryItem {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String categorySysId;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String categoryName;
}
