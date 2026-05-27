package htms.QROrder.client.dto;

import lombok.Data;

@Data
public class QRCodeItem {
    private String sysId;
    private String linkSysId;
    private Integer tableNum;
    private String description;
    private String url;
    private String useYn;
}
