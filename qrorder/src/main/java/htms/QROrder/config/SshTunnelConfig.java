package htms.QROrder.config;

import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class SshTunnelConfig {

    @Value("${ssh.enabled:false}")
    private boolean sshEnabled;

    @Value("${ssh.host}")
    private String sshHost;

    @Value("${ssh.port:22}")
    private int sshPort;

    @Value("${ssh.user}")
    private String sshUser;

    @Value("${ssh.private-key.local:}")
    private String sshPrivateKeyLocal;

    @Value("${ssh.remote.host:localhost}")
    private String remoteHost;

    @Value("${ssh.remote.port:5432}")
    private int remotePort;

    @Value("${ssh.local.port:5432}")
    private int localPort;

    private Session session;

    private String getPrivateKeyPath() {

        return sshPrivateKeyLocal;
    }

    @Bean
    public Integer sshTunnel() throws Exception {
        if (!sshEnabled) {
            log.info("SSH 터널링이 비활성화되어 있습니다.");
            return localPort;
        }

        try {
            String privateKeyPath = getPrivateKeyPath();
            JSch jsch = new JSch();
            jsch.addIdentity(privateKeyPath);

            session = jsch.getSession(sshUser, sshHost, sshPort);
            session.setConfig("StrictHostKeyChecking", "no");

            // SSH Keep-Alive 설정 (연결 유지)
            session.setServerAliveInterval(60000);  // 60초마다 keep-alive 패킷 전송
            session.setServerAliveCountMax(10);      // 10번 응답 없으면 연결 종료

            session.connect();

            int assignedPort = session.setPortForwardingL(localPort, remoteHost, remotePort);
            log.info("SSH 터널 연결 성공: localhost:{} -> {}:{}", assignedPort, remoteHost, remotePort);

            return assignedPort;
        } catch (Exception e) {
            log.error("SSH 터널 연결 실패: {}", e.getMessage());
            throw e;
        }
    }

    @PreDestroy
    public void closeSSHTunnel() {
        if (session != null && session.isConnected()) {
            session.disconnect();
            log.info("SSH 터널 연결 종료");
        }
    }
}