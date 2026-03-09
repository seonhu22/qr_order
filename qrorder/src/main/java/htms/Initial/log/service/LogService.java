package htms.Initial.log.service;

import htms.Initial.auth.domain.Login;
import htms.Initial.log.repository.LogMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class LogService {

    private final LogMapper logMapper;

    private String getIpAddress(HttpServletRequest httpServletRequest) {

        String ip = httpServletRequest.getHeader("X-Forwarded-For");

        if(ip == null || ip.isBlank()) {
            ip = httpServletRequest.getRemoteAddr();
        }
        else {
            ip = ip.split(",")[0].trim();
        }

        return ip;
    }

    public void loginLog(String uuid,
                            HttpServletRequest httpServletRequest,
                            String successStatus,
                            String errMsg,
                            Login login) {

        String ip = getIpAddress(httpServletRequest);

        logMapper.insertLoginLog(uuid, ip, successStatus, errMsg, login.getUserId(), login.getSysPlantCd());
    }

    public void insertLogoutLog(String uuid) {

        logMapper.insertLogoutLog(uuid);
    }

    public void insertMenuOpenAccessLog(String menuUuid,
                                        String logUuid,
                                        String menuCd) {

        logMapper.insertMenuOpenAccessLog(menuUuid, logUuid, menuCd);
    }

    public void insertMenuCloseAccessLog(String menuUuid) {

        logMapper.insertMenuCloseAccessLog(menuUuid);
    }

    public void closeAllOpenSessions() {

        logMapper.closeAllOpenMenuSessions();
        logMapper.closeAllOpenSessions();
    }
}
