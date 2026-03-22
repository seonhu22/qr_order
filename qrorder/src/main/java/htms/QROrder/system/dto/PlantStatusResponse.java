package htms.QROrder.system.dto;

import lombok.Data;
import org.springframework.cglib.core.Local;

import java.time.LocalDateTime;

@Data
public class PlantStatusResponse {
    private String sysId;
    private String plantCd;
    private String plantNm;
    private String paymentCd;
    private String paymentNm;
    private LocalDateTime lastCheckoutDate;
    private LocalDateTime estimateCheckoutDate;
}
