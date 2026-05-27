package htms.QROrder.client.dto;

import lombok.Data;

@Data
public class StatusBodyItem {
    private String linkSysId;
    private String rowType;
    private String detailSysId;
    private String parentDetailSysId;
    private String itemName;
    private Integer qty;
}
