package htms.QROrder.consumer.order.service;

import htms.QROrder.consumer.order.exception.ConsumerOrderSessionGoneException;
import htms.QROrder.consumer.order.exception.ConsumerOrderSessionRequiredException;
import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.consumer.session.dto.ConsumerVisitRecord;
import htms.QROrder.qr.dto.QrConnectResponse;
import org.springframework.stereotype.Component;

@Component
public class ConsumerOrderSessionGuard {

    public void requireMatchingBinding(QrConnectResponse qrTableInfo,
                                       ConsumerSessionBinding binding) {
        if (binding == null
                || !binding.belongsTo(qrTableInfo.getSysPlantCd(), qrTableInfo.getSysId())) {
            throw new ConsumerOrderSessionRequiredException(
                    "Consumer 방문 세션을 먼저 확인해주세요.");
        }
    }

    public void requireActiveVisit(ConsumerVisitRecord visit) {
        if (visit == null || !"01".equals(visit.getOrderStatus()) || visit.isExpired()) {
            throw new ConsumerOrderSessionGoneException("종료되었거나 만료된 방문입니다.");
        }
    }
}
