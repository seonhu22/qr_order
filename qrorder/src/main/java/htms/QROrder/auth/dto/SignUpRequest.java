package htms.QROrder.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class SignUpRequest {
    private String sysId;
    private String userId;
    private String email;
    private String userPassword;
    private String userPasswordCheck;
    private String businessRegiNum;
    private String userNm;
    private LocalDate businessRegiDate;
}
