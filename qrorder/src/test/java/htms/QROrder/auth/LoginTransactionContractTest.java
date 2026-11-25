package htms.QROrder.auth;

import htms.QROrder.auth.dto.LoginRequest;
import htms.QROrder.auth.dto.PwdChgRequest;
import htms.QROrder.auth.exception.LoginFailException;
import htms.QROrder.auth.repository.PwdChgMapper;
import htms.QROrder.auth.service.LoginService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Transactional;
import java.util.Arrays;
import static org.junit.jupiter.api.Assertions.*;

class LoginTransactionContractTest {
    @Test
    void passwordRecoverySavesPasswordAndClearsFailureCountInOneUpdate() throws Exception {
        var configuration = new Configuration();
        String resource = "mapper/auth/PwdChgMapper.xml";
        try (var input = getClass().getClassLoader().getResourceAsStream(resource)) {
            new XMLMapperBuilder(input, configuration, resource, configuration.getSqlFragments()).parse();
        }

        var request = new PwdChgRequest();
        request.setUserId("AUTO-QA-INV-AUTH02");
        request.setPwd("encoded-password");
        var statement = configuration.getMappedStatement(PwdChgMapper.class.getName() + ".chgPwd");
        String update = statement.getBoundSql(request).getSql().replaceAll("\\s+", " ").trim();
        assertTrue(update.contains("user_password = ?, password_fail_cnt = 0,"), update);
    }

    @Test void serializesLoginAndCommitsExpectedFailureCounter() throws Exception {
        var transaction = LoginService.class.getMethod("loginCheck", LoginRequest.class,
                HttpServletRequest.class, HttpSession.class).getAnnotation(Transactional.class);
        assertNotNull(transaction);
        assertTrue(Arrays.asList(transaction.noRollbackFor()).contains(LoginFailException.class));
        var configuration = new org.apache.ibatis.session.Configuration();
        configuration.getTypeAliasRegistry().registerAlias("Login", htms.QROrder.auth.domain.Login.class);
        String resource = "mapper/auth/LoginMapper.xml";
        try (var input = getClass().getClassLoader().getResourceAsStream(resource)) {
            new org.apache.ibatis.builder.xml.XMLMapperBuilder(input, configuration, resource, configuration.getSqlFragments()).parse();
        }
        String select = configuration.getMappedStatement("htms.QROrder.auth.repository.LoginMapper.findByUserId")
                .getBoundSql(java.util.Map.of("userId", "QA")).getSql();
        assertTrue(select.toLowerCase().contains("for update"));
        String authority = configuration.getMappedStatement("htms.QROrder.auth.repository.LoginMapper.findForAuthorization")
                .getBoundSql(java.util.Map.of("sysId", "QA")).getSql();
        assertFalse(authority.toLowerCase().contains("for update"));
    }
}
