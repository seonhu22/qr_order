package htms.QROrder.auth.repository;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface EmailValidMapper {
    boolean codeExist(@Param("email") String email);
    boolean codeMatch(@Param("email") String email, @Param("validCode") String validCode);
    void newUserEmailValid(@Param("email") String email);
    boolean userExistsByEmail(@Param("email") String email);
    void updateValidCode(@Param("email") String email, @Param("validCode") String validCode);
    void pwdChange(@Param("email") String email);
}
