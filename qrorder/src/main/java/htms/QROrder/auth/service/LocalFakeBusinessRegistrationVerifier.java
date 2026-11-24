package htms.QROrder.auth.service;

import htms.QROrder.config.LocalOnlyGuard;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 로컬 가입 시연용 가짜 사업자 확인. NTS 키 없이 설정 목록의 번호만 통과시킨다.
 * 켜는 조건은 {@link htms.QROrder.config.BusinessVerifierConfig}. 루프백 DB가 아니면 기동을 막는다.
 */
@Slf4j
public class LocalFakeBusinessRegistrationVerifier implements BusinessRegistrationVerifier {
    private final Set<String> allowedNumbers;

    public LocalFakeBusinessRegistrationVerifier(String numbers, String jdbcUrl, boolean sshEnabled) {
        LocalOnlyGuard.requireLoopbackDatabase(jdbcUrl, sshEnabled, "가짜 사업자 확인");
        this.allowedNumbers = Arrays.stream(numbers.split(","))
                .map(value -> value.replaceAll("\\D", ""))
                .filter(value -> value.length() == 10)
                .collect(Collectors.toUnmodifiableSet());
        log.warn("LOCAL ONLY: 가짜 사업자 확인 켜짐. 허용 번호 {}개", allowedNumbers.size());
    }

    @Override
    public boolean isValid(String businessRegiNum, LocalDate openDate, String representativeName) {
        return allowedNumbers.contains(businessRegiNum);
    }
}
