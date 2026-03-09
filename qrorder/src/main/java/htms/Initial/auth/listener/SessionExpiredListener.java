package htms.Initial.auth.listener;

import htms.Initial.log.service.LogService;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.HttpSessionEvent;
import jakarta.servlet.http.HttpSessionListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SessionExpiredListener implements HttpSessionListener {

    private final LogService logService;

    @Override
    public void sessionDestroyed(HttpSessionEvent event) {
        HttpSession session = event.getSession();

        Boolean manualLogout = (Boolean) session.getAttribute("manualLogout");
        if (Boolean.TRUE.equals(manualLogout)) {
            return;
        }

        String logUuid = (String) session.getAttribute("logUuid");
        if (logUuid == null || logUuid.isBlank()) {
            return;
        }

        logService.insertLogoutLog(logUuid);
    }
}