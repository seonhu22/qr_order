package htms.QROrder.system.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

@Data
public class QnaRequest {
    private String sysId;
    private String qnaTitle;
    private String qnaDescription;
    private String deleteYn;
    private String useYn;
    private String fileUuid;
    private String answerYn;
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime answerDatetime;
    private String answerDescription;
}
