package htms.QROrder.auth;

import org.junit.jupiter.api.Assumptions;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.util.FileSystemUtils;

import javax.sql.DataSource;
import java.io.IOException;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

/** An independent disposable cluster; never reads application DB configuration. */
public final class LocalPostgresTestSupport implements AutoCloseable {
    private final Path binaries;
    private final Path workspace;
    private final Path data;
    private final int port;
    private boolean started;

    private LocalPostgresTestSupport(Path binaries, Path workspace, int port) {
        this.binaries = binaries;
        this.workspace = workspace;
        this.data = workspace.resolve("data");
        this.port = port;
    }

    public static LocalPostgresTestSupport start() throws Exception {
        String configured = System.getenv("QRORDER_TEST_POSTGRES_BIN");
        Path binaries = configured == null || configured.isBlank()
                ? Path.of("C:/Program Files/PostgreSQL/16/bin") : Path.of(configured);
        boolean windows = System.getProperty("os.name").toLowerCase().contains("win");
        String suffix = windows ? ".exe" : "";
        Assumptions.assumeTrue(Files.isRegularFile(binaries.resolve("initdb" + suffix))
                        && Files.isRegularFile(binaries.resolve("pg_ctl" + suffix))
                        && Files.isRegularFile(binaries.resolve("postgres" + suffix)),
                "Local PostgreSQL binaries unavailable; real persistence checks were NOT executed.");
        int port;
        try (ServerSocket socket = new ServerSocket(0, 1, InetAddress.getByName("127.0.0.1"))) {
            port = socket.getLocalPort();
        }
        Path temporaryRoot = Files.createDirectories(Path.of("build", "tmp")).toRealPath();
        Path workspace = Files.createTempDirectory(temporaryRoot, "user-auth-postgres-");
        var database = new LocalPostgresTestSupport(binaries, workspace, port);
        try {
            database.command("initdb", "--pgdata=" + database.data, "--username=qa_owner", "--auth=trust",
                    "--encoding=UTF8", "--no-locale", "--nosync");
            database.command("pg_ctl", "-D", database.data.toString(), "-l", workspace.resolve("postgres.log").toString(),
                    "-o", "-h 127.0.0.1 -p " + port + " -F -c max_connections=12",
                    "-w", "-t", "30", "start");
            database.started = true;
            return database;
        } catch (Exception failure) {
            // pg_ctl may have launched postgres even when its wait operation failed.
            database.started = Files.exists(database.data.resolve("postmaster.pid"));
            try {
                database.close();
            } catch (Exception cleanup) {
                failure.addSuppressed(cleanup);
            }
            throw failure;
        }
    }

    public DataSource dataSource() {
        return dataSource("qa_auth");
    }

    /** Same disposable cluster with another search path, e.g. "public" to run migration files as written. */
    public DataSource dataSource(String schema) {
        return new DriverManagerDataSource("jdbc:postgresql://127.0.0.1:" + port
                + "/postgres?currentSchema=" + schema + "&ApplicationName=qr-auth-persistence&connectTimeout=5&socketTimeout=20",
                "qa_owner", "");
    }

    private void command(String executable, String... arguments) throws Exception {
        String suffix = System.getProperty("os.name").toLowerCase().contains("win") ? ".exe" : "";
        List<String> command = new ArrayList<>();
        command.add(binaries.resolve(executable + suffix).toString());
        command.addAll(List.of(arguments));
        Path log = workspace.resolve(executable + "-command.log");
        Process process = new ProcessBuilder(command).redirectErrorStream(true).redirectOutput(log.toFile()).start();
        if (!process.waitFor(45, TimeUnit.SECONDS)) {
            process.descendants().forEach(ProcessHandle::destroyForcibly);
            process.destroyForcibly();
            throw new IOException(executable + " timed out; test cluster: " + workspace);
        }
        if (process.exitValue() != 0) {
            String output = Files.readString(log, StandardCharsets.UTF_8);
            throw new IOException(executable + " failed: " + output.substring(Math.max(0, output.length() - 2000)));
        }
    }

    @Override
    public void close() throws Exception {
        if (started) {
            stop();
            started = false;
        }
        FileSystemUtils.deleteRecursively(workspace);
    }

    private void stop() throws Exception {
        try {
            command("pg_ctl", "-D", data.toString(), "-m", "fast", "-w", "-t", "30", "stop");
        } catch (Exception first) {
            try { command("pg_ctl", "-D", data.toString(), "-m", "immediate", "-w", "-t", "15", "stop"); }
            catch (Exception second) { first.addSuppressed(second); throw first; }
        }
    }
}
