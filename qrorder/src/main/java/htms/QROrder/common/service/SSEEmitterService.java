package htms.QROrder.common.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
public class SSEEmitterService {

    private static final long EMITTER_TIMEOUT_MILLIS = 30 * 60 * 1_000L;
    private static final long RECONNECT_MILLIS = 3_000L;

    private final Map<String, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String channelId) {
        return subscribe(channelId, new SseEmitter(EMITTER_TIMEOUT_MILLIS));
    }

    SseEmitter subscribe(String channelId, SseEmitter emitter) {
        emitters.computeIfAbsent(channelId, key -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> remove(channelId, emitter));
        emitter.onTimeout(() -> remove(channelId, emitter));
        emitter.onError(e -> remove(channelId, emitter));

        try {
            emitter.send(SseEmitter.event()
                    .name("connect")
                    .reconnectTime(RECONNECT_MILLIS)
                    .data(""));
        }
        catch (IOException | IllegalStateException e) {
            remove(channelId, emitter);
        }

        return emitter;
    }

    public void send(String channelId, String eventName, Object data) {

        List<SseEmitter> channelEmitters = emitters.get(channelId);

        if (channelEmitters == null) {
            return;
        }

        for (SseEmitter emitter : channelEmitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            }
            catch (IOException | IllegalStateException e) {
                remove(channelId, emitter);
            }
        }
    }

    @Scheduled(fixedRate = 25_000L)
    public void heartbeat() {
        for (String channelId : List.copyOf(emitters.keySet())) {
            send(channelId, "heartbeat", "");
        }
    }

    int subscriberCount(String channelId) {
        List<SseEmitter> channelEmitters = emitters.get(channelId);
        return channelEmitters == null ? 0 : channelEmitters.size();
    }

    private void remove(String channelId, SseEmitter emitter) {

        List<SseEmitter> channelEmitters = emitters.get(channelId);

        if (channelEmitters != null) {
            channelEmitters.remove(emitter);
            if (channelEmitters.isEmpty()) {
                emitters.remove(channelId, channelEmitters);
            }
        }
    }
}
