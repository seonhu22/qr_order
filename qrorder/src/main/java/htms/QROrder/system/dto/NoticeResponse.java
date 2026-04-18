package htms.QROrder.system.dto;

import lombok.Data;

@Data
public class NoticeResponse {
    private String noticeTitle;
    private String noticeDescription;
    private String startDate;
    private String fileUuid;
}
