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
    public static final String PARTICIPANTS_CHANGED = "PARTICIPANTS_CHANGED";

    private final SSEEmitterService emitterService;
    private final ConsumerVisitService visitService;
    private final ConsumerOrderSessionGuard sessionGuard;
    private final ConsumerParticipantRegistry participantRegistry;

    public SseEmitter subscribe(QrConnectResponse qrTableInfo, ConsumerSessionBinding binding,
                                String browserSessionId) {
        sessionGuard.requireMatchingBinding(qrTableInfo, binding);
        ConsumerVisitRecord visit = visitService.findBoundVisit(
                qrTableInfo, binding.getConsumerSessionId());
        sessionGuard.requireActiveVisit(visit);
        String channelId = channel(qrTableInfo.getSysPlantCd(), binding.getConsumerSessionId());
        int participantCount = participantRegistry.join(channelId, browserSessionId);
        SseEmitter emitter = emitterService.subscribe(channelId,
                () -> participantDisconnected(channelId, browserSessionId));
        emitterService.send(channelId, PARTICIPANTS_CHANGED, participantCount);
        return emitter;
    }

    public void publish(String sysPlantCd, String consumerSessionId, String eventName) {
        emitterService.send(channel(sysPlantCd, consumerSessionId), eventName, "");
    }

    private String channel(String sysPlantCd, String consumerSessionId) {
        return "consumer:" + sysPlantCd + ":" + consumerSessionId;
    }

    private void participantDisconnected(String channelId, String browserSessionId) {
        int participantCount = participantRegistry.leave(channelId, browserSessionId);
        emitterService.send(channelId, PARTICIPANTS_CHANGED, participantCount);
    }
}
