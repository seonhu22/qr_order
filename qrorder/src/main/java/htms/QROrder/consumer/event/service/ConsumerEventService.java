package htms.QROrder.consumer.event.service;

import htms.QROrder.common.service.SSEEmitterService;
import htms.QROrder.consumer.order.service.ConsumerOrderSessionGuard;
import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.consumer.session.dto.ConsumerVisitRecord;
import htms.QROrder.consumer.session.service.ConsumerVisitService;
import htms.QROrder.qr.dto.QrConnectResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
@RequiredArgsConstructor
public class ConsumerEventService {

    public static final String ORDER_CREATED = "ORDER_CREATED";
    public static final String STATUS_CHANGED = "STATUS_CHANGED";
    public static final String VISIT_CLOSED = "VISIT_CLOSED";

    private final SSEEmitterService emitterService;
    private final ConsumerVisitService visitService;
    private final ConsumerOrderSessionGuard sessionGuard;

    public SseEmitter subscribe(QrConnectResponse qrTableInfo, ConsumerSessionBinding binding) {
        sessionGuard.requireMatchingBinding(qrTableInfo, binding);
        ConsumerVisitRecord visit = visitService.findBoundVisit(
                qrTableInfo, binding.getConsumerSessionId());
        sessionGuard.requireActiveVisit(visit);
        return emitterService.subscribe(channel(qrTableInfo.getSysPlantCd(), binding.getConsumerSessionId()));
    }

    public void publish(String sysPlantCd, String consumerSessionId, String eventName) {
        emitterService.send(channel(sysPlantCd, consumerSessionId), eventName, "");
    }

    private String channel(String sysPlantCd, String consumerSessionId) {
        return "consumer:" + sysPlantCd + ":" + consumerSessionId;
    }
}
