package htms.Initial.common.controller;

import htms.Initial.auth.domain.Login;
import htms.Initial.common.dto.CommonAuth;
import htms.Initial.common.service.CommonAuthService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Slf4j
@Controller
@ControllerAdvice
@RequiredArgsConstructor
@RequestMapping("/common/auth")
public class AuthController {

    private final CommonAuthService authService;

    @GetMapping("/search")
    @ResponseBody
    public CommonAuth search(@RequestParam String menuCd,
                                HttpSession session) {

        Login login = (Login) session.getAttribute("loginUser");

        return authService.getMenuButtonAuth(menuCd, login.getSysPlantCd());
    }
}
