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

class ClientUserDeleteTest {
    private final ClientUserMapper mapper = mock(ClientUserMapper.class);
    private final ClientUserService service = new ClientUserService(mock(AuditService.class), mapper, mock(PasswordEncoder.class));
    private ClientUserItem item(String id) { var item = new ClientUserItem(); item.setSysId(id); return item; }
    @Test void sortsAndDeduplicatesBatchBeforeLockAndWrite() {
        when(mapper.lockStaffUsers(List.of("A", "B"), "STORE")).thenReturn(List.of(new ClientUserResponse(), new ClientUserResponse()));
        when(mapper.delClientUser(List.of("A", "B"), "OWNER", "STORE")).thenReturn(2);
        service.delClientUser(List.of(item("B"), item("A"), item("B")), StaffTestSupport.login("OWNER", "STORE", "01"), "MENU");
        verify(mapper).delClientUser(List.of("A", "B"), "OWNER", "STORE");
    }
    @Test void mixedUnauthorizedBatchNeverWrites() {
        when(mapper.lockStaffUsers(List.of("A", "FOREIGN"), "STORE")).thenReturn(List.of(new ClientUserResponse()));
        assertThrows(ResponseStatusException.class, () -> service.delClientUser(List.of(item("A"), item("FOREIGN")),
                StaffTestSupport.login("OWNER", "STORE", "01"), "MENU"));
        verify(mapper, never()).delClientUser(any(), any(), any());
    }
    @Test void emptyBatchRejectedAndWriteCountMismatchThrowsForRollback() {
        var actor = StaffTestSupport.login("OWNER", "STORE", "01");
        assertThrows(ResponseStatusException.class, () -> service.delClientUser(List.of(), actor, "MENU"));
        when(mapper.lockStaffUsers(List.of("A"), "STORE")).thenReturn(List.of(new ClientUserResponse()));
        assertThrows(ResponseStatusException.class, () -> service.delClientUser(List.of(item("A")), actor, "MENU"));
    }
}
