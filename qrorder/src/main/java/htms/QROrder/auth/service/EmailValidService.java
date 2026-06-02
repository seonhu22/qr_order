package htms.QROrder.auth.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.auth.dto.BRNRequest;
import htms.QROrder.auth.dto.EmailValidRequest;
import htms.QROrder.auth.dto.SignUpRequest;
import htms.QROrder.auth.exception.BusinessRegiException;
import htms.QROrder.auth.exception.EmailValidException;
import htms.QROrder.auth.repository.EmailValidMapper;
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
public class EmailValidService {

    private final EmailValidMapper emailValidMapper;

    public void emailValid(String encodeSysId) {

        if(!codeExist(encodeSysId)) {
            throw new EmailValidException("인증 링크가 유효하지 않습니다.");
        }

        emailValidMapper.emailValid(encodeSysId);
    }

    private boolean codeExist(String encodeSysId) {

        return emailValidMapper.codeExist(encodeSysId);
    }
}
