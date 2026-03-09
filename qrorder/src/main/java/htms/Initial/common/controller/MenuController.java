package htms.Initial.common.controller;

import htms.Initial.auth.domain.Login;
import htms.Initial.common.dto.CommonMenu;
import htms.Initial.common.service.CommonMenuService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@Controller
@ControllerAdvice
@RequiredArgsConstructor
@RequestMapping("/common/menu")
public class MenuController {
    private final CommonMenuService menuService;

    // 시스템 기본 메뉴 전용
    @GetMapping("/1depth")
    @ResponseBody
    public List<CommonMenu> getMenuLevel1Depth(HttpSession session) {

        Login login = (Login) session.getAttribute("loginUser");
        Long sysId = null;

        return menuService.getMenuLevel1Depth(sysId, 0, login.getUserId(), login.getSysPlantCd());
    }

    // 시스템 기본 메뉴 전용
    @GetMapping("/2depth")
    @ResponseBody
    public List<CommonMenu> getMenuLevel2Depth(@RequestParam String menuCd,
                                            HttpSession session) {

        Login login = (Login) session.getAttribute("loginUser");

        return menuService.getMenuLevel2Depth(menuCd, 1, login.getUserId(), login.getSysPlantCd());
    }

    // 시스템 기본 메뉴 전용
    @GetMapping("/3depth")
    @ResponseBody
    public List<CommonMenu> getMenuLevel3Depth(@RequestParam String menuCd,
                                            HttpSession session) {

        Login login = (Login) session.getAttribute("loginUser");

        return menuService.getMenuLevel3Depth(menuCd, 2, login.getUserId(), login.getSysPlantCd());
    }
}
