package htms.QROrder.consumer.menu.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class ConsumerMenuItem {
    private String menuSysId;
    private String categorySysId;
    private String categoryName;
    private String menuName;
    private Integer menuPrice;
    @Schema(nullable = true)
    private String menuDescription;
    @Schema(nullable = true)
    private String fileSysId;
    @Schema(nullable = true)
    private String menuTag;
    @Schema(allowableValues = {"Y", "N"})
    private String optionUseYn;
    @Schema(allowableValues = {"Y", "N"})
    private String soldOutYn;
}
