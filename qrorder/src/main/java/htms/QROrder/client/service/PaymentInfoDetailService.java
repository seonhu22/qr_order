package htms.QROrder.client.service;

import htms.QROrder.client.dto.PaymentInfoDetailResponse;
import htms.QROrder.client.dto.PaymentInfoMasterResponse;
import htms.QROrder.client.repository.PaymentInfoDetailMapper;
import htms.QROrder.client.repository.PaymentInfoMasterMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class PaymentInfoDetailService {

    private final PaymentInfoDetailMapper paymentInfoDetailMapper;

    public List<PaymentInfoDetailResponse> getPaymentInfoMaster(String masterSysId) {

        return paymentInfoDetailMapper.getPaymentInfoDetail(masterSysId);
    }
}
