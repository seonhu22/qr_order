package htms.QROrder.system.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

@Data
public class NoticeRequest {
    private String sysId;
    private String noticeTitle;
    private String noticeDescription;
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startDate;
    private String deleteYn;
    private String useYn;
    private String fileUuid;
    private String sysPlantCd;
}
