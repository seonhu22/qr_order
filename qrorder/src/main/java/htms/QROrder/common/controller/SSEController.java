package htms.QROrder.common.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.common.service.SSEEmitterService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/sse")
public class SSEController {

    private final SSEEmitterService sseEmitterService;

    @GetMapping(value = "/subscribe/{channelId}", produces = "text/event-stream")
    public SseEmitter subscribe(@PathVariable String channelId) {
        if (channelId.startsWith("client:")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Client 채널은 로그인 구독을 사용해야 합니다.");
        }
        return sseEmitterService.subscribe(channelId);
    }

    @GetMapping(value = "/client/subscribe", produces = "text/event-stream")
    public SseEmitter subscribeClient(HttpSession session) {
        Login loginUser = (Login) session.getAttribute("loginUser");
        if (loginUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증되지 않은 사용자입니다.");
        }
        return sseEmitterService.subscribe("client:" + loginUser.getSysPlantCd());
    }
}
