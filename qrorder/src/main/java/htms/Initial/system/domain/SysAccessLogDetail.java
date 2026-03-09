package htms.Initial.system.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SysAccessLogDetail {
    private String menuCd;
    private String menuNm;
    private LocalDateTime menuOpenDatetime;
    private LocalDateTime menuCloseDatetime;
}
