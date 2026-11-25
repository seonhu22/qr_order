package htms.QROrder.config;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** 로컬 전용 기능은 pgjdbc가 실제로 붙을 호스트가 모두 루프백이고 SSH/프록시/소켓 팩토리가 없을 때만 켜진다. */
class LocalOnlyGuardTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "jdbc:postgresql://127.0.0.1:55432/qrdemo",
            "jdbc:postgresql://localhost/qrdemo?sslmode=disable",
            "jdbc:postgresql://127.10.0.3:5432/x",
            "jdbc:postgresql://[::1]:5432/x",
            "jdbc:postgresql://127.0.0.1:1,localhost:2/x",
            "jdbc:postgresql:qrdemo"})
    void loopbackDatabaseIsAllowed(String url) {
        assertDoesNotThrow(() -> LocalOnlyGuard.requireLoopbackDatabase(url, false, "test"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "jdbc:postgresql://10.0.0.5:5432/qr",
            "jdbc:postgresql://db.example.com/qr",
            "jdbc:postgresql://127.0.0.1.example.com/qr",
            "jdbc:postgresql://localhost.attacker.test/qr",
            "jdbc:postgresql://127.0.0.1:1,10.0.0.5:2/x",
            "jdbc:postgresql://localhost/qr?PGHOST=10.0.0.5",
            "jdbc:postgresql://localhost/qr?host=db.example.com",
            "jdbc:postgresql://127.0.0.1/qr?PGHOST=127.0.0.1,10.0.0.5&PGPORT=1,2",
            "jdbc:postgresql://localhost/qr?service=no-such-service",
            "jdbc:postgresql:///qr",
            "jdbc:postgresql://localhost/qr?socketFactory=org.example.ProxySocketFactory",
            "jdbc:postgresql://localhost/qr?socketFactoryArg=10.0.0.5",
            "jdbc:mysql://127.0.0.1/qr",
            "not-a-jdbc-url",
            ""})
    void nonLoopbackOrUnknownDatabaseFailsStartup(String url) {
        assertThrows(IllegalStateException.class, () -> LocalOnlyGuard.requireLoopbackDatabase(url, false, "test"));
    }

    @Test void nullUrlFails() {
        assertThrows(IllegalStateException.class, () -> LocalOnlyGuard.requireLoopbackDatabase(null, false, "test"));
    }

    @Test void sshTunnelFailsEvenWhenUrlLooksLocal() {
        // 팀 원격 DB는 SSH 터널로 localhost:15432에 보인다.
        assertThrows(IllegalStateException.class,
                () -> LocalOnlyGuard.requireLoopbackDatabase("jdbc:postgresql://localhost:15432/team", true, "test"));
    }

    @Test void socksProxyFailsEvenWhenHostIsLoopback() {
        String previous = System.getProperty("socksProxyHost");
        System.setProperty("socksProxyHost", "10.0.0.9");
        try {
            assertThrows(IllegalStateException.class,
                    () -> LocalOnlyGuard.requireLoopbackDatabase("jdbc:postgresql://127.0.0.1:55432/qrdemo", false, "test"));
        } finally {
            if (previous == null) System.clearProperty("socksProxyHost");
            else System.setProperty("socksProxyHost", previous);
        }
    }

    @Test void loopbackHostCheckUsesNoNameLookup() {
        assertTrue(LocalOnlyGuard.isLoopbackHost("127.0.0.1"));
        assertTrue(LocalOnlyGuard.isLoopbackHost("0:0:0:0:0:0:0:1"));
        assertFalse(LocalOnlyGuard.isLoopbackHost("127.0.0.256"));
        assertFalse(LocalOnlyGuard.isLoopbackHost("192.168.0.2"));
        assertFalse(LocalOnlyGuard.isLoopbackHost(null));
    }
}
