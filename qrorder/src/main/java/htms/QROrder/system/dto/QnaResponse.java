package htms.QROrder.system.dto;

import com.sun.star.util.DateTime;
import lombok.Data;

@Data
public class QnaResponse {
    private String sysId;
    private String qnaTitle;
    private String qnaDescription;
    private DateTime startDate;
    private String fileUuid;
    private String answerYn;
    private DateTime answerDatetime;
    private String answerDescription;
}
