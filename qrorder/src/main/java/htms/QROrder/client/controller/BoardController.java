package htms.QROrder.client.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.dto.NoticeResponse;
import htms.QROrder.client.service.NoticeService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/client/board")
public class BoardController {

    private final NoticeService noticeService;

    @GetMapping("/notice/search")
    public List<NoticeResponse> getNotice(@RequestParam String searchKeyword) {

        return noticeService.getNotice(searchKeyword);
    }
}
