package htms.QROrder.client.service;

import htms.QROrder.client.dto.PaymentInfoDetailResponse;
import htms.QROrder.client.repository.PaymentInfoDetailMapper;
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

    public List<PaymentInfoDetailResponse> getPaymentInfoDetail(String masterSysId, String sysPlantCd) {

        if (sysPlantCd == null || sysPlantCd.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "매장 정보를 확인할 수 없습니다.");
        }
        return paymentInfoDetailMapper.getPaymentInfoDetail(masterSysId, sysPlantCd);
    }
}
