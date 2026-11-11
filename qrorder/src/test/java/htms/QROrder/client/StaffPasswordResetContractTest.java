package htms.QROrder.client;

import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class StaffPasswordResetContractTest {
    @Test void managerPassesOwnStoreAndRejectsUnmatchedTarget() {
        var mapper = org.mockito.Mockito.mock(htms.QROrder.client.repository.ClientUserMapper.class);
        var encoder = org.mockito.Mockito.mock(org.springframework.security.crypto.password.PasswordEncoder.class);
        var service = new htms.QROrder.client.service.ClientUserService(
                org.mockito.Mockito.mock(htms.QROrder.audit.service.AuditService.class), mapper, encoder);
        org.springframework.test.util.ReflectionTestUtils.setField(service, "defaultPassword", "TEST");
        org.mockito.Mockito.when(encoder.encode("TEST")).thenReturn("HASH");
        var actor = new htms.QROrder.auth.domain.Login();
        actor.setUserRole("01"); actor.setSysPlantCd("STORE"); actor.setUserId("MANAGER");
        org.mockito.Mockito.when(mapper.resetPwd("STAFF", "HASH", "STORE", "MANAGER")).thenReturn(1);
        service.resetPwd("STAFF", actor);
        org.mockito.Mockito.verify(mapper).resetPwd("STAFF", "HASH", "STORE", "MANAGER");
        assertThrows(org.springframework.web.server.ResponseStatusException.class, () -> service.resetPwd("OTHER", actor));
    }
    @Test void staffAndMissingStoreDoNotReachPasswordEncoderOrMapper() {
        var mapper = org.mockito.Mockito.mock(htms.QROrder.client.repository.ClientUserMapper.class);
        var encoder = org.mockito.Mockito.mock(org.springframework.security.crypto.password.PasswordEncoder.class);
        var service = new htms.QROrder.client.service.ClientUserService(
                org.mockito.Mockito.mock(htms.QROrder.audit.service.AuditService.class), mapper, encoder);
        for (String role : new String[]{"02", null}) {
            var actor = new htms.QROrder.auth.domain.Login(); actor.setUserRole(role); actor.setSysPlantCd("STORE");
            assertThrows(org.springframework.web.server.ResponseStatusException.class, () -> service.resetPwd("STAFF", actor));
        }
        assertThrows(org.springframework.web.server.ResponseStatusException.class, () -> service.resetPwd("STAFF", null));
        org.mockito.Mockito.verifyNoInteractions(mapper, encoder);
    }
    @Test void updateRequiresSameStoreStaffAndClearsLock() throws Exception {
        var configuration = new Configuration();
        String resource = "mapper/client/ClientUserMapper.xml";
        try (var input = getClass().getClassLoader().getResourceAsStream(resource)) {
            new XMLMapperBuilder(input, configuration, resource, configuration.getSqlFragments()).parse();
        }
        var sql = configuration.getMappedStatement("htms.QROrder.client.repository.ClientUserMapper.resetPwd")
                .getBoundSql(Map.of("sysId", "STAFF", "tempPwd", "HASH", "sysPlantCd", "STORE", "userId", "MANAGER"));
        String query = sql.getSql().replaceAll("\\s+", " ").toLowerCase();
        assertTrue(sql.getParameterMappings().stream().anyMatch(p -> p.getProperty().equals("sysPlantCd")));
        assertTrue(query.contains("user_role = '02'"));
        assertTrue(query.contains("delete_yn = 'n'"));
        assertTrue(query.contains("init_yn = 'y'"));
        assertTrue(query.contains("password_fail_cnt = 0"));
    }
}
