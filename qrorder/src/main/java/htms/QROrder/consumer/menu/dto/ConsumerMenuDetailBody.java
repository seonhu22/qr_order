package htms.QROrder.consumer.menu.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ConsumerMenuDetailBody {
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
    private List<ConsumerMenuOptionGroup> optionGroupList;

    public static ConsumerMenuDetailBody from(
            ConsumerMenuItem menu,
            List<ConsumerMenuOptionGroup> optionGroupList) {
        return new ConsumerMenuDetailBody(
                menu.getMenuSysId(),
                menu.getCategorySysId(),
                menu.getCategoryName(),
                menu.getMenuName(),
                menu.getMenuPrice(),
                menu.getMenuDescription(),
                menu.getFileSysId(),
                menu.getMenuTag(),
                menu.getOptionUseYn(),
                menu.getSoldOutYn(),
                optionGroupList
        );
    }
}
