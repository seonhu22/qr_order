package htms.QROrder.system.dto;

import lombok.Data;

@Data
public class NoticeResponse {
    private String sysId;
    private String noticeTitle;
    private String noticeDescription;
    private String startDate;
    private String useYn;
    private String fileUlid;
    private String insertUserId;
    private String insertDatetime;
    private String modifyDatetime;
    private String modifyUserId;
}
