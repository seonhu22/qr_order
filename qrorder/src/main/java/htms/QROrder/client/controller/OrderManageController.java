package htms.QROrder.client.controller;


import htms.QROrder.client.dto.OrderHistoryResponse;
import htms.QROrder.client.service.OrderHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/client/order_manage")
public class OrderManageController {

    private final OrderHistoryService orderHistoryService;

    @GetMapping("/history")
    public OrderHistoryResponse getOrderHistory(@RequestParam String orderStatus) {

        return orderHistoryService.getOrderHistory(orderStatus);
    }
}
