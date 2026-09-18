package htms.QROrder.consumer.event.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/** 단일 서버 인스턴스에서 방문별로 연결 중인 고유 브라우저 세션을 센다. */
@Service
public class ConsumerParticipantRegistry {

    private final Map<String, Map<String, Integer>> connections = new HashMap<>();

    public synchronized int join(String channelId, String browserSessionId) {
        Map<String, Integer> visitConnections =
                connections.computeIfAbsent(channelId, ignored -> new HashMap<>());
        visitConnections.merge(browserSessionId, 1, Integer::sum);
        return visitConnections.size();
    }

    public synchronized int leave(String channelId, String browserSessionId) {
        Map<String, Integer> visitConnections = connections.get(channelId);
        if (visitConnections == null) {
            return 0;
        }

        visitConnections.computeIfPresent(browserSessionId,
                (ignored, count) -> count > 1 ? count - 1 : null);
        if (visitConnections.isEmpty()) {
            connections.remove(channelId);
            return 0;
        }
        return visitConnections.size();
    }
}
