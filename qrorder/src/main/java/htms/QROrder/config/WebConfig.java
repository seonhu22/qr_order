package htms.QROrder.config;

import htms.QROrder.auth.Interceptor.ConsumerAuthInterceptor;
import htms.QROrder.auth.Interceptor.LoginCheckInterceptor;
import htms.QROrder.auth.Interceptor.RoleCheckInterceptor;
import htms.QROrder.auth.Interceptor.PasswordOwnerInterceptor;
import htms.QROrder.auth.Interceptor.ClientMenuRoleInterceptor;
import htms.QROrder.auth.repository.LoginMapper;
import htms.QROrder.system.billing.controller.BillingWebhookController;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {
    private final LoginMapper loginMapper;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new ClientMenuRoleInterceptor())
                .order(2)
                .addPathPatterns("/api/client/menu_manage/**", "/api/client/store_manage/user_manage/**");
        registry.addInterceptor(new PasswordOwnerInterceptor())
                .order(2)
                .addPathPatterns("/api/auth/init-pwd-active");
        registry.addInterceptor(new LoginCheckInterceptor(loginMapper, WebConfig::isBillingWebhookHandler))
                .order(1)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/auth/login",
                        "/api/auth/signup/**",
                        "/api/auth/email_valid/new_user/**",
                        "/api/auth/email_valid/pwd_change/send",
                        "/api/auth/email_valid/pwd_change/re_send",
                        "/api/auth/email_valid/pwd_change",
                        "/api/auth/pwd_change",
                        "/api/qr/**",
                        "/api/client/consumer/**",
                        "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**");

        registry.addInterceptor(new ConsumerAuthInterceptor())
                .order(1)
                .addPathPatterns("/api/client/consumer/**");

        registry.addInterceptor(new RoleCheckInterceptor())
                .order(2)
                .addPathPatterns("/api/system/**", "/api/auth/init-pwd")
                .excludePathPatterns("/api/system/settings/menu/search");
    }

    /**
     * 결제 제공자 웹훅은 로그인 대신 서명으로 인증한다(정책 4C §10). 경로 패턴은 HTTP 메서드를 구분하지 않으므로
     * 실제로 고른 핸들러가 웹훅 POST 핸들러일 때만 로그인 확인을 건너뛴다. 다른 메서드/중첩 경로는 다른 핸들러(SPA 등)라 로그인 필요.
     */
    static boolean isBillingWebhookHandler(Object handler) {
        return handler instanceof HandlerMethod method && method.getBeanType() == BillingWebhookController.class
                && method.hasMethodAnnotation(PostMapping.class);
    }
}
