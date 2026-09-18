package htms.QROrder.consumer.event;

import htms.QROrder.consumer.event.service.ConsumerParticipantRegistry;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ConsumerParticipantRegistryTest {

    private final ConsumerParticipantRegistry registry = new ConsumerParticipantRegistry();

    @Test
    void countsUniqueBrowserSessionsAndKeepsMultipleTabsAsOneParticipant() {
        assertEquals(1, registry.join("visit-1", "browser-1"));
        assertEquals(1, registry.join("visit-1", "browser-1"));
        assertEquals(2, registry.join("visit-1", "browser-2"));

        assertEquals(2, registry.leave("visit-1", "browser-1"));
        assertEquals(1, registry.leave("visit-1", "browser-1"));
        assertEquals(0, registry.leave("visit-1", "browser-2"));
    }
}
