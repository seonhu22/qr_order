package htms.QROrder.auth.repository;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface EmailValidMapper {
    boolean userEmailMatchChk(@Param("email") String email, @Param("userId") String userId);
}
