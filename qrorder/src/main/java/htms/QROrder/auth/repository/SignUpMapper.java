package htms.QROrder.auth.repository;

import htms.QROrder.auth.dto.SignUpRequest;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SignUpMapper {
    void newPlant(SignUpRequest signUpRequest);
    void newUser(SignUpRequest signUpRequest);
    boolean idDuplicateChk(String userId);
}
