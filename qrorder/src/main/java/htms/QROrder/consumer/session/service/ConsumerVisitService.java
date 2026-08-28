package htms.QROrder.consumer.session.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.consumer.session.dto.ConsumerVisitRecord;
import htms.QROrder.consumer.session.repository.ConsumerVisitMapper;
import htms.QROrder.qr.dto.QrConnectResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ConsumerVisitService {

    private final ConsumerVisitMapper consumerVisitMapper;

    @Transactional
    public ConsumerVisitRecord resolveActiveVisit(QrConnectResponse qrTableInfo) {
        String tableSysId = qrTableInfo.getSysId();
        String sysPlantCd = qrTableInfo.getSysPlantCd();

        if (consumerVisitMapper.lockAvailableTable(tableSysId, sysPlantCd) == null) {
            throw new IllegalStateException("현재 사용할 수 없는 테이블입니다.");
        }

        ConsumerVisitRecord visit = consumerVisitMapper.findActiveConsumerVisit(tableSysId, sysPlantCd);

        if (visit != null && visit.isExpired() && !visit.isHasOrders()) {
            int deleted = consumerVisitMapper.deleteExpiredEmptyConsumerVisit(
                    visit.getConsumerSessionId(), tableSysId, sysPlantCd);
            visit = deleted == 1
                    ? null
                    : consumerVisitMapper.findActiveConsumerVisit(tableSysId, sysPlantCd);
        }

        if (visit == null) {
            String consumerSessionId = UlidCreator.getMonotonicUlid().toString();
            consumerVisitMapper.insertConsumerVisit(consumerSessionId, tableSysId, sysPlantCd);
            return requireVisit(consumerVisitMapper.findConsumerVisit(
                    consumerSessionId, tableSysId, sysPlantCd));
        }

        consumerVisitMapper.touchActiveConsumerVisit(
                visit.getConsumerSessionId(), tableSysId, sysPlantCd);
        return requireVisit(consumerVisitMapper.findConsumerVisit(
                visit.getConsumerSessionId(), tableSysId, sysPlantCd));
    }

    public ConsumerVisitRecord findBoundVisit(QrConnectResponse qrTableInfo,
                                               String consumerSessionId) {
        return consumerVisitMapper.findConsumerVisit(
                consumerSessionId, qrTableInfo.getSysId(), qrTableInfo.getSysPlantCd());
    }

    @Transactional
    public ConsumerVisitRecord lockBoundVisit(QrConnectResponse qrTableInfo,
                                               String consumerSessionId) {
        String lockedVisitId = consumerVisitMapper.lockConsumerVisit(
                consumerSessionId, qrTableInfo.getSysId(), qrTableInfo.getSysPlantCd());
        if (lockedVisitId == null) {
            return null;
        }
        return consumerVisitMapper.findConsumerVisit(
                consumerSessionId, qrTableInfo.getSysId(), qrTableInfo.getSysPlantCd());
    }

    @Transactional
    public ConsumerVisitRecord touchBoundVisit(QrConnectResponse qrTableInfo,
                                                String consumerSessionId) {
        consumerVisitMapper.touchActiveConsumerVisit(
                consumerSessionId, qrTableInfo.getSysId(), qrTableInfo.getSysPlantCd());
        return consumerVisitMapper.findConsumerVisit(
                consumerSessionId, qrTableInfo.getSysId(), qrTableInfo.getSysPlantCd());
    }

    public String findStoreName(String sysPlantCd) {
        String storeName = consumerVisitMapper.findStoreName(sysPlantCd);
        if (storeName == null) {
            throw new IllegalStateException("Consumer 매장 정보를 확인할 수 없습니다.");
        }
        return storeName;
    }

    private ConsumerVisitRecord requireVisit(ConsumerVisitRecord visit) {
        if (visit == null) {
            throw new IllegalStateException("Consumer 방문 정보를 확인할 수 없습니다.");
        }
        return visit;
    }
}
