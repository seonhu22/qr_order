package htms.QROrder.auth.repository;

import htms.QROrder.auth.dto.BRNRequest;
import htms.QROrder.auth.dto.EmailValidRequest;
import htms.QROrder.auth.dto.SignUpRequest;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SignUpMapper {
    void newUser(SignUpRequest signUpRequest);
    void newEmailChk(EmailValidRequest emailValidRequest);
    boolean idDuplicateChk(String userId);
    void emailValid(String encodeSysId);
}
