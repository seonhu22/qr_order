package htms.QROrder.client;

import htms.QROrder.auth.StaffTestSupport;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.client.dto.*;
import htms.QROrder.client.repository.ClientUserMapper;
import htms.QROrder.client.service.ClientUserService;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ClientUserUpdateTest {
    private final ClientUserMapper mapper = mock(ClientUserMapper.class);
    private final ClientUserService service = new ClientUserService(mock(AuditService.class), mapper, mock(PasswordEncoder.class));
    private ClientUserRequest item() { var i = new ClientUserRequest(); i.setSysId("STAFF"); i.setUserNm("새 이름"); return i; }
    @Test void editsOnlyScopedStaffAndRejectsIdentityForgery() {
        var actor = StaffTestSupport.login("OWNER", "STORE", "01");
        var old = new ClientUserResponse(); old.setUserId("staff-login");
        when(mapper.lockStaffUsers(List.of("STAFF"), "STORE")).thenReturn(List.of(old));
        when(mapper.updateClientUser(any(), eq("OWNER"), eq("STORE"), eq("MENU"))).thenReturn(1);
        var item = item(); service.updateClientUser(item, actor, "MENU");
        verify(mapper).updateClientUser(item, "OWNER", "STORE", "MENU");
        item.setUserId("OTHER");
        assertThrows(ResponseStatusException.class, () -> service.updateClientUser(item, actor, "MENU"));
        verify(mapper, times(1)).updateClientUser(any(), any(), any(), any());
    }
    @Test void foreignOrManagerTargetAndRoleForgeryNeverWrite() {
        var actor = StaffTestSupport.login("OWNER", "STORE", "01");
        when(mapper.lockStaffUsers(List.of("STAFF"), "STORE")).thenReturn(List.of());
        assertThrows(ResponseStatusException.class, () -> service.updateClientUser(item(), actor, "MENU"));
        var forged = item(); forged.setUserRole("01");
        assertThrows(ResponseStatusException.class, () -> service.updateClientUser(forged, actor, "MENU"));
        verify(mapper, never()).updateClientUser(any(), any(), any(), any());
    }
}
