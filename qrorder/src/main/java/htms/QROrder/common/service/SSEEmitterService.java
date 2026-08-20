package htms.QROrder.common.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
public class SSEEmitterService {

    private final Map<String, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String channelId) {

        SseEmitter emitter = new SseEmitter(0L);

        emitters.computeIfAbsent(channelId, key -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> remove(channelId, emitter));
        emitter.onTimeout(() -> remove(channelId, emitter));
        emitter.onError(e -> remove(channelId, emitter));

        try {
            emitter.send(SseEmitter.event().name("connect").data("connected"));
        }
        catch (IOException e) {
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
            catch (IOException e) {
                remove(channelId, emitter);
            }
        }
    }

    private void remove(String channelId, SseEmitter emitter) {

        List<SseEmitter> channelEmitters = emitters.get(channelId);

        if (channelEmitters != null) {
            channelEmitters.remove(emitter);
        }
    }
}