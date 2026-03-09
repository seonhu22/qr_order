package htms.Initial.auth.repository;

import htms.Initial.auth.domain.Login;
import htms.Initial.auth.dto.InitPwdRequest;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface LoginMapper {
    Login findByUserId(String userId);
    void initPwd(@Param("initPwdRequest") InitPwdRequest initPwdRequest, @Param("userId") String userId);
}
