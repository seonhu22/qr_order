package htms.QROrder.system;

import htms.QROrder.audit.service.AuditService;
import htms.QROrder.auth.LocalPostgresTestSupport;
import htms.QROrder.auth.domain.Login;
import htms.QROrder.auth.repository.LoginMapper;
import htms.QROrder.auth.dto.LoginRequest;
import htms.QROrder.auth.service.LoginService;
import htms.QROrder.auth.controller.LoginController;
import htms.QROrder.log.repository.LogMapper;
import htms.QROrder.log.service.LogService;
import htms.QROrder.client.dto.ClientUserItem;
import htms.QROrder.client.dto.ClientUserRequest;
import htms.QROrder.client.repository.ClientUserMapper;
import htms.QROrder.client.service.ClientUserService;
import htms.QROrder.system.repository.ClientUserRoleMapper;
import htms.QROrder.system.service.ClientUserRoleService;
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
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionInterceptor;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Execution(ExecutionMode.SAME_THREAD)
class ClientUserPromotionPersistenceTest {
    private LocalPostgresTestSupport database;
    private JdbcTemplate jdbc;
    private DataSourceTransactionManager transactions;
    private ClientUserService users;
    private ClientUserRoleService roles;
    private LoginMapper logins;
    private LoginController loginController;
    private final Login manager = actor("MANAGER", "STORE-A", "01");
    private final Login system = actor("SYSTEM", "ADMIN", "01");

    @BeforeAll void startIndependentDatabase() throws Exception {
        database = LocalPostgresTestSupport.start();
        try {
            var source = database.dataSource();
            jdbc = new JdbcTemplate(source);
            // Minimal independent policy fixture, not a production-schema compatibility assertion.
            jdbc.execute("create schema qa_auth");
            jdbc.execute("""
                    create table qa_auth.sys_plant (
                      plant_cd varchar(50) primary key, plant_nm varchar(50) not null,
                      delete_yn varchar(1) not null default 'N');
                    create table qa_auth.sys_user (
                      sys_id varchar(36) primary key, user_id varchar(50) not null unique,
                      user_nm varchar(50) not null, user_password varchar(200) not null,
                      plant_cd varchar(50) references qa_auth.sys_plant,
                      sys_plant_cd varchar(50) not null references qa_auth.sys_plant,
                      user_role varchar(2) not null check (user_role in ('01','02')),
                      init_yn varchar(1) not null default 'N', delete_yn varchar(1) not null default 'N',
                      password_fail_cnt integer not null default 0, email_valid_yn varchar(1) not null default 'Y',
                      insert_user_id varchar(50) not null, insert_datetime timestamp not null default now(),
                      modify_user_id varchar(50), modify_datetime timestamp);
                    create table qa_auth.sys_login_log_master (
                      sys_id varchar(36) primary key, user_id varchar(50) not null,
                      ip_address varchar(100), login_datetime timestamp not null,
                      logout_datetime timestamp, login_result varchar(1) not null,
                      fail_reason text, sys_plant_cd varchar(50) not null);
                    create view public.sys_user as select * from qa_auth.sys_user;
                    create view public.sys_plant as select * from qa_auth.sys_plant;
                    """);
            Configuration configuration = new Configuration();
            configuration.setMapUnderscoreToCamelCase(true);
            var factory = new SqlSessionFactoryBean();
            factory.setDataSource(source);
            factory.setConfiguration(configuration);
            factory.setTypeAliases(Login.class);
            factory.setTransactionFactory(new SpringManagedTransactionFactory());
            factory.setMapperLocations(new ClassPathResource("mapper/client/ClientUserMapper.xml"),
                    new ClassPathResource("mapper/system/ClientUserRoleMapper.xml"),
                    new ClassPathResource("mapper/auth/LoginMapper.xml"),
                    new ClassPathResource("mapper/log/Log.xml"));
            var sql = new SqlSessionTemplate(factory.getObject());
            transactions = new DataSourceTransactionManager(source);
            var userService = new ClientUserService(mock(AuditService.class), sql.getMapper(ClientUserMapper.class),
                    new BCryptPasswordEncoder(4));
            ReflectionTestUtils.setField(userService, "defaultPassword", "test-only-password");
            users = transactional(userService);
            roles = transactional(new ClientUserRoleService(sql.getMapper(ClientUserRoleMapper.class)));
            logins = sql.getMapper(LoginMapper.class);
            var loginService = new LoginService(logins, new BCryptPasswordEncoder(4),
                    transactional(new LogService(sql.getMapper(LogMapper.class))));
            loginController = new LoginController(transactional(loginService));
        } catch (Exception failure) {
            database.close();
            throw failure;
        }
    }

