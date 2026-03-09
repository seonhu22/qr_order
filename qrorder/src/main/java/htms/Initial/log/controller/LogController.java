package htms.Initial.log.controller;

import htms.Initial.log.service.LogService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@Controller
@ControllerAdvice
@RequiredArgsConstructor
@RequestMapping("/log/log")
public class LogController {

    private final LogService logService;

    @PostMapping("/menu_open_access_log")
    @ResponseBody
    public void insertMenuOpenAccessLog(@RequestParam String menuCd,
                                    HttpSession session) {

        String menuUuid = UUID.randomUUID().toString();
        session.setAttribute("menuUuid", menuUuid);
        session.setAttribute("menuCd", menuCd);

        String logUuid = (String) session.getAttribute("logUuid");

        logService.insertMenuOpenAccessLog(menuUuid, logUuid, menuCd);
    }

    @PostMapping("/menu_close_access_log")
    @ResponseBody
    public void insertMenuCloseAccessLog(HttpSession session) {

        String menuUuid = (String) session.getAttribute("menuUuid");

        logService.insertMenuCloseAccessLog(menuUuid);
    }
}
