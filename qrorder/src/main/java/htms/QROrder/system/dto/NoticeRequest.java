package htms.QROrder.system.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

@Data
public class NoticeRequest {
    private String sysId;
    private String noticeTitle;
    private String noticeDescription;
    @io.swagger.v3.oas.annotations.media.Schema(allowableValues = {"all", "manager", "staff"},
            description = "수신 대상. 신규 생략은 all, 수정 생략은 기존 대상 유지")
    private String target;
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startDate;
    private String deleteYn;
    private String useYn;
    private String fileUuid;
    private String sysPlantCd;
}
