package htms.QROrder.consumer.menu.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class ConsumerMenuItem {
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String menuSysId;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String categorySysId;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String categoryName;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private String menuName;
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer menuPrice;
    @Schema(nullable = true)
    private String menuDescription;
    @Schema(nullable = true)
    private String fileSysId;
    @Schema(nullable = true)
    private String menuTag;
    @Schema(allowableValues = {"Y", "N"}, requiredMode = Schema.RequiredMode.REQUIRED)
    private String optionUseYn;
    @Schema(allowableValues = {"Y", "N"}, requiredMode = Schema.RequiredMode.REQUIRED)
    private String soldOutYn;
}
