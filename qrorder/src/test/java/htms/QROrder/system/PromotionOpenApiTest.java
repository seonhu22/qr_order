package htms.QROrder.system;

import htms.QROrder.config.SecurityConfig;
import htms.QROrder.system.controller.ClientUserRoleController;
import htms.QROrder.system.repository.ClientUserRoleMapper;
import htms.QROrder.system.service.ClientUserRoleService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

/** Real HTTP springdoc export, isolated from application credentials and databases. */
class PromotionOpenApiTest {
    @TestConfiguration(proxyBeanMethods = false)
    @EnableAutoConfiguration(exclude = DataSourceAutoConfiguration.class)
    @Import({ClientUserRoleController.class, SecurityConfig.class})
    static class ContractApplication {
        @Bean ClientUserRoleService roleService() { return new ClientUserRoleService(mock(ClientUserRoleMapper.class),
                mock(htms.QROrder.system.billing.repository.SubscriptionMapper.class)); }
    }

    @Test void exportsPromotionFromRunningControllerWithoutDatabase() throws Exception {
        try (var app = new SpringApplication(ContractApplication.class).run(
                "--server.port=0", "--server.address=127.0.0.1",
                "--spring.config.location=optional:classpath:/contract-export-only.properties",
                "--spring.main.banner-mode=off", "--springdoc.api-docs.enabled=true",
                "--jodconverter.local.enabled=false")) {
            String port = app.getEnvironment().getProperty("local.server.port");
            var response = HttpClient.newHttpClient().send(HttpRequest.newBuilder(
                    URI.create("http://127.0.0.1:" + port + "/v3/api-docs")).timeout(Duration.ofSeconds(15)).GET().build(),
                    HttpResponse.BodyHandlers.ofString());
            assertEquals(200, response.statusCode());
            assertTrue(response.body().contains("/api/system/client-users/{sysId}/promote"));
            assertTrue(response.body().contains("promoteClientUser"));
            Path output = Path.of("build", "contract-export", "promotion-openapi.json");
            Files.createDirectories(output.getParent());
            Files.writeString(output, response.body());
        }
    }
}
