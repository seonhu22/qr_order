package htms.QROrder.auth.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.auth.dto.PwdChgRequest;
import htms.QROrder.auth.dto.SignUpRequest;
import htms.QROrder.auth.exception.BusinessRegiException;
import htms.QROrder.auth.repository.PwdChgMapper;
import htms.QROrder.auth.repository.SignUpMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PwdChgService {

    private final PwdChgMapper pwdChgMapper;
    private final PasswordEncoder passwordEncoder;

    public void changePwd(PwdChgRequest pwdChgRequest) {

        if (!pwdChgRequest.getPwd().equals(pwdChgRequest.getPwdConfirm())) {
            throw new BusinessRegiException("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        }

        pwdChgRequest.setPwd(passwordEncoder.encode(pwdChgRequest.getPwd()));
        pwdChgRequest.setPwdConfirm(pwdChgRequest.getPwdConfirm());

        pwdChgMapper.chgPwd(pwdChgRequest);
    }
}
