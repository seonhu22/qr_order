package htms.QROrder.consumer.session.controller;

import htms.QROrder.common.dto.CommonResponse;
import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.consumer.session.dto.ConsumerSessionEnvelope;
import htms.QROrder.consumer.session.dto.ConsumerSessionResponse;
import htms.QROrder.consumer.session.service.ConsumerSessionService;
import htms.QROrder.qr.dto.QrConnectResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/consumer/session")
public class ConsumerSessionController {

    private final ConsumerSessionService consumerSessionService;

    @Operation(
            operationId = "getConsumerSession",
            summary = "Consumer 방문 세션 조회",
            description = "QR 세션의 매장과 테이블을 기준으로 공유 방문 상태를 조회합니다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Consumer 방문 세션 조회 성공",
            content = @Content(schema = @Schema(implementation = ConsumerSessionEnvelope.class))
    )
    @ApiResponse(
            responseCode = "401",
            description = "QR 세션이 없거나 만료됨",
            content = @Content(schema = @Schema(implementation = CommonResponse.class))
    )
    @GetMapping
    public ResponseEntity<CommonResponse> getSession(HttpSession session) {
        QrConnectResponse qrTableInfo = (QrConnectResponse) session.getAttribute("qrTableInfo");
        ConsumerSessionBinding binding = getBinding(session);
        ConsumerSessionResponse response = consumerSessionService.getSession(qrTableInfo, binding);

        if ("ACTIVE".equals(response.getStatus())) {
            session.setAttribute(ConsumerSessionBinding.SESSION_ATTRIBUTE, response.toBinding());
        }

        return ResponseEntity.ok(CommonResponse.builder()
                .success(true)
                .data(response)
                .build());
    }

    private ConsumerSessionBinding getBinding(HttpSession session) {
        Object value = session.getAttribute(ConsumerSessionBinding.SESSION_ATTRIBUTE);
        return value instanceof ConsumerSessionBinding binding ? binding : null;
    }
}
