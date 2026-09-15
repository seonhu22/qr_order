package htms.QROrder.client.service;

import htms.QROrder.client.dto.PaymentInfoMasterResponse;
import htms.QROrder.client.repository.PaymentInfoMasterMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class PaymentInfoMasterService {

    private final PaymentInfoMasterMapper paymentInfoMasterMapper;

    public List<PaymentInfoMasterResponse> getPaymentInfoMaster(String paymentStatus,
                                                                    LocalDate startDate,
                                                                    LocalDate endDate,
                                                                    String sysPlantCd) {

        return paymentInfoMasterMapper.getPaymentInfoMaster(paymentStatus, startDate, endDate, sysPlantCd);
    }
}
