package htms.QROrder.auth.repository;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.auth.dto.InitPwdRequest;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface LoginMapper {
    Login findForAuthorization(@Param("sysId") String sysId);
    Login findByUserId(String userId);
    int initPwdBySysId(@Param("password") String password, @Param("sysId") String sysId);
    void initPwdAndActive(InitPwdRequest initPwdRequest, String userId);
    void pwdIncorrectCntIncrease(String sysId);
    void pwdCntReset(String sysId);
}
