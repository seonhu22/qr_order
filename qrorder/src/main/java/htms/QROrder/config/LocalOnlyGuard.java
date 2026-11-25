package htms.QROrder.config;

import org.postgresql.Driver;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Properties;

/**
 * 로컬 시연 전용 기능(가짜 사업자 확인, 가짜 PG)의 공통 가드.
 * DB가 이 PC(루프백)이고 SSH 터널이 꺼져 있을 때만 켜진다. 터널은 localhost로 보여도 원격 DB라 막는다.
 * 호스트는 URL 문자열이 아니라 pgjdbc가 실제로 쓸 값(URL 인자 {@code PGHOST}/{@code host}, service, 드라이버 기본 설정 반영)으로 판단한다.
 */
public final class LocalOnlyGuard {
    private static final String DRIVER_DEFAULTS = "org/postgresql/driverconfig.properties";
    private static final List<String> SOCKET_KEYS = List.of("socketFactory", "socketFactoryArg");
    private static final List<String> PROXY_KEYS = List.of("socksProxyHost", "java.net.useSystemProxies");

    private LocalOnlyGuard() {}

    /** 루프백 DB가 아니면 기동을 실패시킨다. */
    public static void requireLoopbackDatabase(String jdbcUrl, boolean sshEnabled, String feature) {
        if (sshEnabled) {
            throw new IllegalStateException(feature + "는 로컬 전용입니다: ssh.enabled=true(터널 너머 원격 DB)에서는 켤 수 없습니다.");
        }
        Properties resolved = jdbcUrl == null ? null : Driver.parseURL(jdbcUrl, driverDefaults());
        if (resolved == null) {
            throw new IllegalStateException(feature + "는 로컬 전용입니다: DB 주소를 해석할 수 없습니다.");
        }
        for (String key : SOCKET_KEYS) {
            if (!isBlank(resolved.getProperty(key))) {
                throw new IllegalStateException(feature + "는 로컬 전용입니다: DB 연결의 " + key + " 설정은 허용하지 않습니다.");
            }
        }
        for (String key : PROXY_KEYS) {
            String value = System.getProperty(key);
            if (!isBlank(value) && !"false".equalsIgnoreCase(value)) {
                throw new IllegalStateException(feature + "는 로컬 전용입니다: 프록시(" + key + ")가 켜져 있습니다.");
            }
        }
        for (String host : resolved.getProperty("PGHOST", "").split(",", -1)) {
            if (!isLoopbackHost(host)) {
                throw new IllegalStateException(feature + "는 로컬 전용입니다: DB 호스트 '" + host + "'는 루프백이 아닙니다.");
            }
        }
    }

    /** pgjdbc {@code Driver}와 같은 방식으로 클래스패스의 드라이버 기본 설정을 읽는다. */
    private static Properties driverDefaults() {
        Properties defaults = new Properties();
        try {
            ClassLoader loader = Driver.class.getClassLoader();
            if (loader == null) loader = ClassLoader.getSystemClassLoader();
            List<URL> urls = new ArrayList<>(Collections.list(loader.getResources(DRIVER_DEFAULTS)));
            Collections.reverse(urls);
            for (URL url : urls) {
                try (InputStream in = url.openStream()) {
                    defaults.load(in);
                }
            }
        } catch (IOException e) {
            throw new IllegalStateException("pgjdbc 기본 설정을 읽지 못했습니다.", e);
        }
        return defaults;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    /** 이름 조회 없이 문자열로만 판단한다(DNS 이름으로 루프백을 흉내 내지 못하게). */
    public static boolean isLoopbackHost(String host) {
        if (host == null) return false;
        String value = host.trim().toLowerCase(Locale.ROOT);
        if (value.startsWith("[") && value.endsWith("]")) value = value.substring(1, value.length() - 1);
        if (value.equals("localhost") || value.equals("::1") || value.equals("0:0:0:0:0:0:0:1")) return true;
        String[] parts = value.split("\\.", -1);
        if (parts.length != 4 || !parts[0].equals("127")) return false;
        for (String part : parts) {
            if (part.isEmpty() || part.length() > 3 || !part.chars().allMatch(Character::isDigit)
                    || Integer.parseInt(part) > 255) return false;
        }
        return true;
    }
}
