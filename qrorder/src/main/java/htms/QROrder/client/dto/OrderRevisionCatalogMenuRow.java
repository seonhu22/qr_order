package htms.QROrder.client.dto;

import lombok.Data;

@Data
public class OrderRevisionCatalogMenuRow {
    private String categorySysId;
    private String categoryName;
    private String menuSysId;
    private String menuName;
    private Integer menuPrice;
    private String menuDescription;
    private String optionUseYn;
    private String soldOutYn;
}
