package htms.Initial.popup.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PopupPasswordRole {
    private Long minLength;
    private Long maxLength;
    private Long minUppercase;
    private Long minLowercase;
    private Long minNumber;
    private Long minSpecial;
}