    @AfterAll void stopOnlyCreatedCluster() throws Exception {
        if (database != null) database.close();
    }

    @BeforeEach void resetFixture() {
        jdbc.execute("truncate table qa_auth.sys_login_log_master, qa_auth.sys_user, qa_auth.sys_plant cascade");
        jdbc.update("insert into qa_auth.sys_plant(plant_cd, plant_nm) values ('STORE-A','A'),('STORE-B','B'),('ADMIN','System')");
        insert("MANAGER", "STORE-A", "01");
        insert("SYSTEM", "ADMIN", "01");
        insert("STAFF-A", "STORE-A", "02");
        insert("STAFF-B", "STORE-B", "02");
    }

    @SuppressWarnings("unchecked")
    private <T> T transactional(T target) {
        ProxyFactory proxy = new ProxyFactory(target);
        proxy.setProxyTargetClass(true);
        proxy.addAdvice(new TransactionInterceptor(transactions, new AnnotationTransactionAttributeSource()));
        return (T) proxy.getProxy();
    }

    @Test void createsStaffAndChangesOnlyNameWithoutMovingOrPromoting() {
        var request = new ClientUserRequest();
        request.setUserId("new-staff"); request.setUserNm("신규 직원");
        users.newClientUser(request, manager, "TEST");
        assertEquals("02", jdbc.queryForObject("select user_role from sys_user where sys_id=?", String.class, request.getSysId()));
        assertEquals("STORE-A", jdbc.queryForObject("select plant_cd from sys_user where sys_id=?", String.class, request.getSysId()));
        assertEquals("Y", jdbc.queryForObject("select init_yn from sys_user where sys_id=?", String.class, request.getSysId()));
        var edit = new ClientUserRequest(); edit.setSysId(request.getSysId()); edit.setUserNm("수정 이름");
        users.updateClientUser(edit, manager, "TEST");
        assertEquals("수정 이름", jdbc.queryForObject("select user_nm from sys_user where sys_id=?", String.class, request.getSysId()));
        assertEquals("02", logins.findForAuthorization(request.getSysId()).getUserRole());
        assertEquals("STORE-A", logins.findForAuthorization(request.getSysId()).getSysPlantCd());
    }

    @Test void newStaffCanLoginAndWriteStoreScopedSuccessLog() {
        var request = registerLoginStaff();
        var session = new MockHttpSession();
        var response = login(request.getUserId(), "test-only-password", session);
        assertEquals(200, response.getStatusCode().value());
        var loggedIn = (Login) session.getAttribute("loginUser");
        assertEquals("STORE-A", loggedIn.getSysPlantCd());
        assertEquals("02", loggedIn.getUserRole());
        assertEquals("Y", loggedIn.getInitYn());
        assertEquals("STAFF", session.getAttribute("role"));
        assertEquals("STORE-A", jdbc.queryForObject("select sys_plant_cd from sys_login_log_master", String.class));
        assertEquals("P", jdbc.queryForObject("select login_result from sys_login_log_master", String.class));
    }

