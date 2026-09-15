package htms.QROrder.audit.domain;

import lombok.Data;

@Data
public class ErrorInfo {
    private String sysId;
    private String errMsg;
    private String errDetailMsg;
    private String menuCd;
    private String filePath;
    private String functionNm;
    private String insertUserId;
    private String sysPlantCd;
}