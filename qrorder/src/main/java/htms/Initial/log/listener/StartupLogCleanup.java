package htms.Initial.log.listener;

import htms.Initial.log.service.LogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class StartupLogCleanup implements ApplicationRunner {

    private final LogService logService;

    @Override
    public void run(ApplicationArguments args) {
        logService.closeAllOpenSessions();
        log.info("[StartupLogCleanup] 미처리 로그아웃 일괄 처리 완료");
    }
}
