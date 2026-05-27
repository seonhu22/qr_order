package htms.QROrder.log.controller;

import com.github.f4b6a3.ulid.UlidCreator;
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

        String menuUlid = UlidCreator.getMonotonicUlid().toString();
        session.setAttribute("menuUuid", menuUlid);
        session.setAttribute("menuCd", menuCd);

        String logUuid = (String) session.getAttribute("logUuid");

        logService.insertMenuOpenAccessLog(menuUlid, logUuid, menuCd);
    }

    @PostMapping("/menu_close_access_log")
    public void insertMenuCloseAccessLog(HttpSession session) {

        String menuUlid = (String) session.getAttribute("menuUuid");

        logService.insertMenuCloseAccessLog(menuUlid);
    }
}
