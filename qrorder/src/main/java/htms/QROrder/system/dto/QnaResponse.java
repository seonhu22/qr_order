package htms.QROrder.system.dto;

import lombok.Data;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class QnaResponse {
    private String sysId;
    private String qnaTitle;
    private String writeUsername;
    private String qnaDescription;
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime writeDatetime;
    @Schema(types = {"string", "null"}, format = "date-time", description = "문의 수정 또는 답변 저장 시 기록된 최종 수정 시각. 미수정 시 null")
    private LocalDateTime modifyDatetime;
    private String fileUlid;
    private String answerYn;
    private String answerUserName;
    private LocalDateTime answerDatetime;
    private String answerDescription;
}
