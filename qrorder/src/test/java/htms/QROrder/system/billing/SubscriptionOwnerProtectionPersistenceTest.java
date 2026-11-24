package htms.QROrder.system.billing;

import htms.QROrder.audit.service.AuditService;
import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.dto.ClientUserItem;
import htms.QROrder.client.dto.ClientUserRequest;
import htms.QROrder.client.repository.ClientUserMapper;
import htms.QROrder.client.service.ClientUserService;
import htms.QROrder.system.billing.repository.SubscriptionMapper;
import htms.QROrder.system.domain.AdminUser;
import htms.QROrder.system.dto.AdminUserRequest;
import htms.QROrder.system.repository.AdminUserMapper;
import htms.QROrder.system.service.AdminUserService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

/** 구독 대표는 매장 직원 관리 대상이 아니고, Admin은 진행 중 구독 대표를 지울 수 없다(정책 4C §1, A2/A2b). */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Execution(ExecutionMode.SAME_THREAD)
class SubscriptionOwnerProtectionPersistenceTest {
    private BillingPersistenceSupport db;
    private ClientUserService staff;
    private AdminUserService admins;
    private final Login manager = login("MANAGER-A", "STORE-A", "01");

    @BeforeAll void start() throws Exception {
        db = BillingPersistenceSupport.start("mapper/client/ClientUserMapper.xml",
                "mapper/system/AdminUserMapper.xml", "mapper/system/billing/SubscriptionMapper.xml");
        var encoder = new BCryptPasswordEncoder(4);
        var clientUsers = new ClientUserService(mock(AuditService.class), db.sql.getMapper(ClientUserMapper.class), encoder);
        ReflectionTestUtils.setField(clientUsers, "defaultPassword", "test-only-password");
        staff = db.transactional(clientUsers);
        var adminUsers = new AdminUserService(db.sql.getMapper(AdminUserMapper.class), mock(AuditService.class), encoder,
                db.sql.getMapper(SubscriptionMapper.class));
        ReflectionTestUtils.setField(adminUsers, "defaultPassword", "test-only-password");
        admins = db.transactional(adminUsers);
    }

    @AfterAll void stop() throws Exception {
        if (db != null) db.close();
    }

    @BeforeEach void reset() {
        db.truncateAll();
        db.plant("STORE-A");
        db.plant("ADMIN");
        db.user("OWNER-A", "STORE-A", "02");
        db.user("MANAGER-A", "STORE-A", "01");
        db.user("STAFF-A", "STORE-A", "02");
        db.subscription("SUB-A", "STORE-A", "OWNER-A", "PENDING", "N");
    }

    @Test void promotedManagerCannotResetDeleteOrRenameSubscriptionOwner() {
        String hash = db.column("sys_user", "user_password", "OWNER-A");
        assertEquals(403, status(() -> staff.resetPwd("OWNER-A", manager)));
        assertEquals(403, status(() -> staff.delClientUser(List.of(item("OWNER-A")), manager, "TEST")));
        var rename = new ClientUserRequest(); rename.setSysId("OWNER-A"); rename.setUserNm("바뀐 이름");
        assertEquals(403, status(() -> staff.updateClientUser(rename, manager, "TEST")));
        assertEquals(hash, db.column("sys_user", "user_password", "OWNER-A"));
        assertEquals("N", db.column("sys_user", "delete_yn", "OWNER-A"));
        assertEquals("OWNER-A", db.column("sys_user", "user_nm", "OWNER-A"));
        assertNull(db.column("sys_user", "modify_datetime", "OWNER-A"));
    }

    @Test void ownerStaysProtectedAfterSubscriptionExpires() {
        db.jdbc.update("update sys_subscription set status='EXPIRED'");
        assertEquals(403, status(() -> staff.resetPwd("OWNER-A", manager)));
        assertEquals(403, status(() -> staff.delClientUser(List.of(item("OWNER-A")), manager, "TEST")));
        assertEquals("N", db.column("sys_user", "delete_yn", "OWNER-A"));
    }

    @Test void ordinaryStaffAreStillManagedNormally() {
        staff.resetPwd("STAFF-A", manager);
        assertEquals("Y", db.column("sys_user", "init_yn", "STAFF-A"));
        staff.delClientUser(List.of(item("STAFF-A")), manager, "TEST");
        assertEquals("Y", db.column("sys_user", "delete_yn", "STAFF-A"));
    }

    @Test void mixedBatchWithOwnerDeletesNobody() {
        assertEquals(403, status(() -> staff.delClientUser(List.of(item("OWNER-A"), item("STAFF-A")), manager, "TEST")));
        assertEquals(0, db.jdbc.queryForObject("select count(*) from sys_user where delete_yn='Y'", Integer.class));
    }

    @Test void adminCannotDeleteOwnerOfOpenSubscriptionAndNothingIsWritten() {
        for (var status : List.of("PENDING", "ACTIVE", "PAST_DUE", "CANCEL_SCHEDULED")) {
            db.jdbc.update("update sys_subscription set status=?", status);
            var failure = assertThrows(ResponseStatusException.class, () -> admins.saveAdminUser(delete("OWNER-A"),
                    "system", "ADMIN", "ADMIN_USER"), status);
            assertEquals(409, failure.getStatusCode().value(), status);
            assertEquals("N", db.column("sys_user", "delete_yn", "OWNER-A"), status);
        }
    }

    @Test void adminDeleteOfOwnerIsAllowedOnceSubscriptionExpired() {
        db.jdbc.update("update sys_subscription set status='EXPIRED'");
        admins.saveAdminUser(delete("OWNER-A"), "system", "ADMIN", "ADMIN_USER");
        assertEquals("Y", db.column("sys_user", "delete_yn", "OWNER-A"));
    }

    @Test void adminDeleteOfNonOwnerStillWorks() {
        admins.saveAdminUser(delete("STAFF-A"), "system", "ADMIN", "ADMIN_USER");
        assertEquals("Y", db.column("sys_user", "delete_yn", "STAFF-A"));
    }

    private static AdminUserRequest delete(String sysId) {
        var user = new AdminUser(); user.setSysId(sysId);
        var request = new AdminUserRequest(); request.setDelItems(List.of(user));
        return request;
    }

    private static int status(Runnable action) {
        return assertThrows(ResponseStatusException.class, action::run).getStatusCode().value();
    }

    private static ClientUserItem item(String sysId) {
        var item = new ClientUserItem(); item.setSysId(sysId); return item;
    }

    private static Login login(String id, String store, String role) {
        var actor = new Login(); actor.setSysId(id); actor.setUserId(id); actor.setSysPlantCd(store); actor.setUserRole(role);
        return actor;
    }
}
