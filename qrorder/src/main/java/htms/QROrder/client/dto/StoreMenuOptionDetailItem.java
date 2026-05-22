package htms.QROrder.client.dto;

import lombok.Data;

@Data
public class StoreMenuOptionDetailItem {
    private String sysId;
    private String linkSysId;
    private String menuOptionName;
    private String menuOptionPrice;
    private String menuDescription;
    private String useYn;
}
