package htms.QROrder.client.controller;


import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.dto.*;
import htms.QROrder.client.service.OrderHistoryService;
import htms.QROrder.client.service.StatusService;
import htms.QROrder.common.dto.CommonResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/client/order_manage")
public class OrderManageController {

    private final StatusService statusService;
    private final OrderHistoryService orderHistoryService;

    @GetMapping("/status/search")
    public List<StatusResponse> getStatus() {

        return statusService.getStatus();
    }

    @PostMapping("/status/cancel_order")
    public ResponseEntity<CommonResponse> cancelOrder(@RequestBody StatusRequest statusRequest,
                                                        HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        statusService.cancelOrder(statusRequest, loginUser.getUserId());

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

        statusService.goToCooking(statusRequest, loginUser.getUserId());

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

        statusService.backToReceiveOrder(statusRequest, loginUser.getUserId());

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

        statusService.goToServingComplete(statusRequest, loginUser.getUserId());

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

        statusService.backToCooking(statusRequest, loginUser.getUserId());

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("이전 상태 변경 완료.")
                        .build()
        );
    }

    @PostMapping("/status/get_payment_complete")
    public PaymentCompleteResponse getPaymentComplete(@RequestBody StatusRequest statusRequest) {

        return statusService.getPaymentComplete(statusRequest);
    }

    @PostMapping("/status/payment_complete")
    public ResponseEntity<CommonResponse> paymentComplete(@RequestBody PaymentCompleteRequest paymentCompleteRequest,
                                                            HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        statusService.paymentComplete(paymentCompleteRequest, loginUser.getUserId());

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

        statusService.paymentNotComplete(paymentNotCompleteRequest, loginUser.getUserId());

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("미결제완료.")
                        .build()
        );
    }

    @GetMapping("/status/search/cancel_reason")
    public StatusCancelResponse getStatusCancelResponses(StatusRequest statusRequest) {

        return statusService.getStatusCancelResponses(statusRequest);
    }

    @GetMapping("/history/search")
    public OrderHistoryResponse getOrderHistory(@RequestParam String orderStatus) {

        return orderHistoryService.getOrderHistory(orderStatus);
    }
}
