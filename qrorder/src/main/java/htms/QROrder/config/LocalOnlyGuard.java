package htms.QROrder.config;

import java.util.Locale;

/**
 * 로컬 시연 전용 기능(가짜 사업자 확인, 가짜 PG)의 공통 가드.
 * DB가 이 PC(루프백)이고 SSH 터널이 꺼져 있을 때만 켜진다. 터널은 localhost로 보여도 원격 DB라 막는다.
 */
public final class LocalOnlyGuard {
    private LocalOnlyGuard() {}

    /** 루프백 DB가 아니면 기동을 실패시킨다. */
    public static void requireLoopbackDatabase(String jdbcUrl, boolean sshEnabled, String feature) {
        if (sshEnabled) {
            throw new IllegalStateException(feature + "는 로컬 전용입니다: ssh.enabled=true(터널 너머 원격 DB)에서는 켤 수 없습니다.");
        }
        for (String host : jdbcHosts(jdbcUrl)) {
            if (!isLoopbackHost(host)) {
                throw new IllegalStateException(feature + "는 로컬 전용입니다: DB 호스트 '" + host + "'는 루프백이 아닙니다.");
            }
        }
    }

    /** {@code jdbc:postgresql://h1:p,h2/db?x} 의 호스트 목록. 형식을 모르면 빈 문자열 1개(= 루프백 아님). */
    static String[] jdbcHosts(String jdbcUrl) {
        if (jdbcUrl == null || !jdbcUrl.startsWith("jdbc:")) return new String[]{""};
        int start = jdbcUrl.indexOf("//");
        if (start < 0) return new String[]{""};
        String rest = jdbcUrl.substring(start + 2);
        int end = rest.indexOf('/');
        String authority = end < 0 ? rest : rest.substring(0, end);
        int query = authority.indexOf('?');
        if (query >= 0) authority = authority.substring(0, query);
        if (authority.isEmpty()) return new String[]{""};
        String[] hosts = authority.split(",");
        for (int i = 0; i < hosts.length; i++) hosts[i] = stripPort(hosts[i].trim());
        return hosts;
    }

    private static String stripPort(String hostPort) {
        if (hostPort.startsWith("[")) {
            int close = hostPort.indexOf(']');
            return close < 0 ? hostPort : hostPort.substring(1, close);
        }
        int colon = hostPort.indexOf(':');
        return colon < 0 ? hostPort : hostPort.substring(0, colon);
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
