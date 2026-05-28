package htms.QROrder.client.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.client.dto.ClientUserItem;
import htms.QROrder.client.dto.ClientUserRequest;
import htms.QROrder.client.dto.ClientUserResponse;
import htms.QROrder.client.dto.PaymentInfoMasterResponse;
import htms.QROrder.client.repository.ClientUserMapper;
import htms.QROrder.client.repository.PaymentInfoMasterMapper;
import htms.QROrder.common.exception.DuplicateException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class PaymentInfoMasterService {

    private final PaymentInfoMasterMapper paymentInfoMasterMapper;

    public List<PaymentInfoMasterResponse> getPaymentInfoMaster(String paymentStatus,
                                                                    String sysPlantCd) {

        return paymentInfoMasterMapper.getPaymentInfoMaster(paymentStatus, sysPlantCd);
    }
}
