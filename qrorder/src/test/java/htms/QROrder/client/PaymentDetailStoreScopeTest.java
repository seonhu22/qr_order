package htms.QROrder.client;

import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.Test;
import java.util.Map;
import java.util.List;
import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.controller.PaymentManageController;
import htms.QROrder.client.repository.PaymentInfoDetailMapper;
import htms.QROrder.client.service.*;
import htms.QROrder.auth.Interceptor.LoginCheckInterceptor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

class PaymentDetailStoreScopeTest {
    @Test void controllerAndServiceUseSessionStoreNotCallerQuery() throws Exception {
        var mapper = mock(PaymentInfoDetailMapper.class);
        when(mapper.getPaymentInfoDetail("MASTER", "OWNER-STORE")).thenReturn(List.of());
        var mvc = MockMvcBuilders.standaloneSetup(new PaymentManageController(
                mock(PaymentInfoMasterService.class), new PaymentInfoDetailService(mapper), mock(SettlementService.class)))
                .addInterceptors(new LoginCheckInterceptor()).build();
        var login = new Login(); login.setSysPlantCd("OWNER-STORE");
        mvc.perform(get("/api/client/payment_manage/history/detail/search/MASTER")
                .param("sysPlantCd", "FOREIGN-STORE").sessionAttr("loginUser", login))
                .andExpect(status().isOk()).andExpect(content().json("[]"));
        verify(mapper).getPaymentInfoDetail("MASTER", "OWNER-STORE");
        mvc.perform(get("/api/client/payment_manage/history/detail/search/MASTER"))
                .andExpect(status().isUnauthorized());
        verifyNoMoreInteractions(mapper);
    }
    @Test void missingStoreDoesNotReachPersistence() {
        var mapper = mock(PaymentInfoDetailMapper.class);
        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> new PaymentInfoDetailService(mapper).getPaymentInfoDetail("MASTER", " "));
        verifyNoInteractions(mapper);
    }
    @Test void detailQueryScopesMasterToSessionStore() throws Exception {
        var configuration = new Configuration();
        String resource = "mapper/client/PaymentInfoDetailMapper.xml";
        try (var input = getClass().getClassLoader().getResourceAsStream(resource)) {
            new XMLMapperBuilder(input, configuration, resource, configuration.getSqlFragments()).parse();
        }
        var bound = configuration.getMappedStatement(
                "htms.QROrder.client.repository.PaymentInfoDetailMapper.getPaymentInfoDetail")
                .getBoundSql(Map.of("masterSysId", "MASTER", "sysPlantCd", "STORE"));
        assertTrue(bound.getSql().contains("order_master"));
        assertTrue(bound.getParameterMappings().stream().anyMatch(p -> p.getProperty().equals("sysPlantCd")));
        assertTrue(bound.getParameterMappings().stream().anyMatch(p -> p.getProperty().equals("masterSysId")));
    }
}
