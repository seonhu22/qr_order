package htms.QROrder.system.billing;

import htms.QROrder.auth.dto.InitPwdRequest;
import htms.QROrder.auth.repository.LoginMapper;
import htms.QROrder.auth.service.LoginService;
import htms.QROrder.log.service.LogService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

/** SUPER_ADMIN 비밀번호 초기화는 sys_id로 확정한 대상만, 구독 대표는 0행 + 409(정책 4C §1, 리뷰 3). */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Execution(ExecutionMode.SAME_THREAD)
class AdminPasswordResetOwnerPersistenceTest {
    private BillingPersistenceSupport db;
    private LoginService logins;

    @BeforeAll void start() throws Exception {
        db = BillingPersistenceSupport.start("mapper/auth/LoginMapper.xml");
        logins = db.transactional(new LoginService(db.sql.getMapper(LoginMapper.class),
                new BCryptPasswordEncoder(4), mock(LogService.class)));
    }

    @AfterAll void stop() throws Exception {
        if (db != null) db.close();
    }

    @BeforeEach void reset() {
        db.truncateAll();
        db.plant("STORE-A");
        db.user("OWNER-A", "STORE-A", "02");
        db.user("STAFF-A", "STORE-A", "02");
        db.subscription("SUB-A", "STORE-A", "OWNER-A", "ACTIVE", "Y");
    }

    @Test void adminResetOfSubscriptionOwnerIs409AndWritesZeroRows() {
        String hash = db.column("sys_user", "user_password", "OWNER-A");
        var failure = assertThrows(ResponseStatusException.class, () -> logins.initPwd(request(), "OWNER-A"));
        assertEquals(409, failure.getStatusCode().value());
        assertEquals(hash, db.column("sys_user", "user_password", "OWNER-A"));
        assertEquals("N", db.column("sys_user", "init_yn", "OWNER-A"));
    }

    @Test void ownerStaysProtectedAfterSubscriptionExpires() {
        db.jdbc.update("update sys_subscription set status='EXPIRED'");
        assertEquals(409, assertThrows(ResponseStatusException.class,
                () -> logins.initPwd(request(), "OWNER-A")).getStatusCode().value());
    }

    @Test void adminResetOfOrdinaryUserChangesOnlyThatRow() {
        String ownerHash = db.column("sys_user", "user_password", "OWNER-A");
        logins.initPwd(request(), "STAFF-A");
        assertEquals("Y", db.column("sys_user", "init_yn", "STAFF-A"));
        assertNotEquals("TEST-HASH", db.column("sys_user", "user_password", "STAFF-A"));
        assertEquals(ownerHash, db.column("sys_user", "user_password", "OWNER-A"));
    }

    @Test void unknownUserIs404() {
        assertEquals(404, assertThrows(ResponseStatusException.class,
                () -> logins.initPwd(request(), "NOBODY")).getStatusCode().value());
    }

    @Test void ownerCanStillChangeOwnPassword() {
        logins.initPwdAndActive(request(), "OWNER-A");
        assertNotEquals("TEST-HASH", db.column("sys_user", "user_password", "OWNER-A"));
        assertEquals("N", db.column("sys_user", "init_yn", "OWNER-A"));
    }

    private static InitPwdRequest request() {
        var request = new InitPwdRequest();
        request.setPassword("new-password-1");
        request.setChkPassword("new-password-1");
        return request;
    }
}
