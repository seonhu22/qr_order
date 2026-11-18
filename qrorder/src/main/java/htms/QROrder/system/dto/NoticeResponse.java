package htms.QROrder.system.dto;

import lombok.Data;

@Data
public class NoticeResponse {
    private String sysId;
    private String noticeTitle;
    private String noticeDescription;
    @io.swagger.v3.oas.annotations.media.Schema(allowableValues = {"all", "manager", "staff"})
    private String target;
    private String startDate;
    private String useYn;
    private String fileUlid;
    private String insertUserId;
    private String insertUserNm;
    private String insertDatetime;
    private String modifyDatetime;
    private String modifyUserId;
}
