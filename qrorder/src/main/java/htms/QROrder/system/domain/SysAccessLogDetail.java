package htms.QROrder.system.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SysAccessLogDetail {
    private String menuCd;
    private LocalDateTime menuOpenDatetime;
    private LocalDateTime menuCloseDatetime;
}
