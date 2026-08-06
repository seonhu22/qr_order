package htms.QROrder.client.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalTime;

@Data
public class StatusCancelResponse {
    private String cancelReason;
    private String cancelDescription;
    @JsonFormat(pattern = "HH:mm")
    private LocalTime cancelDatetime;
}
