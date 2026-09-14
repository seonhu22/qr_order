package htms.QROrder.consumer.event.controller;

import htms.QROrder.consumer.event.service.ConsumerEventService;
import htms.QROrder.consumer.order.exception.ConsumerOrderSessionRequiredException;
import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.qr.dto.QrConnectResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/client/consumer/events")
public class ConsumerEventController {

    private final ConsumerEventService eventService;

    @Operation(
            operationId = "subscribeConsumerEvents",
            summary = "Consumer 방문 변경 이벤트 구독",
            description = "서버 세션의 현재 방문 채널을 구독합니다. 이벤트 수신 후 HTTP API를 재조회해야 합니다.")
    @ApiResponse(responseCode = "200", description = "SSE 연결 성공")
    @ApiResponse(responseCode = "401", description = "QR 또는 Consumer 방문 바인딩 없음")
    @ApiResponse(responseCode = "410", description = "결제완료 또는 만료된 방문")
    @GetMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(HttpSession session) {
        return eventService.subscribe(qrTableInfo(session), consumerBinding(session));
    }

    private QrConnectResponse qrTableInfo(HttpSession session) {
        Object value = session.getAttribute("qrTableInfo");
        if (value instanceof QrConnectResponse qrTableInfo) {
            return qrTableInfo;
        }
        throw new ConsumerOrderSessionRequiredException("QR코드를 다시 스캔해주세요.");
    }

    private ConsumerSessionBinding consumerBinding(HttpSession session) {
        Object value = session.getAttribute(ConsumerSessionBinding.SESSION_ATTRIBUTE);
        return value instanceof ConsumerSessionBinding binding ? binding : null;
    }
}
