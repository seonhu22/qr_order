package htms.QROrder.system.dto;

import com.sun.star.util.DateTime;
import lombok.Data;

@Data
public class NoticeRequest {
    private String sysId;
    private String noticeTitle;
    private String noticeDescription;
    private DateTime startDate;
    private String deleteYn;
    private String useYn;
    private String fileUuid;
    private String sysPlantCd;
}
