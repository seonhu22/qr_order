package htms.QROrder.client.dto;

import lombok.Data;

@Data
public class MenuOptionGroupItem {
    private String sysId;
    private String linkSysId;
    private String groupName;
    private String requiredYn;
    private String inputType;
    private Integer ordNo;
    private String useYn;
}
