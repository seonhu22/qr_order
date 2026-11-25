package htms.QROrder.auth.service;

import java.time.LocalDate;

/** 사업자등록 진위 확인. 기본은 국세청(NTS), local 프로필에서만 가짜로 바꿀 수 있다. */
public interface BusinessRegistrationVerifier {
    /** 형식 검사를 통과한 값만 받는다. 번호는 숫자 10자리, 대표자명은 trim 된 값. */
    boolean isValid(String businessRegiNum, LocalDate openDate, String representativeName);
}
