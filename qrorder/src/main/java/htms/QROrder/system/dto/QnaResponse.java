package htms.QROrder.system.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class QnaResponse {
    private String sysId;
    private String qnaTitle;
    private String qnaDescription;
    private LocalDateTime startDate;
    private String fileUuid;
    private String answerYn;
    private LocalDateTime answerDatetime;
    private String answerDescription;
}
