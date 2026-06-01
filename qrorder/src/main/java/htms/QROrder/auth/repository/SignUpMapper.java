package htms.QROrder.auth.repository;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.auth.dto.InitPwdRequest;
import htms.QROrder.auth.dto.SignUpRequest;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SignUpMapper {
    void newUser(SignUpRequest signUpRequest);
}
