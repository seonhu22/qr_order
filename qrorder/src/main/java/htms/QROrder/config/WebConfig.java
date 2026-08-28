package htms.QROrder.config;

import htms.QROrder.auth.Interceptor.ConsumerAuthInterceptor;
import htms.QROrder.auth.Interceptor.LoginCheckInterceptor;
import htms.QROrder.auth.Interceptor.RoleCheckInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {

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
        registry.addInterceptor(new LoginCheckInterceptor())
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
                .addPathPatterns("/api/system/**")
                .excludePathPatterns("/api/system/settings/menu/search");
    }
}
