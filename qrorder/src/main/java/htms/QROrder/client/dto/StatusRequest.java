package htms.QROrder.client.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalTime;
import java.util.List;

@Data
public class StatusRequest extends StatusItem {
    private String cancelReason;
    private String cancelDescription;
    @JsonFormat(pattern = "HH:mm")
    private LocalTime cancelDatetime;
    private String cancelType;
}
