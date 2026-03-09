package htms.Initial.auth.service;

import htms.Initial.auth.dto.InitPwdRequest;
import htms.Initial.auth.exception.LoginFailException;
import htms.Initial.auth.repository.LoginMapper;
import htms.Initial.common.exception.ValidationException;
import htms.Initial.log.service.LogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import htms.Initial.auth.domain.Login;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoginService {
    private final LoginMapper loginMapper;
    private final PasswordEncoder passwordEncoder;
    private final LogService logService;

    public boolean loginCheck(Login login, HttpServletRequest httpServletRequest, HttpSession session) {

        Login dbLoginData = loginMapper.findByUserId(login.getUserId());
        String uuid = UUID.randomUUID().toString();

        if (dbLoginData == null) {
            throw new LoginFailException("해당 계정은 존재하지 않습니다.");
        }
        else if (dbLoginData.getInitYn().equals("N")) {
            session.setAttribute("loginUser", dbLoginData);
            session.setAttribute("logUuid", uuid);
            return true;
        }
        else if (!passwordEncoder.matches(login.getUserPassword(), dbLoginData.getUserPassword())) {
            String errMsg = "비밀번호가 맞지 않습니다.";
            logService.loginLog(uuid, httpServletRequest, "F", errMsg, dbLoginData);
            throw new LoginFailException(errMsg);
        }
        else if (dbLoginData.getPasswordFailCnt() > 5) {
            String errMsg = "해당 계정은 비밀번호 5회 초과 오류로 사용 중지된 상태입니다.";
            logService.loginLog(uuid, httpServletRequest, "F", errMsg, dbLoginData);
            throw new LoginFailException(errMsg);
        }

        logService.loginLog(uuid, httpServletRequest, "P", null, dbLoginData);

        session.setAttribute("loginUser", dbLoginData);
        session.setAttribute("logUuid", uuid);
        log.info("login success={}, {}", dbLoginData.getUserId(), dbLoginData.getSysPlantCd());

        return false;
    }

    @Transactional
    public void initPwd(InitPwdRequest initPwdRequest, String userId) {

        if (!initPwdRequest.getPassword().equals(initPwdRequest.getChkPassword())) {
            throw new ValidationException("비밀번호와 비밀번호확인의 값이 일치하지 않습니다.");
        }

        String encodedPassword = passwordEncoder.encode(initPwdRequest.getPassword());
        initPwdRequest.setPassword(encodedPassword);
        loginMapper.initPwd(initPwdRequest, userId);
    }
}
