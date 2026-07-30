package htms.QROrder.client.dto;

import lombok.Data;

@Data
public class MenuOptionDetailItem {
    private String sysId;
    private String linkSysId;
    private String menuOptionName;
    private Integer menuOptionPrice;
    private String menuDescription;
    private Integer maximumNum;
    private String useYn;
    private String fileUlid;
    private Integer ordNo;
}
