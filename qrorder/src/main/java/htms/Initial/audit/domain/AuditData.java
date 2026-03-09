package htms.Initial.audit.domain;

import lombok.Data;

@Data
public class AuditData {
    private String columnName;
    private String columnComment;
    private String columnData;
}
