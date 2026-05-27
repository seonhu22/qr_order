package htms.QROrder.client.dto;

import lombok.Data;

@Data
public class TableInfoItem {
    private String sysId;
    private Integer tableNum;
    private Integer tableQty;
    private String useYn;
}
