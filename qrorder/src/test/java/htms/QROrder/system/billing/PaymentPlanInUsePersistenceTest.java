package htms.QROrder.system.billing;

import htms.QROrder.audit.service.AuditService;
import htms.QROrder.system.domain.Payment;
import htms.QROrder.system.repository.PaymentMapper;
import htms.QROrder.system.service.PaymentService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

/** 정책 4C §5: 진행 중 구독이 쓰는 플랜은 금액/단위/기간 수정과 삭제가 409, 이름 수정과 만료된 구독의 플랜은 허용. */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Execution(ExecutionMode.SAME_THREAD)
class PaymentPlanInUsePersistenceTest {
    private BillingPersistenceSupport db;
    private PaymentService service;

    @BeforeAll void start() throws Exception {
        db = BillingPersistenceSupport.start("mapper/system/PaymentMapper.xml");
        db.jdbc.execute("create table if not exists sys_plant_pay_info (sys_id varchar(26), payment_cd varchar(50))");
        service = new PaymentService(db.sql.getMapper(PaymentMapper.class), mock(AuditService.class));
    }

    @AfterAll void stop() throws Exception {
        if (db != null) db.close();
    }

    @BeforeEach void reset() {
        db.truncateAll();
        db.jdbc.execute("truncate table sys_plant_pay_info");
        db.plant("STORE-A");
        db.user("OWNER-A", "STORE-A", "02");
        db.jdbc.update("""
                insert into sys_payment(sys_id, payment_cd, payment_nm, payment_fee, payment_fee_unit,
                  license_valid_month, insert_user_id, insert_datetime, sys_plant_cd, delete_yn)
                values ('PLAN-1', 'BASIC_MONTHLY', '기본 월간', 29000, 'KRW', 1, 'T', now(), 'ADMIN', 'N')
                """);
        db.jdbc.update("""
                insert into sys_subscription(sys_id, plant_cd, owner_user_sys_id, plan_sys_id, amount, currency,
                  period_month, status, role_granted_yn, insert_user_id, insert_datetime)
                values ('SUB-A', 'STORE-A', 'OWNER-A', 'PLAN-1', 29000, 'KRW', 1, 'ACTIVE', 'Y', 'T', now())
                """);
    }

    private static Payment plan(int fee, String unit, int months, String name) {
        var payment = new Payment();
        payment.setSysId("PLAN-1");
        payment.setPaymentCd("BASIC_MONTHLY");
        payment.setPaymentNm(name);
        payment.setPaymentFee(fee);
        payment.setPaymentFeeUnit(unit);
        payment.setLicenseValidMonth(months);
        return payment;
    }

    private Map<String, Object> row() {
        return db.jdbc.queryForMap("select payment_nm, payment_fee, payment_fee_unit, license_valid_month, delete_yn"
                + " from sys_payment where sys_id = 'PLAN-1'");
    }

    private static void assertConflict(Runnable call) {
        var error = assertThrows(ResponseStatusException.class, call::run);
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
    }

    @Test void pricingUpdateAndDeleteOfPlanInLiveSubscriptionAre409() {
        var before = row();
        assertConflict(() -> service.updatePayment(plan(39000, "KRW", 1, "기본 월간"), "ADMIN-1", "ADMIN", "M"));
        assertConflict(() -> service.updatePayment(plan(29000, "KRW", 12, "기본 월간"), "ADMIN-1", "ADMIN", "M"));
        assertConflict(() -> service.updatePayment(plan(29000, "USD", 1, "기본 월간"), "ADMIN-1", "ADMIN", "M"));
        assertConflict(() -> service.delPayment(List.of(plan(29000, "KRW", 1, "기본 월간")), "ADMIN-1", "ADMIN", "M"));
        assertEquals(before, row());
    }

    @Test void pendingSubscriptionAlsoCountsAsInUse() {
        db.jdbc.update("update sys_subscription set status = 'PENDING'");
        assertConflict(() -> service.delPayment(List.of(plan(29000, "KRW", 1, "기본 월간")), "ADMIN-1", "ADMIN", "M"));
        assertEquals("N", row().get("delete_yn"));
    }

    @Test void nameOnlyUpdateIsAllowed() {
        service.updatePayment(plan(29000, "KRW", 1, "기본 월간(새 이름)"), "ADMIN-1", "ADMIN", "M");
        assertEquals("기본 월간(새 이름)", row().get("payment_nm"));
        assertEquals(29000, row().get("payment_fee"));
    }

    @Test void planOfExpiredSubscriptionOnlyCanBeChangedAndDeleted() {
        db.jdbc.update("update sys_subscription set status = 'EXPIRED'");
        service.updatePayment(plan(39000, "KRW", 1, "기본 월간"), "ADMIN-1", "ADMIN", "M");
        assertEquals(39000, row().get("payment_fee"));
        service.delPayment(List.of(plan(39000, "KRW", 1, "기본 월간")), "ADMIN-1", "ADMIN", "M");
        assertEquals("Y", row().get("delete_yn"));
    }
}
