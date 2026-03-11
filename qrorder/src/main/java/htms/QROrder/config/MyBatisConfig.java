package htms.QROrder.config;

import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.beans.factory.annotation.Value;

import javax.sql.DataSource;

@Configuration
@MapperScan({
        "htms.QROrder.auth.repository",
        "htms.QROrder.system.repository",
        "htms.QROrder.common.repository",
        "htms.QROrder.masterdata.repository",
        "htms.QROrder.home.repository",
        "htms.QROrder.popup.repository",
        "htms.QROrder.log.repository",
        "htms.QROrder.audit.repository"
})
public class MyBatisConfig {
    @Value("${mybatis.mapper-locations}")
    String mPath;

    @Value("${mybatis.type-aliases-package}")
    String mTypeAliasesPackage;

    @Bean
    public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
        SqlSessionFactoryBean sessionFactory = new SqlSessionFactoryBean();
        sessionFactory.setDataSource(dataSource);

        // Mapper XML 위치 설정
        sessionFactory.setMapperLocations(
            new PathMatchingResourcePatternResolver()
                .getResources(mPath)
        );

        // Type Aliases 패키지 설정
        sessionFactory.setTypeAliasesPackage(mTypeAliasesPackage);

        // MyBatis Configuration
        org.apache.ibatis.session.Configuration configuration =
            new org.apache.ibatis.session.Configuration();
        configuration.setMapUnderscoreToCamelCase(true);

        // SQL 로그 출력 설정 (Slf4j 사용)
        configuration.setLogImpl(org.apache.ibatis.logging.slf4j.Slf4jImpl.class);

        sessionFactory.setConfiguration(configuration);

        return sessionFactory.getObject();
    }
}