    @Test void wrongStaffPasswordReturns401AndCommitsFailureLogAndCounter() {
        var request = registerLoginStaff();
        var session = new MockHttpSession();
        var response = login(request.getUserId(), "wrong-case-password", session);
        assertEquals(401, response.getStatusCode().value());
        assertNull(session.getAttribute("loginUser"));
        assertEquals(1, jdbc.queryForObject("select password_fail_cnt from sys_user where sys_id=?", Integer.class, request.getSysId()));
        assertEquals("STORE-A", jdbc.queryForObject("select sys_plant_cd from sys_login_log_master", String.class));
        assertEquals("F", jdbc.queryForObject("select login_result from sys_login_log_master", String.class));
    }

    @Test void legacyMissingStoreReturns401WithoutNullAuditInsertOrAuthentication() {
        var request = registerLoginStaff();
        jdbc.update("update sys_user set plant_cd=null where sys_id=?", request.getSysId());
        var session = new MockHttpSession();
        var response = login(request.getUserId(), "test-only-password", session);
        assertEquals(401, response.getStatusCode().value());
        assertTrue(response.getBody().getMessage().contains("매장"));
        assertNull(session.getAttribute("loginUser"));
        assertEquals(0, jdbc.queryForObject("select count(*) from sys_login_log_master", Integer.class));
        assertEquals(0, jdbc.queryForObject("select password_fail_cnt from sys_user where sys_id=?", Integer.class, request.getSysId()));
    }

    @Test void repairingConfirmedCanonicalStoreRestoresListAndLoginWithoutPasswordChange() {
        var request = registerLoginStaff();
        String hash = jdbc.queryForObject("select user_password from sys_user where sys_id=?", String.class, request.getSysId());
        jdbc.update("update sys_user set plant_cd=null where sys_id=?", request.getSysId());
        assertTrue(users.getClientUser(null, manager).stream().noneMatch(row -> request.getSysId().equals(row.getSysId())));
        assertEquals(1, jdbc.update("""
                update sys_user set plant_cd=? where sys_id=? and user_id=?
                and user_role='02' and delete_yn='N' and sys_plant_cd=?
                and nullif(btrim(plant_cd),'') is null
                """, "STORE-A", request.getSysId(), request.getUserId(), "STORE-A"));
        assertTrue(users.getClientUser(null, manager).stream().anyMatch(row -> request.getSysId().equals(row.getSysId())));
        assertEquals(hash, jdbc.queryForObject("select user_password from sys_user where sys_id=?", String.class, request.getSysId()));
        assertEquals(200, login(request.getUserId(), "test-only-password", new MockHttpSession()).getStatusCode().value());
    }

    private ClientUserRequest registerLoginStaff() {
        var request = new ClientUserRequest(); request.setUserId("login-staff"); request.setUserNm("AUTO-QA staff");
        users.newClientUser(request, manager, "TEST");
        return request;
    }

    @Test void exactRepairScriptDryRunRollsBackAndApplyRestoresBothStaffLogins() throws Exception {
        var first = registerRepairStaff("autoTester21");
        var second = registerRepairStaff("autoTester22");
        String script = repairScript(first, second, "STORE-A");
        jdbc.execute(script);
        assertEquals(2, jdbc.queryForObject("select count(*) from sys_user where plant_cd is null", Integer.class));
        jdbc.execute(script.stripTrailing().replaceAll("ROLLBACK;$", "COMMIT;"));
        assertEquals(0, jdbc.queryForObject("select count(*) from sys_user where plant_cd is null", Integer.class));
        for (var staff : List.of(first, second)) {
            assertEquals("02", jdbc.queryForObject("select user_role from sys_user where sys_id=?", String.class, staff.getSysId()));
            assertEquals("MANAGER", jdbc.queryForObject("select modify_user_id from sys_user where sys_id=?", String.class, staff.getSysId()));
            assertEquals(200, login(staff.getUserId(), "test-only-password", new MockHttpSession()).getStatusCode().value());
        }
    }

