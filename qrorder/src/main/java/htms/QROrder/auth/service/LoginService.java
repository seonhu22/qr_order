package htms.QROrder.auth.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.auth.domain.Login;
import htms.QROrder.auth.dto.InitPwdRequest;
import htms.QROrder.auth.dto.LoginRequest;
import htms.QROrder.auth.exception.LoginFailException;
import htms.QROrder.auth.repository.LoginMapper;
import htms.QROrder.common.exception.ValidationException;
import htms.QROrder.log.service.LogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoginService {
    private final LoginMapper loginMapper;
    private final PasswordEncoder passwordEncoder;
    private final LogService logService;

    public void loginCheck(LoginRequest loginRequest, HttpServletRequest httpServletRequest, HttpSession session) {

        Login dbLoginData = loginMapper.findByUserId(loginRequest.getUserId());
        String uuid = UlidCreator.getMonotonicUlid().toString();

        if (dbLoginData == null) {
            throw new LoginFailException("해당 계정은 존재하지 않습니다.");
        }

        if (dbLoginData.getPasswordFailCnt() > 5) {
            String errMsg = "해당 계정은 비밀번호 5회 초과 오류로 사용 중지된 상태입니다.";
            logService.loginLog(uuid, httpServletRequest, "F", errMsg, dbLoginData);
            throw new LoginFailException(errMsg);
        }

        if (!passwordEncoder.matches(loginRequest.getUserPassword(), dbLoginData.getUserPassword())) {
            String errMsg = "비밀번호가 맞지 않습니다.";
            logService.loginLog(uuid, httpServletRequest, "F", errMsg, dbLoginData);
            loginMapper.pwdIncorrectCntIncrease(dbLoginData.getSysId());
            throw new LoginFailException(errMsg, dbLoginData.getPasswordFailCnt());
        }

        if("N".equals(dbLoginData.getEmailValidYn())) {
            throw new LoginFailException("이메일 인증이 미완료된 상태입니다.");
        }

        logService.loginLog(uuid, httpServletRequest, "P", null, dbLoginData);
        loginMapper.pwdCntReset(dbLoginData.getSysId());

        session.setAttribute("loginUser", dbLoginData);
        session.setAttribute("logUuid", uuid);

        if ("ADMIN".equals(dbLoginData.getSysPlantCd())) {
            session.setAttribute("role", "SUPER_ADMIN");
            session.setMaxInactiveInterval(60 * 60);
        }
        else {
            session.setMaxInactiveInterval(-1);
        }

        log.info("login success={}, {}, {}", dbLoginData.getUserId(), dbLoginData.getSysPlantCd(), session.getAttribute("role"));
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

    @Transactional
    public void initPwdAndActive(InitPwdRequest initPwdRequest, String userId) {

        if (!initPwdRequest.getPassword().equals(initPwdRequest.getChkPassword())) {
            throw new ValidationException("비밀번호와 비밀번호확인의 값이 일치하지 않습니다.");
        }

        String encodedPassword = passwordEncoder.encode(initPwdRequest.getPassword());
        initPwdRequest.setPassword(encodedPassword);
        loginMapper.initPwdAndActive(initPwdRequest, userId);
    }
}
