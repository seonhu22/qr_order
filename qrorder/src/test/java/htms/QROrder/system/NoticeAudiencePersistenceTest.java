package htms.QROrder.system;

import htms.QROrder.auth.LocalPostgresTestSupport;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.common.dto.FileRequest;
import htms.QROrder.common.service.FileService;
import htms.QROrder.system.dto.NoticeRequest;
import htms.QROrder.system.repository.NoticeMapper;
import htms.QROrder.system.service.NoticeService;
import htms.QROrder.client.repository.ClientNoticeMapper;
import org.apache.ibatis.session.Configuration;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.mybatis.spring.transaction.SpringManagedTransactionFactory;
import org.junit.jupiter.api.*;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionInterceptor;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class NoticeAudiencePersistenceTest {
    LocalPostgresTestSupport database; JdbcTemplate jdbc; NoticeMapper admin; ClientNoticeMapper client; NoticeService service;
    String migration;
    @BeforeAll void start() throws Exception {
        database=LocalPostgresTestSupport.start();
        try {
            var source=(org.springframework.jdbc.datasource.DriverManagerDataSource)database.dataSource();
            source.setUrl(source.getUrl().replace("currentSchema=qa_auth","currentSchema=public"));
            jdbc=new JdbcTemplate(source);
            // Independent minimum fixture. Shared production DB/configuration is never read.
            jdbc.execute("""
                create table public.sys_user(user_id varchar(50),user_nm varchar(50));
                create table public.brd_notice(sys_id varchar(36) primary key,notice_title text,notice_description text,
                    start_date date,delete_yn varchar(1),use_yn varchar(1),file_ulid varchar(36),
                    insert_user_id varchar(50),insert_datetime timestamp,sys_plant_cd varchar(50),
                    modify_user_id varchar(50),modify_datetime timestamp);
                insert into public.brd_notice(sys_id,notice_title,start_date,delete_yn,use_yn) values('LEGACY','legacy',current_date,'N','Y');
                """);
            migration=Files.readString(Path.of("..","docs","qa","scripts","2026-11-18-notice-target-migration.sql"));
            jdbc.execute(migration);
            assertEquals(0,jdbc.queryForObject("select count(*) from information_schema.columns where table_name='brd_notice' and column_name='target'",Integer.class));
            jdbc.execute(migration.stripTrailing().replaceAll("ROLLBACK;$","COMMIT;"));
            assertEquals("all",jdbc.queryForObject("select target from brd_notice where sys_id='LEGACY'",String.class));
            var factory=new SqlSessionFactoryBean(); factory.setDataSource(source);
            var configuration=new Configuration(); configuration.setMapUnderscoreToCamelCase(true); factory.setConfiguration(configuration);
            factory.setTransactionFactory(new SpringManagedTransactionFactory());
            factory.setMapperLocations(new ClassPathResource("mapper/system/NoticeMapper.xml"),new ClassPathResource("mapper/client/ClientNoticeMapper.xml"));
            var sql=new SqlSessionTemplate(factory.getObject()); admin=sql.getMapper(NoticeMapper.class); client=sql.getMapper(ClientNoticeMapper.class);
            var proxy=new ProxyFactory(new NoticeService(admin,mock(AuditService.class),mock(FileService.class)));
            proxy.addAdvice(new TransactionInterceptor(new DataSourceTransactionManager(source),new AnnotationTransactionAttributeSource()));
            service=(NoticeService)proxy.getProxy();
        } catch(Exception failure) {database.close();throw failure;}
    }
    @AfterAll void close() throws Exception {if(database!=null)database.close();}
    @BeforeEach void reset(){jdbc.update("delete from brd_notice where sys_id <> 'LEGACY'");}
    NoticeRequest create(String target) {
        var r=new NoticeRequest();r.setNoticeTitle("AUTO-QA "+target);r.setNoticeDescription("test");r.setUseYn("Y");r.setStartDate(LocalDateTime.now().minusDays(1));r.setTarget(target);
        service.newNotice(r,new FileRequest(),"SYSTEM","ADMIN","NOTICE"); return r;
    }
    @Test void writesAndReadsAllThreeTargetsWithoutCrossRoleExposure() {
        var all=create("all");var manager=create("manager");var staff=create("staff");
        assertEquals("manager",admin.getNotice(null,"ADMIN").stream().filter(r->r.getSysId().equals(manager.getSysId())).findFirst().orElseThrow().getTarget());
        var managerIds=client.getNotice(null,"manager").stream().map(r->r.getSysId()).toList();
        var staffIds=client.getNotice(null,"staff").stream().map(r->r.getSysId()).toList();
        assertTrue(managerIds.containsAll(List.of("LEGACY",all.getSysId(),manager.getSysId())));assertFalse(managerIds.contains(staff.getSysId()));
        assertTrue(staffIds.containsAll(List.of("LEGACY",all.getSysId(),staff.getSysId())));assertFalse(staffIds.contains(manager.getSysId()));
    }
    @Test void missingUpdatePreservesCurrentTargetAndExplicitUpdateChangesIt() {
        var notice=create("staff");var update=new NoticeRequest();update.setSysId(notice.getSysId());update.setNoticeTitle("edited");update.setUseYn("Y");update.setStartDate(notice.getStartDate());
        service.updateNotice(update,new FileRequest(),"SYSTEM","ADMIN","NOTICE");
        assertEquals("staff",jdbc.queryForObject("select target from brd_notice where sys_id=?",String.class,notice.getSysId()));
        update.setTarget("manager");service.updateNotice(update,new FileRequest(),"SYSTEM","ADMIN","NOTICE");
        assertEquals("manager",jdbc.queryForObject("select target from brd_notice where sys_id=?",String.class,notice.getSysId()));
    }
    @Test void dbRejectsNullOrUnknownTarget() {
        assertThrows(org.springframework.dao.DataIntegrityViolationException.class,()->jdbc.update("update brd_notice set target=null where sys_id='LEGACY'"));
        assertThrows(org.springframework.dao.DataIntegrityViolationException.class,()->jdbc.update("update brd_notice set target='select' where sys_id='LEGACY'"));
    }
    @Test void visibilityConditionsRemainAndRollbackRefusesTargetedNotices() throws Exception {
        var hidden=create("manager");jdbc.update("update brd_notice set use_yn='N' where sys_id=?",hidden.getSysId());
        var future=create("manager");jdbc.update("update brd_notice set start_date=current_date+1 where sys_id=?",future.getSysId());
        var deleted=create("all");jdbc.update("update brd_notice set delete_yn='Y' where sys_id=?",deleted.getSysId());
        assertEquals(List.of("LEGACY"),client.getNotice(null,"manager").stream().map(r->r.getSysId()).toList());
        String rollback=Files.readString(Path.of("..","docs","qa","scripts","2026-11-18-notice-target-rollback.sql"));
        assertThrows(org.springframework.dao.DataAccessException.class,()->jdbc.execute(rollback));
        assertEquals("manager",jdbc.queryForObject("select target from brd_notice where sys_id=?",String.class,hidden.getSysId()));
    }
    @Test void omittedUpdateWaitsForConcurrentTargetChangeAndPreservesCommittedValue() throws Exception {
        var notice=create("staff");
        var executor=java.util.concurrent.Executors.newSingleThreadExecutor();
        var source=jdbc.getDataSource();
        // Observe from an independent connection, not pg_stat_activity's cached transaction snapshot.
        var observer=new JdbcTemplate(database.dataSource());
        try {
            var future=new org.springframework.transaction.support.TransactionTemplate(new DataSourceTransactionManager(source)).execute(status->{
                jdbc.update("update brd_notice set target='manager' where sys_id=?",notice.getSysId());
                var pending=executor.submit(()->{
                    var edit=new NoticeRequest();edit.setSysId(notice.getSysId());edit.setNoticeTitle("concurrent");edit.setUseYn("Y");edit.setStartDate(notice.getStartDate());
                    service.updateNotice(edit,new FileRequest(),"SYSTEM","ADMIN","NOTICE");
                });
                long deadline=System.nanoTime()+java.time.Duration.ofSeconds(5).toNanos();boolean waiting=false;
                while(System.nanoTime()<deadline) {
                    if(observer.queryForObject("select count(*) from pg_stat_activity where datname=current_database() and wait_event_type='Lock'",Integer.class)>0){waiting=true;break;}
                    try{Thread.sleep(25);}catch(InterruptedException interrupted){Thread.currentThread().interrupt();throw new RuntimeException(interrupted);}
                }
                assertTrue(waiting,"A real concurrent PostgreSQL lock wait must be observed");
                assertFalse(pending.isDone());return pending;
            });
            future.get(10,java.util.concurrent.TimeUnit.SECONDS);
            assertEquals("manager",jdbc.queryForObject("select target from brd_notice where sys_id=?",String.class,notice.getSysId()));
        } finally {
            executor.shutdownNow();assertTrue(executor.awaitTermination(10,java.util.concurrent.TimeUnit.SECONDS));
        }
    }
}
