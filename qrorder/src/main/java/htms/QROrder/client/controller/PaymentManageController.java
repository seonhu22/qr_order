package htms.QROrder.client.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.dto.*;
import htms.QROrder.client.service.*;
import htms.QROrder.common.dto.CommonResponse;
import htms.QROrder.common.dto.FileRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/client/payment_manage")
public class PaymentManageController {

    private final PaymentInfoMasterService paymentInfoMasterService;
    private final PaymentInfoDetailService paymentInfoDetailService;
    private final SettlementService settlementService;

    @GetMapping("/history/master/search")
    public List<PaymentInfoMasterResponse> getPaymentInfoMaster(@RequestParam String paymentStatus,
                                                                    HttpSession session) {

        Login login = (Login) session.getAttribute("loginUser");

        return paymentInfoMasterService.getPaymentInfoMaster(paymentStatus, login.getSysPlantCd());
    }

    @GetMapping("/history/detail/search/{masterSysId}")
    public List<PaymentInfoDetailResponse> getPaymentInfoDetail(@PathVariable String masterSysId) {

        return paymentInfoDetailService.getPaymentInfoMaster(masterSysId);
    }

    @GetMapping("/settlement/search")
    public SettlementResponse getSettlement(@RequestParam SettlementRequest settlementRequest,
                                HttpSession session) {

        Login login = (Login) session.getAttribute("loginUser");

        return settlementService.getSettlement(settlementRequest, login.getUserId(), login.getSysPlantCd());
    }
}
