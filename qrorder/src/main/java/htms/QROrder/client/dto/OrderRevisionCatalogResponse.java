package htms.QROrder.client.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class OrderRevisionCatalogResponse {

    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    private List<Category> categories;

    @Data
    @AllArgsConstructor
    @Schema(name = "OrderRevisionCatalogCategory")
    public static class Category {
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        private String categorySysId;
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        private String categoryName;
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        private List<Menu> menus;
    }

    @Data
    @AllArgsConstructor
    @Schema(name = "OrderRevisionCatalogMenu")
    public static class Menu {
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        private String menuSysId;
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        private String menuName;
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        private Integer menuPrice;
        @Schema(nullable = true)
        private String menuDescription;
        @Schema(allowableValues = {"Y", "N"}, requiredMode = Schema.RequiredMode.REQUIRED)
        private String optionUseYn;
        @Schema(allowableValues = {"Y", "N"}, requiredMode = Schema.RequiredMode.REQUIRED)
        private String soldOutYn;
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        private List<OptionGroup> optionGroups;
    }

    @Data
    @AllArgsConstructor
    @Schema(name = "OrderRevisionCatalogOptionGroup")
    public static class OptionGroup {
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        private String optionGroupSysId;
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        private String groupName;
        @Schema(allowableValues = {"Y", "N"}, requiredMode = Schema.RequiredMode.REQUIRED)
        private String requiredYn;
        @Schema(
                description = "01: 단일 선택, 02: 복수 선택, 03: 수량 선택",
                allowableValues = {"01", "02", "03"},
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        private String selectionType;
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        private List<Option> options;
    }

    @Data
    @AllArgsConstructor
    @Schema(name = "OrderRevisionCatalogOption")
    public static class Option {
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        private String menuOptionSysId;
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        private String menuOptionName;
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
        private Integer menuOptionPrice;
        @Schema(nullable = true)
        private String menuOptionDescription;
        @Schema(description = "수량 선택(03)은 1 이상의 최대 수량, 01/02는 0",
                requiredMode = Schema.RequiredMode.REQUIRED)
        private Integer maximumNum;
        @Schema(allowableValues = {"Y", "N"}, requiredMode = Schema.RequiredMode.REQUIRED)
        private String defaultYn;
        @Schema(allowableValues = {"Y", "N"}, requiredMode = Schema.RequiredMode.REQUIRED)
        private String soldOutYn;
    }
}
