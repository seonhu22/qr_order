package htms.QROrder.auth.dto;

import lombok.Data;

@Data
public class EmailValidRequest {
    private String sysId;
    private String linkSysId;
    private String encodeSysId;
}