    @Test void exactRepairScriptRejectsUnexpectedStoreWithoutChangingRows() throws Exception {
        var first = registerRepairStaff("autoTester21");
        var second = registerRepairStaff("autoTester22");
        assertThrows(org.springframework.dao.DataAccessException.class,
                () -> jdbc.execute(repairScript(first, second, "STORE-B")));
        assertEquals(2, jdbc.queryForObject("select count(*) from sys_user where plant_cd is null", Integer.class));
    }

    private ClientUserRequest registerRepairStaff(String id) {
        var request = new ClientUserRequest(); request.setUserId(id); request.setUserNm("AUTO-QA repair");
        users.newClientUser(request, manager, "TEST");
        jdbc.update("update sys_user set plant_cd=null where sys_id=?", request.getSysId());
        return request;
    }

    private String repairScript(ClientUserRequest first, ClientUserRequest second, String store) throws Exception {
        return java.nio.file.Files.readString(java.nio.file.Path.of("..", "docs", "qa", "scripts", "2026-11-17-staff-store-binding-repair.sql"))
                .replace("__EXPECTED_STORE__", store).replace("__ACTOR_ID__", "MANAGER")
                .replace("__STAFF_21_SYS_ID__", first.getSysId()).replace("__STAFF_22_SYS_ID__", second.getSysId());
    }

    private org.springframework.http.ResponseEntity<htms.QROrder.common.dto.CommonResponse> login(
            String userId, String password, MockHttpSession session) {
        var request = new LoginRequest(); request.setUserId(userId); request.setUserPassword(password);
        return loginController.login(request, new MockHttpServletRequest(), session);
    }

    @Test void rejectsCrossStoreBatchWithoutDeletingValidStaff() {
        var failure = assertThrows(ResponseStatusException.class,
                () -> users.delClientUser(List.of(item("STAFF-A"), item("STAFF-B")), manager, "TEST"));
        assertEquals(403, failure.getStatusCode().value());
        assertEquals(0, jdbc.queryForObject("select count(*) from sys_user where delete_yn='Y'", Integer.class));
    }

    @Test void rollsBackAnAlreadyWrittenRowWhenBatchUpdateCountDoesNotMatch() {
        insert("STAFF-A2", "STORE-A", "02");
        jdbc.execute("""
                create function qa_auth.skip_one_delete() returns trigger language plpgsql as $$
                begin
                  if old.sys_id = 'STAFF-A2' and new.delete_yn = 'Y' then return null; end if;
                  return new;
                end $$;
                create trigger skip_one_delete before update on qa_auth.sys_user
                  for each row execute function qa_auth.skip_one_delete();
                """);
        try {
            var failure = assertThrows(ResponseStatusException.class,
                    () -> users.delClientUser(List.of(item("STAFF-A"), item("STAFF-A2")), manager, "TEST"));
            assertEquals(409, failure.getStatusCode().value());
            assertEquals(0, jdbc.queryForObject("select count(*) from sys_user where delete_yn='Y' or modify_datetime is not null", Integer.class));
        } finally {
            jdbc.execute("drop trigger skip_one_delete on qa_auth.sys_user");
            jdbc.execute("drop function qa_auth.skip_one_delete()");
        }
    }

    @Test void promotesAndRepeatsWithoutChangingAuditTimestamp() {
        roles.promote("STAFF-A", system);
        Timestamp changedAt = jdbc.queryForObject("select modify_datetime from sys_user where sys_id='STAFF-A'", Timestamp.class);
        assertNotNull(changedAt);
        assertEquals("01", logins.findForAuthorization("STAFF-A").getUserRole());
        roles.promote("STAFF-A", system);
        assertEquals(changedAt, jdbc.queryForObject("select modify_datetime from sys_user where sys_id='STAFF-A'", Timestamp.class));
        assertEquals("SYSTEM", jdbc.queryForObject("select modify_user_id from sys_user where sys_id='STAFF-A'", String.class));
    }

