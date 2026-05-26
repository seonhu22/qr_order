package htms.QROrder.client.dto;

import lombok.Data;

@Data
public class MenuDetailItem {
    private String sysId;
    private String linkSysId;
    private String menuName;
    private Integer menuPrice;
    private String menuDescription;
    private String optionUseYn;
    private String linkSysId2;
    private String useYn;
    private String fileUlid;
}
