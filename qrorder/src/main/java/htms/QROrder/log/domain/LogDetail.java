package htms.QROrder.log.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class LogDetail {
    private String sysId;
    private String menuCd;
    private LocalDateTime menuOpenDatetime;
    private LocalDateTime menuCloseDatetime;
}
