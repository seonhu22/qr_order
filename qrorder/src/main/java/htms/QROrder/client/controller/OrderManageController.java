package htms.QROrder.client.controller;


import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.dto.*;
import htms.QROrder.client.service.OrderHistoryService;
import htms.QROrder.client.service.OrderRevisionCatalogService;
import htms.QROrder.client.service.OrderRevisionService;
import htms.QROrder.client.service.StatusService;
import htms.QROrder.common.dto.CommonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/client/order_manage")
public class OrderManageController {

    private final StatusService statusService;
    private final OrderHistoryService orderHistoryService;
    private final OrderRevisionCatalogService orderRevisionCatalogService;
    private final OrderRevisionService orderRevisionService;

    @GetMapping("/order-revision/catalog")
    public ResponseEntity<CommonResponse> getOrderRevisionCatalog(HttpSession session) {
        Login loginUser = (Login) session.getAttribute("loginUser");

        return ResponseEntity.ok(CommonResponse.builder()
                .success(true)
                .message("주문 수정 카탈로그 조회 완료.")
                .data(orderRevisionCatalogService.getCatalog(loginUser.getSysPlantCd()))
                .build());
    }

    @Operation(
            operationId = "reviseClientOrder",
            summary = "Client 주문 수정 저장",
            description = "접수/조리 중 주문의 메뉴 제거 이력을 남기고 추가 메뉴를 신규 주문 한 건으로 생성합니다."
    )
    @ApiResponse(responseCode = "200", description = "최초 처리 또는 동일 요청 replay 성공",
            content = @Content(schema = @Schema(implementation = OrderRevisionEnvelope.class)))
    @ApiResponse(responseCode = "400", description = "요청 형식 또는 메뉴/옵션 규칙 위반",
            content = @Content(schema = @Schema(implementation = CommonResponse.class)))
    @ApiResponse(responseCode = "404", description = "로그인 매장에서 수정 대상을 찾을 수 없음",
            content = @Content(schema = @Schema(implementation = CommonResponse.class)))
    @ApiResponse(responseCode = "409", description = "상태/비활성 테이블/멱등성 payload 충돌",
            content = @Content(schema = @Schema(implementation = CommonResponse.class)))
    @PostMapping("/status/revise_order")
    public ResponseEntity<CommonResponse> reviseOrder(@RequestBody OrderRevisionRequest request,
                                                       HttpSession session) {
        Login loginUser = (Login) session.getAttribute("loginUser");
        OrderRevisionResponse response = orderRevisionService.revise(
                loginUser.getSysPlantCd(), loginUser.getUserId(), request);

        return ResponseEntity.ok(CommonResponse.builder()
                .success(true)
                .message("주문 수정 완료.")
                .data(response)
                .build());
    }

    // 주문 이력 조회
    @GetMapping("/history/search")
    public OrderHistoryResponse getOrderHistory(@RequestParam (required = false) String orderStatus,
                                                @RequestParam (required = false) String searchKeyword,
                                                @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
                                                @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
                                                HttpSession session) {

        Login login = (Login) session.getAttribute("loginUser");

        return orderHistoryService.getOrderHistory(orderStatus, searchKeyword, startDate, endDate, login.getSysPlantCd());
    }

    // 주문 상태 관리
    @GetMapping("/status/search")
    public List<StatusResponse> getStatus(HttpSession session) {

        Login login = (Login) session.getAttribute("loginUser");

        return statusService.getStatus(login.getSysPlantCd());
    }

    @PostMapping("/status/cancel_order")
    public ResponseEntity<CommonResponse> cancelOrder(@RequestBody StatusRequest statusRequest,
                                                        HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        statusService.cancelOrder(statusRequest, loginUser.getUserId(), loginUser.getSysPlantCd());

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("주문 취소 완료.")
                        .build()
        );
    }

    @PostMapping("/status/go_to_cooking")
    public ResponseEntity<CommonResponse> goToCooking(@RequestBody StatusRequest statusRequest,
                                                        HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        statusService.goToCooking(statusRequest, loginUser.getUserId(), loginUser.getSysPlantCd());

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("조리시작 완료.")
                        .build()
        );
    }

    @PostMapping("/status/back_to_receive_order")
    public ResponseEntity<CommonResponse> backToReceiveOrder(@RequestBody StatusRequest statusRequest,
                                                                HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        statusService.backToReceiveOrder(statusRequest, loginUser.getUserId(), loginUser.getSysPlantCd());

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("이전 상태 변경 완료.")
                        .build()
        );
    }

    @PostMapping("/status/go_to_serving_complete")
    public ResponseEntity<CommonResponse> goToServingComplete(@RequestBody StatusRequest statusRequest,
                                                                HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        statusService.goToServingComplete(statusRequest, loginUser.getUserId(), loginUser.getSysPlantCd());

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("서빙완료.")
                        .build()
        );
    }

    @PostMapping("/status/back_to_cooking")
    public ResponseEntity<CommonResponse> backToCooking(@RequestBody StatusRequest statusRequest,
                                                            HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        statusService.backToCooking(statusRequest, loginUser.getUserId(), loginUser.getSysPlantCd());

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("이전 상태 변경 완료.")
                        .build()
        );
    }

    @GetMapping("/status/get_payment_complete")
    public PaymentCompleteResponse getPaymentComplete(@RequestParam String sysId,
                                                        HttpSession session) {
        Login loginUser = (Login) session.getAttribute("loginUser");

        return statusService.getPaymentComplete(sysId, loginUser.getSysPlantCd());
    }

    @PostMapping("/status/payment_complete")
    public ResponseEntity<CommonResponse> paymentComplete(@RequestBody PaymentCompleteRequest paymentCompleteRequest,
                                                            HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        statusService.paymentComplete(
                paymentCompleteRequest,
                loginUser.getUserId(),
                loginUser.getSysPlantCd());

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("결제완료.")
                        .build()
        );
    }

    @PostMapping("/status/not_payment_complete")
    public ResponseEntity<CommonResponse> notPaymentComplete(@RequestBody PaymentNotCompleteRequest paymentNotCompleteRequest,
                                                                HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        statusService.paymentNotComplete(
                paymentNotCompleteRequest,
                loginUser.getUserId(),
                loginUser.getSysPlantCd());

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("미결제완료.")
                        .build()
        );
    }

    @GetMapping("/status/get_change_order")
    public PaymentCompleteResponse getChangeOrder(@RequestParam String sysId,
                                                   HttpSession session) {
        Login loginUser = (Login) session.getAttribute("loginUser");

        return statusService.getPaymentComplete(sysId, loginUser.getSysPlantCd());
    }

    @PostMapping("/status/change_order")
    public ResponseEntity<CommonResponse> changeOrder(@RequestBody List<String> listDetailSysId,
                                                        HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        statusService.changeOrder(listDetailSysId, loginUser.getUserId(), loginUser.getSysPlantCd());

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("주문 수정 완료.")
                        .build()
        );
    }

    @GetMapping("/status/search/cancel_reason")
    public StatusCancelResponse getStatusCancelResponses(@RequestParam String sysId,
                                                          HttpSession session) {
        Login loginUser = (Login) session.getAttribute("loginUser");

        return statusService.getStatusCancelResponses(sysId, loginUser.getSysPlantCd());
    }
}
