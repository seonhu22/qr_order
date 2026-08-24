package htms.QROrder.consumer.menu.dto;

import lombok.Data;

@Data
public class ConsumerMenuOptionRow {
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
}
