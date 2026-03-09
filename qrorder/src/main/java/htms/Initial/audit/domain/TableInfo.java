package htms.Initial.audit.domain;

import lombok.Data;

@Data
public class TableInfo {
    private String tableName;
    private String columnName;
    private String columnComment;
}
