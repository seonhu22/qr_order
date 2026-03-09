package htms.Initial.audit.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class Audit {
    private String auditSysId;
    private String auditFlag;
    private String refKey;
    private String menuCd;
    private String menuNm;
    private String tableCd;
    private String tableNm;
    private String auditTrailContents;
    private LocalDateTime insertDatetime;
}
