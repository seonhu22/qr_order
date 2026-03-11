package htms.QROrder.log.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class LogMaster {
    private String sysId;
    private String userId;
    private String loginResult;
    private String failReason;
    private String ipAddress;
    private LocalDateTime loginDatetime;
    private LocalDateTime logoutDatetime;
    private String sysPlantCd;
}
