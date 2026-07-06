package htms.QROrder.client.dto;

import lombok.Data;

@Data
public class TableGuiItem {
    private String sysId;
    private String tableName;
    private Integer tableNum;
    private Integer tableQty;
    private Integer xCoordinate;
    private Integer yCoordinate;
    private Integer height;
    private Integer width;
    private String tableType;
    private String objectType;
}
