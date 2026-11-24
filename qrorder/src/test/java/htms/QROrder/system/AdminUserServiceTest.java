package htms.QROrder.system;

import htms.QROrder.audit.service.AuditService;
import htms.QROrder.system.domain.AdminUser;
import htms.QROrder.system.dto.AdminUserRequest;
import htms.QROrder.system.repository.AdminUserMapper;
import htms.QROrder.system.service.AdminUserService;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

class AdminUserServiceTest {
    private final AdminUserMapper mapper = mock(AdminUserMapper.class);
    private final AuditService auditService = mock(AuditService.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private final AdminUserService service = new AdminUserService(mapper, auditService, passwordEncoder);

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"DEMO01", "admin"})
    void rejectsNewUserOutsideAdminBeforeAnyWrites(String plantCd) {
        var request = new AdminUserRequest();
        request.setNewItems(List.of(adminUser(plantCd)));

        assertRejected(request);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"DEMO01", "admin"})
    void rejectsUpdateOutsideAdminBeforeSavingValidNewUser(String plantCd) {
        var request = new AdminUserRequest();
        request.setNewItems(List.of(adminUser("ADMIN")));
        request.setUpdateItems(List.of(adminUser(plantCd)));

        assertRejected(request);
    }

    private void assertRejected(AdminUserRequest request) {
        var error = assertThrows(ResponseStatusException.class,
                () -> service.saveAdminUser(request, "admin", "ADMIN", "ADMIN_USER"));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verifyNoInteractions(mapper, auditService, passwordEncoder);
    }

    private static AdminUser adminUser(String plantCd) {
        var user = new AdminUser();
        user.setPlantCd(plantCd);
        return user;
    }
}