    @Test void promotionWinsAndWaitingDeleteCannotDeleteManager() throws Exception {
        Throwable rejected = race(() -> roles.promote("STAFF-A", system),
                () -> users.delClientUser(List.of(item("STAFF-A")), manager, "TEST"));
        assertEquals(403, assertInstanceOf(ResponseStatusException.class, rejected).getStatusCode().value());
        assertEquals("01", jdbc.queryForObject("select user_role from sys_user where sys_id='STAFF-A'", String.class));
        assertEquals("N", jdbc.queryForObject("select delete_yn from sys_user where sys_id='STAFF-A'", String.class));
    }

    @Test void deletionWinsAndWaitingPromotionCannotPromoteDeletedUser() throws Exception {
        Throwable rejected = race(() -> users.delClientUser(List.of(item("STAFF-A")), manager, "TEST"),
                () -> roles.promote("STAFF-A", system));
        assertEquals(404, assertInstanceOf(ResponseStatusException.class, rejected).getStatusCode().value());
        assertEquals("02", jdbc.queryForObject("select user_role from sys_user where sys_id='STAFF-A'", String.class));
        assertEquals("Y", jdbc.queryForObject("select delete_yn from sys_user where sys_id='STAFF-A'", String.class));
    }

    private Throwable race(Runnable first, Runnable second) throws Exception {
        var executor = Executors.newFixedThreadPool(2);
        var firstUpdated = new CountDownLatch(1);
        var releaseFirst = new CountDownLatch(1);
        try {
            Future<?> winner = executor.submit(() -> new TransactionTemplate(transactions).executeWithoutResult(status -> {
                first.run(); firstUpdated.countDown();
                try { if (!releaseFirst.await(10, TimeUnit.SECONDS)) throw new AssertionError("First transaction release timed out"); }
                catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); throw new AssertionError(interrupted); }
            }));
            assertTrue(firstUpdated.await(5, TimeUnit.SECONDS), "First mutation did not complete");
            Future<Throwable> loser = executor.submit(() -> {
                try { second.run(); return null; } catch (RuntimeException rejected) { return rejected; }
            });
            try {
                long deadline = System.nanoTime() + Duration.ofSeconds(5).toNanos();
                boolean observedLock = false;
                while (System.nanoTime() < deadline) {
                    Integer waiting = jdbc.queryForObject("""
                            select count(*) from pg_stat_activity where datname=current_database()
                            and application_name='qr-auth-persistence' and wait_event_type='Lock'
                            """, Integer.class);
                    if (waiting != null && waiting > 0) { observedLock = true; break; }
                    Thread.sleep(25);
                }
                assertTrue(observedLock, "No real PostgreSQL row-lock wait observed");
                assertFalse(loser.isDone());
            } finally { releaseFirst.countDown(); }
            winner.get(10, TimeUnit.SECONDS);
            return loser.get(10, TimeUnit.SECONDS);
        } finally {
            releaseFirst.countDown();
            executor.shutdownNow();
            assertTrue(executor.awaitTermination(10, TimeUnit.SECONDS));
        }
    }

    private void insert(String id, String store, String role) {
        jdbc.update("""
                insert into sys_user(sys_id,user_id,user_nm,user_password,plant_cd,sys_plant_cd,user_role,insert_user_id)
                values (?,?,?,'TEST-HASH',?,?,?,'FIXTURE')
                """, id, id, id, store, store, role);
    }

    private static ClientUserItem item(String id) { var item = new ClientUserItem(); item.setSysId(id); return item; }
    private static Login actor(String id, String store, String role) {
        var actor = new Login(); actor.setSysId(id); actor.setUserId(id); actor.setSysPlantCd(store); actor.setUserRole(role); return actor;
    }
}
