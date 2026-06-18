package htms.QROrder.auth.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class PwdChgRequest {
    private String userId;
    private String pwd;
    private String pwdConfirm;
}
