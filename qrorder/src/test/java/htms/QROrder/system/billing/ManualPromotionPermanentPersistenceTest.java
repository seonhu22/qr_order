package htms.QROrder.system.billing;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.system.billing.repository.SubscriptionMapper;
import htms.QROrder.system.repository.ClientUserRoleMapper;
import htms.QROrder.system.service.ClientUserRoleService;
import htms.QROrder.system.service.ClientUserRoleService.Promotion;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

/** SUPER_ADMIN 수동 승격은 영구 01이라 구독 만료 회수가 내리지 않는다(정책 4C §4, A3/CX3). */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Execution(ExecutionMode.SAME_THREAD)
class ManualPromotionPermanentPersistenceTest {
    private static final Instant NOW = Instant.parse("2026-11-25T00:00:00Z");
    private BillingPersistenceSupport db;
    private ClientUserRoleService roles;
    private SubscriptionMapper subscriptions;
    private final Login system = login();

    @BeforeAll void start() throws Exception {
        db = BillingPersistenceSupport.start("mapper/system/ClientUserRoleMapper.xml",
                "mapper/system/billing/SubscriptionMapper.xml");
        subscriptions = db.sql.getMapper(SubscriptionMapper.class);
        roles = db.transactional(new ClientUserRoleService(db.sql.getMapper(ClientUserRoleMapper.class), subscriptions));
    }

    @AfterAll void stop() throws Exception {
        if (db != null) db.close();
    }

    @BeforeEach void reset() {
        db.truncateAll();
        db.plant("STORE-A");
    }

    @Test void subscriptionManagerBecomesPermanentAndSurvivesExpiry() {
        db.user("OWNER-A", "STORE-A", "01");
        db.subscription("SUB-A", "STORE-A", "OWNER-A", "ACTIVE", "Y");
        assertEquals(Promotion.MADE_PERMANENT, roles.promote("OWNER-A", system));
        assertEquals("N", db.column("sys_subscription", "role_granted_yn", "SUB-A"));
        assertEquals("SYSTEM", db.column("sys_subscription", "modify_user_id", "SUB-A"));
        assertEquals(0, expire("SUB-A"));
        assertEquals("01", db.role("OWNER-A"));
        assertEquals(Promotion.ALREADY_MANAGER, roles.promote("OWNER-A", system));
    }

    @Test void pendingOwnerPromotedManuallyStaysPermanentThroughLaterPaidAndExpiry() {
        db.user("OWNER-A", "STORE-A", "02");
        db.subscription("SUB-A", "STORE-A", "OWNER-A", "PENDING", "N");
        assertEquals(Promotion.PROMOTED, roles.promote("OWNER-A", system));
        assertEquals("01", db.role("OWNER-A"));
        // 뒤늦은 첫 결제: 02→01 UPDATE가 0행이라 role_granted_yn은 N으로 남는다.
        int granted = new TransactionTemplate(db.transactions).execute(status -> {
            subscriptions.lockOpenByOwners(java.util.List.of("OWNER-A"));
            int rows = subscriptions.grantOwnerRole("SUB-A", "WEBHOOK");
            if (rows == 1) subscriptions.markRoleGranted("SUB-A", NOW, "WEBHOOK");
            return rows;
        });
        assertEquals(0, granted);
        assertEquals("N", db.column("sys_subscription", "role_granted_yn", "SUB-A"));
        assertEquals(0, expire("SUB-A"));
        assertEquals("01", db.role("OWNER-A"));
    }

    @Test void withoutManualPromotionExpiryDoesRevokeSubscriptionRole() {
        db.user("OWNER-A", "STORE-A", "01");
        db.subscription("SUB-A", "STORE-A", "OWNER-A", "ACTIVE", "Y");
        assertEquals(1, expire("SUB-A"));
        assertEquals("02", db.role("OWNER-A"));
    }

    @Test void legacyManagerWithoutSubscriptionIsNotRewritten() {
        db.user("LEGACY", "STORE-A", "01");
        assertEquals(Promotion.ALREADY_MANAGER, roles.promote("LEGACY", system));
        assertNull(db.column("sys_user", "modify_datetime", "LEGACY"));
    }

    @Test void expiredSubscriptionIsNotTouched() {
        db.user("OWNER-A", "STORE-A", "02");
        db.subscription("OLD", "STORE-A", "OWNER-A", "EXPIRED", "Y");
        assertEquals(Promotion.PROMOTED, roles.promote("OWNER-A", system));
        assertEquals("Y", db.column("sys_subscription", "role_granted_yn", "OLD"));
        assertNull(db.column("sys_subscription", "modify_user_id", "OLD"));
    }

    /** 만료 배치와 같은 순서: 구독 잠금 → 회수 → 회수 기록. 대표 역할 UPDATE 행 수를 돌려준다. */
    private int expire(String subscriptionSysId) {
        return new TransactionTemplate(db.transactions).execute(status -> {
            db.jdbc.queryForObject("select sys_id from sys_subscription where sys_id=? for update", String.class,
                    subscriptionSysId);
            int rows = subscriptions.revokeOwnerRole(subscriptionSysId, "BATCH");
            if (rows == 1) subscriptions.markRoleRevoked(subscriptionSysId, NOW, "BATCH");
            db.jdbc.update("update sys_subscription set status='EXPIRED' where sys_id=?", subscriptionSysId);
            return rows;
        });
    }

    private static Login login() {
        var actor = new Login(); actor.setSysId("SYSTEM"); actor.setUserId("SYSTEM"); actor.setSysPlantCd("ADMIN");
        actor.setUserRole("01");
        return actor;
    }
}
