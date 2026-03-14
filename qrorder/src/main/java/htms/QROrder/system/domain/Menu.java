package htms.QROrder.system.domain;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class Menu {
    private String sysId;
    @NotBlank(message = "메뉴 코드는 필수값입니다.")
    private String menuCd;
    @NotBlank(message = "메뉴 명은 필수값입니다.")
    private String menuNm;
    @NotBlank(message = "오류가 발생했습니다. 관리자에게 문의해주세요.")
    private String parentMenuCd;
    @NotBlank(message = "오류가 발생했습니다. 관리자에게 문의해주세요.")
    private String ordNo;
    @NotBlank(message = "오류가 발생했습니다. 관리자에게 문의해주세요.")
    private String treeLevel;
    private String menuUrl;
}
