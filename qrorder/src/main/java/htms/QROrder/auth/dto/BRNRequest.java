package htms.QROrder.auth.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class BRNRequest {
    private String businessRegiNum;
    private String userNm;
    private LocalDate businessRegiDate;
}
