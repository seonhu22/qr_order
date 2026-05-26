package htms.QROrder.client.dto;

import lombok.Data;

@Data
public class ClientUserItem {
    private String sysId;
    private String userId;
    private String userNm;
    private String userRole;
    private String plantCd;
    private String plantNm;
}
