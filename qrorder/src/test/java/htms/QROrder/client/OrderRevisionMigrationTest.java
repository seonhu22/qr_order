package htms.QROrder.client;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OrderRevisionMigrationTest {

    private static final String MIGRATION = "db/migration/2026-10-12-client-order-revision.sql";
    private static final String DRY_RUN = "db/migration/2026-10-12-client-order-revision-dry-run.sql";
    private static final String ROLLBACK = "db/migration/2026-10-12-client-order-revision-rollback.sql";

    @Test
    void migrationDefinesPersistentIdempotencyAndRemovalConstraints() throws IOException {
        String sql = resource(MIGRATION);

        assertContains(sql,
                "CREATE TABLE public.client_order_revision",
                "UNIQUE (sys_plant_cd, client_request_id)",
                "REFERENCES public.order_master (sys_id)",
                "REFERENCES public.table_info (sys_id)",
                "CREATE TABLE public.client_order_revision_removed_detail",
                "UNIQUE (order_detail_sys_id)",
                "REFERENCES public.client_order_revision (sys_id)",
                "REFERENCES public.order_detail (sys_id)",
                "CREATE INDEX client_order_revision_master_datetime_idx");
        assertFalse(sql.toUpperCase().contains("ON DELETE CASCADE"));
    }

    @Test
    void migrationDocumentsEveryTableColumnConstraintAndIndex() throws IOException {
        String sql = resource(MIGRATION);

        assertContains(sql,
                "COMMENT ON TABLE public.client_order_revision",
                "COMMENT ON TABLE public.client_order_revision_removed_detail",
                "COMMENT ON COLUMN public.client_order_revision.complete_datetime",
                "COMMENT ON COLUMN public.client_order_revision_removed_detail.removed_datetime",
                "COMMENT ON CONSTRAINT client_order_revision_completion_chk",
                "COMMENT ON CONSTRAINT client_order_revision_removed_detail_detail_fk",
                "COMMENT ON INDEX public.client_order_revision_plant_request_uk",
                "COMMENT ON INDEX public.client_order_revision_removed_detail_detail_uk",
                "COMMENT ON INDEX public.client_order_revision_master_datetime_idx");
    }

    @Test
    void dryRunOnlyReadsCatalogAndRaisesDiagnostics() throws IOException {
        String executableSql = stripLineComments(resource(DRY_RUN)).toUpperCase();

        assertContains(executableSql,
                "PG_ATTRIBUTE",
                "PG_CONSTRAINT",
                "CONNAMESPACE = 'PUBLIC'::REGNAMESPACE",
                "TO_REGCLASS('PUBLIC.' || TARGET_RELATION)",
                "CLIENT_ORDER_REVISION_PKEY",
                "CLIENT_ORDER_REVISION_PLANT_REQUEST_UK",
                "CLIENT_ORDER_REVISION_REMOVED_DETAIL_PKEY",
                "CLIENT_ORDER_REVISION_REMOVED_DETAIL_DETAIL_UK",
                "RAISE NOTICE");
        assertFalse(executableSql.matches("(?s).*\\b(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|TRUNCATE|COMMENT)\\b.*"));
    }

    @Test
    void rollbackDropsOnlyTheTwoNewTablesWithoutCascade() throws IOException {
        String executableSql = stripLineComments(resource(ROLLBACK)).toUpperCase();

        assertContains(executableSql,
                "OBJ_DESCRIPTION('PUBLIC.CLIENT_ORDER_REVISION'::REGCLASS, 'PG_CLASS')",
                "OBJ_DESCRIPTION(CON.OID, 'PG_CONSTRAINT') IS NOT NULL",
                "ACTUAL_CONSTRAINT_TYPE IS DISTINCT FROM EXPECTED_CONSTRAINT.CONSTRAINT_TYPE",
                "IF ACTUAL_COUNT <> EXPECTED_COUNT",
                "DROP TABLE PUBLIC.CLIENT_ORDER_REVISION_REMOVED_DETAIL",
                "DROP TABLE PUBLIC.CLIENT_ORDER_REVISION");
        assertFalse(executableSql.contains("CASCADE"));
        assertFalse(executableSql.contains("DROP TABLE IF EXISTS"));
        assertFalse(executableSql.matches("(?s).*\\b(DELETE|TRUNCATE|ALTER)\\b.*"));
    }

    private static String resource(String path) throws IOException {
        try (InputStream input = OrderRevisionMigrationTest.class.getClassLoader().getResourceAsStream(path)) {
            if (input == null) {
                throw new IllegalStateException("Missing test resource: " + path);
            }
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private static String stripLineComments(String sql) {
        return sql.replaceAll("(?m)^\\s*--.*$", "");
    }

    private static void assertContains(String value, String... fragments) {
        for (String fragment : fragments) {
            assertTrue(value.contains(fragment), () -> "Missing SQL fragment: " + fragment);
        }
    }
}
