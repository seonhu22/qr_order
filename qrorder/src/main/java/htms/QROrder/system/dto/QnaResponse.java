package htms.QROrder.system.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class QnaResponse {
    private String sysId;
    private String qnaTitle;
    private String writeUsername;
    private String qnaDescription;
    private LocalDate startDate;
    private String fileUlid;
    private String answerYn;
    private String answerUserName;
    private LocalDateTime answerDatetime;
    private String answerDescription;
}
