package htms.QROrder.system.domain;

import lombok.Data;

@Data
public class Message {
    private String sysId;
    private String msgCd;
    private String msgNm;
    private String msgDescription;
}
