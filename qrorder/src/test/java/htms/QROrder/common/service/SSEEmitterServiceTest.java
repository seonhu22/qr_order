package htms.QROrder.common.service;

import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SSEEmitterServiceTest {

    @Test
    void removesEmitterWhenInitialConnectSendFails() {
        SSEEmitterService service = new SSEEmitterService();

        service.subscribe("channel-1", new FailingEmitter());

        assertEquals(0, service.subscriberCount("channel-1"));
    }

    private static final class FailingEmitter extends SseEmitter {
        @Override
        public void send(SseEventBuilder builder) throws IOException {
            throw new IOException("closed");
        }
    }
}
