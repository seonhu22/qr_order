package htms.QROrder.client.dto;

import lombok.Data;

@Data
public class OrderRevisionCatalogOptionRow {
    private String menuSysId;
    private String optionGroupSysId;
    private String groupName;
    private String requiredYn;
    private String selectionType;
    private String menuOptionSysId;
    private String menuOptionName;
    private Integer menuOptionPrice;
    private String menuOptionDescription;
    private Integer maximumNum;
    private String defaultYn;
    private String soldOutYn;
}
