package htms.QROrder.auth;

import htms.QROrder.auth.dto.SignUpRequest;
import htms.QROrder.auth.repository.SignUpMapper;
import htms.QROrder.auth.service.SignUpService;
import htms.QROrder.common.exception.DuplicateException;
import htms.QROrder.common.exception.GlobalExceptionHandler;
import htms.QROrder.system.billing.repository.SubscriptionMapper;
import org.springframework.dao.DataAccessException;
import org.springframework.transaction.support.TransactionTemplate;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.mybatis.spring.transaction.SpringManagedTransactionFactory;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionInterceptor;

import java.time.Duration;
import java.time.LocalDate;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

/** 가입 쓰기를 실제 PostgreSQL에서 확인한다(정책 4C §1). */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Execution(ExecutionMode.SAME_THREAD)
class SignUpPersistenceTest {
    private LocalPostgresTestSupport database;
    private JdbcTemplate jdbc;
    private SignUpService signUp;
    private DataSourceTransactionManager transactions;
    private static final String APPLY = "2026-11-25-sys-plant-active-unique.sql";
    private static final String ROLLBACK = "2026-11-25-sys-plant-active-unique-rollback.sql";
    private static final String DRY_RUN = "2026-11-25-sys-plant-active-unique-dry-run.sql";

    @BeforeAll void startIndependentDatabase() throws Exception {
        database = LocalPostgresTestSupport.start();
        try {
            var source = database.dataSource("public");
            jdbc = new JdbcTemplate(source);
            TeamSchemaFixture.createCoreTables(jdbc);
            jdbc.execute(TeamSchemaFixture.migration(APPLY));
            jdbc.execute(TeamSchemaFixture.migration("2026-11-25-subscription-billing.sql"));
            Configuration configuration = new Configuration();
            configuration.setMapUnderscoreToCamelCase(true);
            var factory = new SqlSessionFactoryBean();
            factory.setDataSource(source);
            factory.setConfiguration(configuration);
            factory.setTransactionFactory(new SpringManagedTransactionFactory());
            factory.setMapperLocations(new ClassPathResource("mapper/auth/SignUpMapper.xml"),
                    new ClassPathResource("mapper/system/billing/SubscriptionMapper.xml"));
            var sql = new SqlSessionTemplate(factory.getObject());
            transactions = new DataSourceTransactionManager(source);
            ProxyFactory proxy = new ProxyFactory(new SignUpService(sql.getMapper(SignUpMapper.class),
                    sql.getMapper(SubscriptionMapper.class), new BCryptPasswordEncoder(4)));
            proxy.setProxyTargetClass(true);
            proxy.addAdvice(new TransactionInterceptor(transactions, new AnnotationTransactionAttributeSource()));
            signUp = (SignUpService) proxy.getProxy();
        } catch (Exception failure) {
            database.close();
            throw failure;
        }
    }

    @AfterAll void stopOnlyCreatedCluster() throws Exception {
        if (database != null) database.close();
    }

    @BeforeEach void resetFixture() {
        jdbc.execute("truncate table sys_subscription_invoice, sys_subscription, sys_user, sys_plant");
    }

    @Test void signupWritesOnePlantAndOneUser() {
        signUp.newUser(request("1234567890", "owner1"));
        assertEquals(1, count("sys_plant"));
        assertEquals(1, count("sys_user"));
    }

    @Test void selfSignupOwnerStartsAs02WithOnePendingSubscription() {
        signUp.newUser(request("123-45-67890", "owner1"));
        var user = jdbc.queryForMap("select sys_id, user_role, plant_cd from sys_user");
        assertEquals("02", user.get("user_role"));
        assertEquals("1234567890", user.get("plant_cd"));
        var subscription = jdbc.queryForMap("select * from sys_subscription");
        assertEquals(1, count("sys_subscription"));
        assertEquals("PENDING", subscription.get("status"));
        assertEquals("1234567890", subscription.get("plant_cd"));
        assertEquals(user.get("sys_id"), subscription.get("owner_user_sys_id"));
        assertEquals("N", subscription.get("role_granted_yn"));
        assertNull(subscription.get("plan_sys_id"));
        assertNull(subscription.get("paid_through_at"));
        assertEquals("owner1", subscription.get("insert_user_id"));
    }

    @Test void leftoverOpenSubscriptionBlocksSignupWith409() {
        jdbc.update("""
                insert into sys_subscription(sys_id, plant_cd, owner_user_sys_id, status, insert_user_id, insert_datetime)
                values ('ORPHAN', '1234567890', 'GONE', 'PENDING', 'T', now())
                """);
        assertThrows(DuplicateException.class, () -> signUp.newUser(request("1234567890", "owner1")));
        assertEquals(0, count("sys_plant"));
        assertEquals(0, count("sys_user"));
        assertEquals(1, count("sys_subscription"));
    }

    @Test void userInsertFailureLeavesNoRows() {
        // sys_user.email은 200자, 매장/구독에는 email이 없어 마지막 사용자 INSERT만 실패한다.
        var request = request("1234567890", "owner1");
        request.setEmail("e".repeat(201));
        assertThrows(org.springframework.dao.DataAccessException.class, () -> signUp.newUser(request));
        assertEquals(0, count("sys_plant"));
        assertEquals(0, count("sys_user"));
        assertEquals(0, count("sys_subscription"));
    }

    @Test void sameBusinessNumberSignupIs409AndKeepsOneStore() {
        signUp.newUser(request("1234567890", "owner1"));
        var failure = assertThrows(DuplicateException.class, () -> signUp.newUser(request("123-45-67890", "owner2")));
        assertEquals(409, new GlobalExceptionHandler().handleDuplicatePlantException(failure).getStatusCode().value());
        assertEquals(1, count("sys_plant"));
        assertEquals(1, count("sys_user"));
        assertEquals(1, count("sys_subscription"));
    }

