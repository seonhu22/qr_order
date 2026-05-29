package htms.QROrder.client.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Data
public class NoticeItem {
    private String sysId;
    private String noticeTitle;
    private String writeUserName;
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate openDate;
    private String noticeDescription;
    private String fileUlid;
}
