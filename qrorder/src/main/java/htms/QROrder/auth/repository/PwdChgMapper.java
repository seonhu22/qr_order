package htms.QROrder.auth.repository;

import htms.QROrder.auth.dto.PwdChgRequest;
import htms.QROrder.auth.dto.SignUpRequest;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PwdChgMapper {
    void chgPwd(PwdChgRequest pwdChgRequest);
}
