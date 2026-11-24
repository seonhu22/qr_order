package htms.QROrder.auth;

import htms.QROrder.auth.dto.SignUpRequest;
import htms.QROrder.auth.repository.SignUpMapper;
import htms.QROrder.auth.service.SignUpService;
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

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

/** 가입 쓰기를 실제 PostgreSQL에서 확인한다(정책 4C §1). */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Execution(ExecutionMode.SAME_THREAD)
class SignUpPersistenceTest {
    private LocalPostgresTestSupport database;
    private JdbcTemplate jdbc;
    private SignUpService signUp;

    @BeforeAll void startIndependentDatabase() throws Exception {
        database = LocalPostgresTestSupport.start();
        try {
            var source = database.dataSource("public");
            jdbc = new JdbcTemplate(source);
            TeamSchemaFixture.createCoreTables(jdbc);
            Configuration configuration = new Configuration();
            configuration.setMapUnderscoreToCamelCase(true);
            var factory = new SqlSessionFactoryBean();
            factory.setDataSource(source);
            factory.setConfiguration(configuration);
            factory.setTransactionFactory(new SpringManagedTransactionFactory());
            factory.setMapperLocations(new ClassPathResource("mapper/auth/SignUpMapper.xml"));
            var sql = new SqlSessionTemplate(factory.getObject());
            var transactions = new DataSourceTransactionManager(source);
            ProxyFactory proxy = new ProxyFactory(new SignUpService(sql.getMapper(SignUpMapper.class),
                    new BCryptPasswordEncoder(4)));
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
        jdbc.execute("truncate table sys_user, sys_plant");
    }

    @Test void signupWritesOnePlantAndOneUser() {
        signUp.newUser(request("1234567890", "owner1"));
        assertEquals(1, count("sys_plant"));
        assertEquals(1, count("sys_user"));
    }

    @Test void userInsertFailureLeavesNoPlantRow() {
        // sys_user.email은 200자, sys_plant에는 email이 없어 두 번째 INSERT만 실패한다.
        var request = request("1234567890", "owner1");
        request.setEmail("e".repeat(201));
        assertThrows(org.springframework.dao.DataAccessException.class, () -> signUp.newUser(request));
        assertEquals(0, count("sys_plant"));
        assertEquals(0, count("sys_user"));
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
