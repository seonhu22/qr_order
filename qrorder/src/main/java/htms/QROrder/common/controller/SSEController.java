package htms.QROrder.common.controller;

import htms.QROrder.common.service.SSEEmitterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/sse")
public class SSEController {

    private final SSEEmitterService sseEmitterService;

    @GetMapping(value = "/subscribe/{channelId}", produces = "text/event-stream")
    public SseEmitter subscribe(@PathVariable String channelId) {

        return sseEmitterService.subscribe(channelId);
    }
}