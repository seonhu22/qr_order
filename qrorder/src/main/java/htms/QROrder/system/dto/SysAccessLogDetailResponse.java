package htms.QROrder.system.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SysAccessLogDetailResponse {
    private String menuCd;
    private String menuNm;
    private LocalDateTime menuOpenDatetime;
    private LocalDateTime menuCloseDatetime;
}
