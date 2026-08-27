package htms.QROrder.consumer.session.service;

import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.consumer.session.dto.ConsumerSessionResponse;
import htms.QROrder.consumer.session.dto.ConsumerVisitRecord;
import htms.QROrder.qr.dto.QrConnectResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ConsumerSessionService {

    private final ConsumerVisitService consumerVisitService;

    public ConsumerSessionResponse getSession(QrConnectResponse qrTableInfo,
                                               ConsumerSessionBinding binding) {
        ConsumerSessionBinding validBinding = belongsToQr(binding, qrTableInfo) ? binding : null;
        ConsumerVisitRecord visit = validBinding == null
                ? consumerVisitService.resolveActiveVisit(qrTableInfo)
                : consumerVisitService.findBoundVisit(qrTableInfo, validBinding.getConsumerSessionId());

        if (visit == null) {
            return expiredResponse(qrTableInfo, validBinding);
        }

        String status = statusOf(visit);
        if (validBinding != null && "ACTIVE".equals(status)) {
            visit = consumerVisitService.touchBoundVisit(qrTableInfo, visit.getConsumerSessionId());
            if (visit == null) {
                return expiredResponse(qrTableInfo, validBinding);
            }
            status = statusOf(visit);
        }

        return response(qrTableInfo, visit, status);
    }

    private boolean belongsToQr(ConsumerSessionBinding binding, QrConnectResponse qrTableInfo) {
        return binding != null
                && binding.belongsTo(qrTableInfo.getSysPlantCd(), qrTableInfo.getSysId());
    }

    private String statusOf(ConsumerVisitRecord visit) {
        if ("02".equals(visit.getOrderStatus())) {
            return "CLOSED";
        }
        if (!"01".equals(visit.getOrderStatus())) {
            throw new IllegalStateException("지원하지 않는 Consumer 방문 상태입니다.");
        }
        return visit.isExpired() ? "EXPIRED" : "ACTIVE";
    }

    private ConsumerSessionResponse response(QrConnectResponse qrTableInfo,
                                             ConsumerVisitRecord visit,
                                             String status) {
        return new ConsumerSessionResponse(
                visit.getConsumerSessionId(),
                status,
                qrTableInfo.getSysPlantCd(),
                visit.getStoreName(),
                qrTableInfo.getSysId(),
                qrTableInfo.getTableName(),
                qrTableInfo.getTableNum(),
                qrTableInfo.getTableQty(),
                visit.getStartedAt()
        );
    }

    private ConsumerSessionResponse expiredResponse(QrConnectResponse qrTableInfo,
                                                     ConsumerSessionBinding binding) {
        if (binding == null) {
            throw new IllegalStateException("Consumer 방문 바인딩을 확인할 수 없습니다.");
        }
        return new ConsumerSessionResponse(
                binding.getConsumerSessionId(),
                "EXPIRED",
                qrTableInfo.getSysPlantCd(),
                consumerVisitService.findStoreName(qrTableInfo.getSysPlantCd()),
                qrTableInfo.getSysId(),
                qrTableInfo.getTableName(),
                qrTableInfo.getTableNum(),
                qrTableInfo.getTableQty(),
                binding.getStartedAt()
        );
    }
}
