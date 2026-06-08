package htms.QROrder.auth.repository;

import htms.QROrder.auth.dto.SignUpRequest;
import htms.QROrder.auth.dto.EmailValidRequest;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SignUpMapper {
    void newPlant(SignUpRequest signUpRequest);
    void newUser(SignUpRequest signUpRequest);
    void newEmailChk(EmailValidRequest emailValidRequest);
    boolean idDuplicateChk(String userId);
    void emailValid(String encodeSysId);
}
