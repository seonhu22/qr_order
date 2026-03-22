package htms.QROrder.system.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AuditTrail {
    private String auditFlag;
    private String menuCd;
    private String menuNm;
    private String auditTrailContents;
    private LocalDateTime insertDatetime;
}
