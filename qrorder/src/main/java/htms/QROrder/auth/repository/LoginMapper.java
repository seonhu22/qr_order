package htms.QROrder.auth.repository;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.auth.dto.InitPwdRequest;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface LoginMapper {
    Login findByUserId(String userId);
    void initPwd(@Param("initPwdRequest") InitPwdRequest initPwdRequest, @Param("userId") String userId);
}
