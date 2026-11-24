package htms.QROrder.auth.dto;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

/** chkBRN을 통과한 사업자 정보. 가입 요청은 같은 세션에서 같은 값으로만 진행된다. */
public record VerifiedBusiness(String businessRegiNum, String userNm, LocalDate businessRegiDate)
        implements Serializable {

    public static final String SESSION_KEY = "signupVerifiedBusiness";

    public static VerifiedBusiness of(SignUpRequest request) {
        return new VerifiedBusiness(
                request.getBusinessRegiNum() == null ? "" : request.getBusinessRegiNum().replaceAll("\\D", ""),
                request.getUserNm() == null ? "" : request.getUserNm().trim(),
                request.getBusinessRegiDate());
    }

    public boolean matches(SignUpRequest request) {
        return request != null && businessRegiNum.length() == 10 && equals(of(request))
                && Objects.nonNull(businessRegiDate);
    }
}
