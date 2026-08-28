package htms.QROrder.consumer.order.controller;

import htms.QROrder.common.dto.CommonResponse;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateEnvelope;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateRequest;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateResponse;
import htms.QROrder.consumer.order.dto.ConsumerOrderDetailEnvelope;
import htms.QROrder.consumer.order.dto.ConsumerOrderDetailResponse;
import htms.QROrder.consumer.order.dto.ConsumerOrderListEnvelope;
import htms.QROrder.consumer.order.dto.ConsumerOrderListResponse;
import htms.QROrder.consumer.order.exception.ConsumerOrderSessionRequiredException;
import htms.QROrder.consumer.order.service.ConsumerOrderCreationService;
import htms.QROrder.consumer.order.service.ConsumerOrderQueryService;
import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.qr.dto.QrConnectResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/client/consumer/orders")
public class ConsumerOrderController {

    private final ConsumerOrderCreationService consumerOrderCreationService;
    private final ConsumerOrderQueryService consumerOrderQueryService;

    @Operation(
            operationId = "createConsumerOrder",
            summary = "Consumer 주문 생성",
            description = "현재 QR 방문에 주문 티켓 한 건을 생성합니다. 가격은 서버의 현재 메뉴 정보로 계산합니다."
    )
    @ApiResponse(
            responseCode = "201",
            description = "주문 생성 성공",
            content = @Content(schema = @Schema(implementation = ConsumerOrderCreateEnvelope.class))
    )
    @ApiResponse(responseCode = "400", description = "주문 요청 또는 옵션 규칙 위반",
            content = @Content(schema = @Schema(implementation = CommonResponse.class)))
    @ApiResponse(responseCode = "401", description = "QR 또는 Consumer 방문 바인딩 없음",
            content = @Content(schema = @Schema(implementation = CommonResponse.class)))
    @ApiResponse(responseCode = "404", description = "현재 사업장에서 주문할 수 없는 메뉴 또는 옵션",
            content = @Content(schema = @Schema(implementation = CommonResponse.class)))
    @ApiResponse(responseCode = "409", description = "품절 등 주문 상태 충돌",
            content = @Content(schema = @Schema(implementation = CommonResponse.class)))
    @ApiResponse(responseCode = "410", description = "결제완료 또는 만료된 방문",
            content = @Content(schema = @Schema(implementation = CommonResponse.class)))
    @ApiResponse(responseCode = "500", description = "처리되지 않은 서버 오류",
            content = @Content(schema = @Schema(implementation = CommonResponse.class)))
    @PostMapping
    public ResponseEntity<CommonResponse> createOrder(
            @RequestBody(required = false) ConsumerOrderCreateRequest request,
            HttpSession session) {
        QrConnectResponse qrTableInfo = qrTableInfo(session);
        ConsumerSessionBinding binding = consumerBinding(session);
        ConsumerOrderCreateResponse response = consumerOrderCreationService.createOrder(
                qrTableInfo, binding, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(CommonResponse.builder()
                        .success(true)
                        .data(response)
                        .build());
    }

    @Operation(
            operationId = "getConsumerOrders",
            summary = "Consumer 공유 주문 목록 조회",
            description = "현재 QR 방문에 속한 주문 티켓을 최신순으로 조회합니다."
    )
    @ApiResponse(responseCode = "200", description = "주문 목록 조회 성공",
            content = @Content(schema = @Schema(implementation = ConsumerOrderListEnvelope.class)))
    @ApiResponse(responseCode = "401", description = "QR 또는 Consumer 방문 바인딩 없음",
            content = @Content(schema = @Schema(implementation = CommonResponse.class)))
    @ApiResponse(responseCode = "410", description = "결제완료 또는 만료된 방문",
            content = @Content(schema = @Schema(implementation = CommonResponse.class)))
    @ApiResponse(responseCode = "500", description = "처리되지 않은 서버 오류",
            content = @Content(schema = @Schema(implementation = CommonResponse.class)))
    @GetMapping
    public ResponseEntity<CommonResponse> getOrders(HttpSession session) {
        ConsumerOrderListResponse response = consumerOrderQueryService.getOrders(
                qrTableInfo(session), consumerBinding(session));
        return ok(response);
    }

    @Operation(
            operationId = "getConsumerOrder",
            summary = "Consumer 공유 주문 상세 조회",
            description = "현재 QR 방문에 속한 주문 한 건의 메뉴와 옵션을 조회합니다."
    )
    @ApiResponse(responseCode = "200", description = "주문 상세 조회 성공",
            content = @Content(schema = @Schema(implementation = ConsumerOrderDetailEnvelope.class)))
    @ApiResponse(responseCode = "400", description = "잘못된 orderId",
            content = @Content(schema = @Schema(implementation = CommonResponse.class)))
    @ApiResponse(responseCode = "401", description = "QR 또는 Consumer 방문 바인딩 없음",
            content = @Content(schema = @Schema(implementation = CommonResponse.class)))
    @ApiResponse(responseCode = "404", description = "현재 방문에서 조회할 수 없는 주문",
            content = @Content(schema = @Schema(implementation = CommonResponse.class)))
    @ApiResponse(responseCode = "410", description = "결제완료 또는 만료된 방문",
            content = @Content(schema = @Schema(implementation = CommonResponse.class)))
    @ApiResponse(responseCode = "500", description = "처리되지 않은 서버 오류",
            content = @Content(schema = @Schema(implementation = CommonResponse.class)))
    @GetMapping("/{orderId}")
    public ResponseEntity<CommonResponse> getOrder(
            @Parameter(schema = @Schema(maxLength = 64))
            @PathVariable String orderId,
            HttpSession session) {
        ConsumerOrderDetailResponse response = consumerOrderQueryService.getOrder(
                qrTableInfo(session), consumerBinding(session), orderId);
        return ok(response);
    }

    private ResponseEntity<CommonResponse> ok(Object data) {
        return ResponseEntity.ok(CommonResponse.builder()
                .success(true)
                .data(data)
                .build());
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
        if (value instanceof ConsumerSessionBinding binding) {
            return binding;
        }
        throw new ConsumerOrderSessionRequiredException("Consumer 방문 세션을 먼저 확인해주세요.");
    }
}
