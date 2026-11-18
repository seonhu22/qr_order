package htms.QROrder.system;

import htms.QROrder.config.SecurityConfig;
import htms.QROrder.system.controller.SettingsController;
import htms.QROrder.system.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import java.net.*;
import java.net.http.*;
import java.nio.file.*;
import java.time.Duration;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class NoticeAudienceOpenApiTest {
    @TestConfiguration(proxyBeanMethods=false)
    @EnableAutoConfiguration(exclude=DataSourceAutoConfiguration.class)
    @Import(SecurityConfig.class)
    static class ContractApplication {
        @Bean SettingsController settings() {
            return new SettingsController(mock(CommonMasterService.class),mock(CommonDetailService.class),mock(PlantService.class),
                mock(AdminUserService.class),mock(MenuService.class),mock(MessageService.class),mock(RuleMasterService.class),mock(RuleDetailService.class),
                mock(PaymentService.class),mock(PlantStatusService.class),mock(PaymentCouponService.class),mock(SysAccessLogService.class),
                mock(AuditTrailService.class),mock(NoticeService.class),mock(QnaService.class));
        }
    }
    @Test void exportsActualMultipartTargetAndNoticeResponse() throws Exception {
        try(var app=new SpringApplication(ContractApplication.class).run("--server.port=0","--server.address=127.0.0.1",
            "--spring.config.location=optional:classpath:/contract-export-only.properties","--spring.main.banner-mode=off",
            "--springdoc.api-docs.enabled=true","--jodconverter.local.enabled=false")) {
            var response=HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+app.getEnvironment().getProperty("local.server.port")+"/v3/api-docs")).timeout(Duration.ofSeconds(15)).GET().build(),HttpResponse.BodyHandlers.ofString());
            assertEquals(200,response.statusCode());assertTrue(response.body().contains("\"target\""));assertTrue(response.body().contains("\"manager\""));
            Path output=Path.of("build","contract-export","notice-audience-openapi.json");Files.createDirectories(output.getParent());Files.writeString(output,response.body());
        }
    }
}
