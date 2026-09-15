package htms.QROrder.qr.dto;

import lombok.Data;

@Data
public class QrConnectResponse {
    private String sysId;
    private String tableName;
    private Integer tableNum;
    private Integer tableQty;
    private String sysPlantCd;
}