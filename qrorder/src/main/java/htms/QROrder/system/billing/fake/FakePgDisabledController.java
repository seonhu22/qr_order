package htms.QROrder.system.billing.fake;

import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.context.annotation.Conditional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 가짜 PG가 꺼진 프로필에서 /fake-pg/** 는 언제나 404. SPA 폴백(WebMvcConfig)이 index.html을 주지 않게 막는다.
 */
@RestController
@Hidden
@Conditional(FakeBillingCondition.Disabled.class)
public class FakePgDisabledController {
    @RequestMapping({"/fake-pg", "/fake-pg/**"})
    public ResponseEntity<Void> notFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
}
