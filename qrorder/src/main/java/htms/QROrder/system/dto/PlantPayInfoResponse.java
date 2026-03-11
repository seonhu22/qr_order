package htms.QROrder.system.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class PlantPayInfoResponse {
    private String sysId;
    private String plantCd;
    private String plantNm;
    private String paymentCd;
    private LocalDate lastCheckoutDate;
    private LocalDate estimateCheckoutDate;
    private String useYn;
}
