package htms.QROrder.auth.repository;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.auth.dto.InitPwdRequest;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface LoginMapper {
    Login findByUserId(String userId);
    void initPwd(InitPwdRequest initPwdRequest, String userId);
    void initPwdAndACtive(InitPwdRequest initPwdRequest, String userId);
    void pwdIncorrectCntIncrease(String sysId);
    void pwdCntReset(String sysId);
}
