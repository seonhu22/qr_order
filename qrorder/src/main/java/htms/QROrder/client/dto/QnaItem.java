package htms.QROrder.client.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class QnaItem {
    private String sysId;
    private String qnaTitle;
    private String writeUserName;
    private String qnaDescription;
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime writeDatetime;
    private String fileUlid;
    private String answerYn;
    private String answerUserName;
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime answerDatetime;
    private String answerDescription;
}
