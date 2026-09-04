package htms.QROrder.consumer.order.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.client.dto.ClientNoticeResponse;
import htms.QROrder.client.dto.ClientQnaRequest;
import htms.QROrder.client.repository.ClientNoticeMapper;
import htms.QROrder.consumer.order.dto.ConsumerStaffCallRequest;
import htms.QROrder.consumer.order.dto.ConsumerStaffCallResponse;
import htms.QROrder.consumer.order.repository.ConsumerStaffCallMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ConsumerStaffCallService {

    private final ConsumerStaffCallMapper consumerStaffCallMapper;

    public void saveConsumerStaffCall(ConsumerStaffCallRequest consumerStaffCallRequest,
                                        String sysPlantCd) {

        String ULID = UlidCreator.getMonotonicUlid().toString();
        consumerStaffCallRequest.setSysId(ULID);

        consumerStaffCallMapper.saveConsumerStaffCall(consumerStaffCallRequest, sysPlantCd);
    }

    public List<ConsumerStaffCallResponse> getConsumerStaffCall(String sysPlantCd) {

        return consumerStaffCallMapper.getConsumerStaffCall(sysPlantCd);
    }
}
