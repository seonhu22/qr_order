package htms.QROrder.client;

import htms.QROrder.auth.StaffTestSupport;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.client.dto.ClientUserRequest;
import htms.QROrder.client.repository.ClientUserMapper;
import htms.QROrder.client.service.ClientUserService;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ClientUserRegistrationTest {
    private final ClientUserMapper mapper = mock(ClientUserMapper.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private final ClientUserService service = new ClientUserService(mock(AuditService.class), mapper, encoder);
    private ClientUserRequest draft() {
        var item = new ClientUserRequest(); item.setUserId("STAFF"); item.setUserNm("직원"); return item;
    }
    @Test void omittedScopeIsFilledFromServerAndNeverCreatesManager() {
        var item = draft(); service.newClientUser(item, StaffTestSupport.login("OWNER", "STORE", "01"), "MENU");
        assertEquals("STORE", item.getPlantCd()); assertEquals("02", item.getUserRole());
        assertNotNull(item.getSysId());
        verify(mapper).newClientUser(eq(item), eq("OWNER"), eq("STORE"), eq("MENU"), any());
    }
    @Test void rejectsRoleAndStoreForgeryBeforePersistence() {
        for (boolean forgeRole : new boolean[]{true, false}) {
            var item = draft(); if (forgeRole) item.setUserRole("01"); else item.setPlantCd("ADMIN");
            var error = assertThrows(ResponseStatusException.class,
                    () -> service.newClientUser(item, StaffTestSupport.login("OWNER", "STORE", "01"), "MENU"));
            assertEquals(403, error.getStatusCode().value());
        }
        verifyNoInteractions(mapper, encoder);
    }
    @Test void staffCannotListOrCreateUsers() {
        var actor = StaffTestSupport.login("STAFF", "STORE", "02");
        assertThrows(ResponseStatusException.class, () -> service.newClientUser(draft(), actor, "MENU"));
        assertThrows(ResponseStatusException.class, () -> service.getClientUser("", actor));
        verifyNoInteractions(mapper);
    }
}
