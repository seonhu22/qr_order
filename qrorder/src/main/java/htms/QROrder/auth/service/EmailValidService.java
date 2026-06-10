package htms.QROrder.auth.service;

import htms.QROrder.auth.dto.SignUpRequest;
import htms.QROrder.auth.exception.EmailValidException;
import htms.QROrder.auth.repository.EmailValidMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailValidService {

    private final EmailValidMapper emailValidMapper;

    public void newUserEmailValid(String encodeSysId) {

        if(!codeExist(encodeSysId)) {
            throw new EmailValidException("인증 링크가 유효하지 않습니다.");
        }

        emailValidMapper.newUserEmailValid(encodeSysId);
    }

    private boolean codeExist(String encodeSysId) {

        return emailValidMapper.codeExist(encodeSysId);
    }
}
