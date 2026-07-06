package htms.QROrder.client.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.dto.*;
import htms.QROrder.client.service.*;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/client/payment_manage")
public class PaymentManageController {

    private final PaymentInfoMasterService paymentInfoMasterService;
    private final PaymentInfoDetailService paymentInfoDetailService;
    private final SettlementService settlementService;

    // 결제 목록 조회
    @GetMapping("/history/master/search")
    public List<PaymentInfoMasterResponse> getPaymentInfoMaster(@RequestParam String paymentStatus,
                                                                    @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
                                                                    @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
                                                                    HttpSession session) {

        Login login = (Login) session.getAttribute("loginUser");

        return paymentInfoMasterService.getPaymentInfoMaster(paymentStatus, startDate, endDate, login.getSysPlantCd());
    }

    @GetMapping("/history/detail/search/{masterSysId}")
    public List<PaymentInfoDetailResponse> getPaymentInfoDetail(@PathVariable String masterSysId) {

        return paymentInfoDetailService.getPaymentInfoDetail(masterSysId);
    }

    // 정산 조회
    @GetMapping("/settlement/search")
    public SettlementResponse getSettlement(@ModelAttribute SettlementRequest settlementRequest,
                                                HttpSession session) {

        Login login = (Login) session.getAttribute("loginUser");

        return settlementService.getSettlement(settlementRequest, login.getUserId(), login.getSysPlantCd());
    }
}
