package htms.QROrder.auth.repository;

import htms.QROrder.auth.dto.SignUpRequest;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface EmailValidMapper {
    boolean codeExist(String encodeSysID);
    void newUserEmailValid(String  encodeSysId);
}
