package htms.QROrder.system;

import htms.QROrder.auth.StaffTestSupport;
import htms.QROrder.client.dto.ClientUserResponse;
import htms.QROrder.system.repository.ClientUserRoleMapper;
import htms.QROrder.system.service.ClientUserRoleService;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ClientUserPromotionTest {
    @Test void httpPromotionUsesAuthenticatedSystemAdminAndDeniesStoreManager() throws Exception {
        var actor = StaffTestSupport.login("SUPPORT", "ADMIN", null);
        var currentUsers = StaffTestSupport.mapperFor(actor);
        var mvc = org.springframework.test.web.servlet.setup.MockMvcBuilders
                .standaloneSetup(new htms.QROrder.system.controller.ClientUserRoleController(service))
                .addInterceptors(new htms.QROrder.auth.Interceptor.LoginCheckInterceptor(currentUsers),
                        new htms.QROrder.auth.Interceptor.RoleCheckInterceptor())
                .setControllerAdvice(new htms.QROrder.common.exception.GlobalExceptionHandler()).build();
        when(mapper.lockForPromotion("TARGET")).thenReturn(user("STORE", "02"));
        when(mapper.promote("TARGET", "STORE", "SUPPORT")).thenReturn(1);
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/system/client-users/TARGET/promote")
                .sessionAttr("loginUser", actor).param("plantCd", "ADMIN"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.success").value(true));
        var manager = StaffTestSupport.login("OWNER", "STORE", "01");
        when(currentUsers.findForAuthorization("OWNER")).thenReturn(manager);
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/system/client-users/TARGET/promote")
                .sessionAttr("loginUser", manager).sessionAttr("role", "SUPER_ADMIN"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isForbidden());
        verify(mapper, times(1)).promote(any(), any(), any());
    }
    private final ClientUserRoleMapper mapper = mock(ClientUserRoleMapper.class);
    private final ClientUserRoleService service = new ClientUserRoleService(mapper);
    private ClientUserResponse user(String store, String role) {
        var user = new ClientUserResponse(); user.setSysId("TARGET"); user.setPlantCd(store); user.setUserRole(role); return user;
    }
    @Test void systemAdminPromotesAndRepeatDoesNotWriteAgain() {
        var admin = StaffTestSupport.login("SUPPORT", "ADMIN", null);
        when(mapper.lockForPromotion("TARGET")).thenReturn(user("STORE", "02"), user("STORE", "01"));
        when(mapper.promote("TARGET", "STORE", "SUPPORT")).thenReturn(1);
        service.promote("TARGET", admin); service.promote("TARGET", admin);
        verify(mapper, times(1)).promote("TARGET", "STORE", "SUPPORT");
    }
    @Test void storeManagerAndStaffCannotPromote() {
        for (String role : new String[]{"01", "02"}) {
            assertThrows(ResponseStatusException.class, () -> service.promote("TARGET", StaffTestSupport.login("USER", "STORE", role)));
        }
        verifyNoInteractions(mapper);
    }
    @Test void missingSystemAccountAndInvalidRoleAreRejected() {
        var actor = StaffTestSupport.login("SUPPORT", "ADMIN", null);
        assertEquals(404, assertThrows(ResponseStatusException.class, () -> service.promote("TARGET", actor)).getStatusCode().value());
        when(mapper.lockForPromotion("TARGET")).thenReturn(user("ADMIN", "02"));
        assertEquals(403, assertThrows(ResponseStatusException.class, () -> service.promote("TARGET", actor)).getStatusCode().value());
        when(mapper.lockForPromotion("TARGET")).thenReturn(user("STORE", "03"));
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.promote("TARGET", actor)).getStatusCode().value());
        verify(mapper, never()).promote(any(), any(), any());
    }
}
