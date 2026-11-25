package htms.QROrder.system;

import htms.QROrder.audit.service.AuditService;
import htms.QROrder.system.billing.domain.Subscription;
import htms.QROrder.system.billing.repository.SubscriptionMapper;
import htms.QROrder.system.domain.AdminUser;
import htms.QROrder.system.dto.AdminUserRequest;
import htms.QROrder.system.repository.AdminUserMapper;
import htms.QROrder.system.service.AdminUserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class AdminUserServiceTest {
    private final AdminUserMapper mapper = mock(AdminUserMapper.class);
    private final AuditService auditService = mock(AuditService.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private final SubscriptionMapper subscriptions = mock(SubscriptionMapper.class);
    private final AdminUserService service = new AdminUserService(mapper, auditService, passwordEncoder, subscriptions);

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

    @Test
    void deletingOwnerOfOpenSubscriptionIs409BeforeAuditOrDelete() {
        var request = new AdminUserRequest();
        var owner = adminUser("ADMIN");
        owner.setSysId("OWNER");
        request.setDelItems(List.of(owner));
        when(subscriptions.lockOpenByOwners(List.of("OWNER"))).thenReturn(List.of(new Subscription()));

        var error = assertThrows(ResponseStatusException.class,
                () -> service.saveAdminUser(request, "admin", "ADMIN", "ADMIN_USER"));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verifyNoInteractions(mapper, auditService);
    }

    @Test
    void deletingNonOwnerLocksSubscriptionsFirstThenDeletes() {
        var request = new AdminUserRequest();
        var user = adminUser("ADMIN");
        user.setSysId("PLAIN");
        request.setDelItems(List.of(user));

        service.saveAdminUser(request, "admin", "ADMIN", "ADMIN_USER");

        var order = inOrder(subscriptions, mapper);
        order.verify(subscriptions).lockOpenByOwners(List.of("PLAIN"));
        order.verify(mapper).deleteAdminUser(request.getDelItems(), "admin", "ADMIN");
    }

    @Test
    void updatingRowOutsideAdminIs404BeforeAuditOrUpdate() {
        var request = new AdminUserRequest();
        var owner = adminUser("ADMIN");
        owner.setSysId("STORE-OWNER");
        request.setUpdateItems(List.of(owner));
        when(mapper.getOldData(request.getUpdateItems())).thenReturn(List.of());

        var error = assertThrows(ResponseStatusException.class,
                () -> service.saveAdminUser(request, "admin", "ADMIN", "ADMIN_USER"));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
        verify(mapper, never()).updateAdminUser(any(), any(), any());
        verifyNoInteractions(auditService);
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
