package htms.QROrder.system.billing;

import htms.QROrder.auth.LocalPostgresTestSupport;
import htms.QROrder.auth.TeamSchemaFixture;
import org.apache.ibatis.session.Configuration;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.mybatis.spring.transaction.SpringManagedTransactionFactory;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionInterceptor;

import java.util.Arrays;

/** 임시 PostgreSQL + 팀 스키마 일부 + 4C migration 2개 + 지정한 Mapper XML. */
public final class BillingPersistenceSupport implements AutoCloseable {
    public final LocalPostgresTestSupport database;
    public final JdbcTemplate jdbc;
    public final SqlSessionTemplate sql;
    public final DataSourceTransactionManager transactions;

    private BillingPersistenceSupport(LocalPostgresTestSupport database, JdbcTemplate jdbc, SqlSessionTemplate sql,
                                      DataSourceTransactionManager transactions) {
        this.database = database;
        this.jdbc = jdbc;
        this.sql = sql;
        this.transactions = transactions;
    }

    public static BillingPersistenceSupport start(String... mapperXmls) throws Exception {
        var database = LocalPostgresTestSupport.start();
        try {
            var source = database.dataSource("public");
            var jdbc = new JdbcTemplate(source);
            TeamSchemaFixture.createCoreTables(jdbc);
            jdbc.execute(TeamSchemaFixture.migration("2026-11-25-sys-plant-active-unique.sql"));
            jdbc.execute(TeamSchemaFixture.migration("2026-11-25-subscription-billing.sql"));
            Configuration configuration = new Configuration();
            configuration.setMapUnderscoreToCamelCase(true);
            var factory = new SqlSessionFactoryBean();
            factory.setDataSource(source);
            factory.setConfiguration(configuration);
            factory.setTypeAliasesPackage("htms.QROrder.auth.domain");
            factory.setTransactionFactory(new SpringManagedTransactionFactory());
            factory.setMapperLocations(Arrays.stream(mapperXmls).map(ClassPathResource::new)
                    .toArray(ClassPathResource[]::new));
            return new BillingPersistenceSupport(database, jdbc, new SqlSessionTemplate(factory.getObject()),
                    new DataSourceTransactionManager(source));
        } catch (Exception failure) {
            database.close();
            throw failure;
        }
    }

    @SuppressWarnings("unchecked")
    public <T> T transactional(T target) {
        ProxyFactory proxy = new ProxyFactory(target);
        proxy.setProxyTargetClass(true);
        proxy.addAdvice(new TransactionInterceptor(transactions, new AnnotationTransactionAttributeSource()));
        return (T) proxy.getProxy();
    }

    public void truncateAll() {
        jdbc.execute("truncate table sys_billing_webhook_event, sys_subscription_invoice, sys_subscription,"
                + " sys_user, sys_plant, sys_payment");
    }

    public void plant(String plantCd) {
        jdbc.update("insert into sys_plant(sys_id, plant_cd, plant_nm, use_yn, delete_yn, insert_datetime, insert_user_id)"
                + " values (?, ?, ?, 'Y', 'N', now(), 'FIXTURE')", "P-" + plantCd, plantCd, plantCd);
    }

    public void user(String sysId, String plantCd, String role) {
        jdbc.update("""
                insert into sys_user(sys_id, user_id, user_nm, user_password, insert_user_id, insert_datetime,
                  password_fail_cnt, init_yn, sys_plant_cd, plant_cd, delete_yn, user_role, email_valid_yn)
                values (?, ?, ?, 'TEST-HASH', 'FIXTURE', now(), 0, 'N', ?, ?, 'N', ?, 'Y')
                """, sysId, sysId, sysId, plantCd, plantCd, role);
    }

    public void subscription(String sysId, String plantCd, String ownerSysId, String status, String grantedYn) {
        jdbc.update("""
                insert into sys_subscription(sys_id, plant_cd, owner_user_sys_id, status, role_granted_yn,
                  provider, provider_store_id, provider_subscription_id, insert_user_id, insert_datetime)
                values (?, ?, ?, ?, ?, 'fake', 'store-1', ?, 'FIXTURE', now())
                """, sysId, plantCd, ownerSysId, status, grantedYn, "psub-" + sysId);
    }

    public String role(String userSysId) {
        return jdbc.queryForObject("select user_role from sys_user where sys_id=?", String.class, userSysId);
    }

    public String column(String table, String column, String sysId) {
        return jdbc.queryForObject("select " + column + "::text from " + table + " where sys_id=?", String.class, sysId);
    }

    @Override
    public void close() throws Exception {
        database.close();
    }
}
