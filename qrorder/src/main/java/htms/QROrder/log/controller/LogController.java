package htms.QROrder.log.controller;

import htms.QROrder.log.service.LogService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/log/log")
public class LogController {

    private final LogService logService;

    @PostMapping("/menu_open_access_log")
    public void insertMenuOpenAccessLog(@RequestParam String menuCd,
                                        HttpSession session) {

        String menuUuid = UUID.randomUUID().toString();
        session.setAttribute("menuUuid", menuUuid);
        session.setAttribute("menuCd", menuCd);

        String logUuid = (String) session.getAttribute("logUuid");

        logService.insertMenuOpenAccessLog(menuUuid, logUuid, menuCd);
    }

    @PostMapping("/menu_close_access_log")
    public void insertMenuCloseAccessLog(HttpSession session) {

        String menuUuid = (String) session.getAttribute("menuUuid");

        logService.insertMenuCloseAccessLog(menuUuid);
    }
}
