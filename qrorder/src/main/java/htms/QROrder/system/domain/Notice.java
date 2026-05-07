package htms.QROrder.system.domain;

import lombok.Data;

@Data
public class Notice {
    private String sysId;
    private String noticeTitle;
    private String noticeDescription;
    private String startDate;
    private String useYn;
}