    @Test void deletedStoreOrEndedSubscriptionStillBlocksSignupAndKeepsOwner() {
        signUp.newUser(request("1234567890", "owner1"));
        String owner = jdbc.queryForObject("select sys_id from sys_user where user_id='owner1'", String.class);
        jdbc.update("update sys_plant set delete_yn='Y'");
        assertThrows(DuplicateException.class, () -> signUp.newUser(request("1234567890", "owner2")));
        jdbc.update("update sys_subscription set status='EXPIRED'");
        // 삭제된 매장 + 끝난 구독도 이력이므로 다른 계정은 같은 번호의 대표가 되지 못한다.
        assertThrows(DuplicateException.class, () -> signUp.newUser(request("1234567890", "owner2")));
        assertEquals(1, count("sys_plant"));
        assertEquals(1, count("sys_user"));
        assertEquals(1, count("sys_subscription"));
        assertEquals(owner, jdbc.queryForObject("select owner_user_sys_id from sys_subscription", String.class));
    }

    @Test void subscriptionHistoryWithoutStoreRowBlocksSignup() {
        jdbc.update("""
                insert into sys_subscription(sys_id, plant_cd, owner_user_sys_id, status, insert_user_id, insert_datetime)
                values ('OLD', '1234567890', 'GONE', 'EXPIRED', 'T', now())
                """);
        assertThrows(DuplicateException.class, () -> signUp.newUser(request("1234567890", "owner1")));
        assertEquals(0, count("sys_plant"));
        assertEquals(0, count("sys_user"));
    }

    @Test void concurrentSameNumberSignupWaitsOnIndexAndLoserGets409() throws Exception {
        var executor = Executors.newFixedThreadPool(2);
        var firstInserted = new CountDownLatch(1);
        var releaseFirst = new CountDownLatch(1);
        try {
            Future<?> winner = executor.submit(() -> new TransactionTemplate(transactions).executeWithoutResult(status -> {
                signUp.newUser(request("1234567890", "owner1"));
                firstInserted.countDown();
                try { assertTrue(releaseFirst.await(10, TimeUnit.SECONDS)); }
                catch (InterruptedException interrupted) { throw new AssertionError(interrupted); }
            }));
            assertTrue(firstInserted.await(5, TimeUnit.SECONDS));
            Future<Throwable> loser = executor.submit(() -> {
                try { signUp.newUser(request("1234567890", "owner2")); return null; }
                catch (RuntimeException rejected) { return rejected; }
            });
            try {
                assertTrue(waitForLockWait(), "second signup did not wait on the unique index");
                assertFalse(loser.isDone());
            } finally { releaseFirst.countDown(); }
            winner.get(10, TimeUnit.SECONDS);
            assertInstanceOf(DuplicateException.class, loser.get(10, TimeUnit.SECONDS));
        } finally {
            releaseFirst.countDown();
            executor.shutdownNow();
        }
        assertEquals(1, count("sys_plant"));
        assertEquals(1, count("sys_user"));
        assertEquals(1, count("sys_subscription"));
    }

    @Test void migrationBlocksReapplyRollsBackAndRefusesDuplicates() throws Exception {
        assertThrows(DataAccessException.class, () -> jdbc.execute(TeamSchemaFixture.migration(APPLY)));
        assertThrows(DataAccessException.class, () -> jdbc.execute(TeamSchemaFixture.migration(DRY_RUN)));
        jdbc.execute(TeamSchemaFixture.migration(ROLLBACK));
        assertNull(jdbc.queryForObject("select to_regclass('public.sys_plant_plant_cd_active_uk')::text", String.class));
        jdbc.execute(TeamSchemaFixture.migration(DRY_RUN));
        try {
            jdbc.update("""
                    insert into sys_plant(sys_id, plant_cd, plant_nm, use_yn, delete_yn, insert_datetime, insert_user_id)
                    values ('P1','DUP','a','Y','N',now(),'T'), ('P2','DUP','b','Y','N',now(),'T')
                    """);
            assertThrows(DataAccessException.class, () -> jdbc.execute(TeamSchemaFixture.migration(APPLY)));
        } finally {
            jdbc.execute("truncate table sys_plant");
            jdbc.execute(TeamSchemaFixture.migration(APPLY));
        }
        assertNotNull(jdbc.queryForObject("select to_regclass('public.sys_plant_plant_cd_active_uk')::text", String.class));
    }

    private boolean waitForLockWait() throws InterruptedException {
        long deadline = System.nanoTime() + Duration.ofSeconds(5).toNanos();
        while (System.nanoTime() < deadline) {
            Integer waiting = jdbc.queryForObject("""
                    select count(*) from pg_stat_activity where datname=current_database()
                    and application_name='qr-auth-persistence' and wait_event_type='Lock'
                    """, Integer.class);
            if (waiting != null && waiting > 0) return true;
            Thread.sleep(25);
        }
        return false;
    }

    private int count(String table) {
        return jdbc.queryForObject("select count(*) from " + table, Integer.class);
    }

    static SignUpRequest request(String businessNumber, String userId) {
        var request = new SignUpRequest();
        request.setBusinessRegiNum(businessNumber);
        request.setBusinessRegiDate(LocalDate.of(2020, 1, 2));
        request.setUserNm("대표");
        request.setPlantNm("매장");
        request.setUserId(userId);
        request.setPassword("pw-1");
        request.setPasswordChk("pw-1");
        request.setEmail("owner@example.test");
        return request;
    }
}
