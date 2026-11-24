package htms.QROrder.system.billing;

import htms.QROrder.auth.LocalPostgresTestSupport;
import htms.QROrder.auth.TeamSchemaFixture;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.*;

/** 4C 구독 DDL을 실제 PostgreSQL에서 적용/거부/롤백한다(정책 §9, §11 커밋 2). */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Execution(ExecutionMode.SAME_THREAD)
class SubscriptionMigrationTest {
    static final String APPLY = "2026-11-25-subscription-billing.sql";
    static final String DRY_RUN = "2026-11-25-subscription-billing-dry-run.sql";
    static final String ROLLBACK = "2026-11-25-subscription-billing-rollback.sql";

    private LocalPostgresTestSupport database;
    private JdbcTemplate jdbc;

    @BeforeAll void start() throws Exception {
        database = LocalPostgresTestSupport.start();
        try {
            jdbc = new JdbcTemplate(database.dataSource("public"));
            TeamSchemaFixture.createCoreTables(jdbc);
            jdbc.execute(TeamSchemaFixture.migration(DRY_RUN));
            jdbc.execute(TeamSchemaFixture.migration(APPLY));
        } catch (Exception failure) {
            database.close();
            throw failure;
        }
    }

    @AfterAll void stop() throws Exception {
        if (database != null) database.close();
    }

    @BeforeEach void clean() {
        jdbc.execute("truncate table sys_billing_webhook_event, sys_subscription_invoice, sys_subscription");
    }

    @Test void reapplyAndDryRunAreBlockedOnceApplied() {
        assertThrows(DataAccessException.class, () -> jdbc.execute(TeamSchemaFixture.migration(APPLY)));
        assertThrows(DataAccessException.class, () -> jdbc.execute(TeamSchemaFixture.migration(DRY_RUN)));
    }

    @Test void onlyOneOpenSubscriptionPerStoreButExpiredRowsMayRepeat() {
        subscription("S1", "STORE", "EXPIRED");
        subscription("S2", "STORE", "EXPIRED");
        subscription("S3", "STORE", "PENDING");
        assertRejected("insert into sys_subscription(sys_id, plant_cd, owner_user_sys_id, status, insert_user_id, insert_datetime)"
                + " values ('S4','STORE','OWNER','ACTIVE','T',now())");
        subscription("S5", "OTHER", "ACTIVE");
    }

    @Test void subscriptionChecksRejectBadValues() {
        assertRejected("insert into sys_subscription(sys_id, plant_cd, owner_user_sys_id, status, insert_user_id, insert_datetime)"
                + " values ('X','STORE','OWNER','UNKNOWN','T',now())");
        assertRejected(withColumn("amount", "0"));
        assertRejected(withColumn("amount", "-1"));
        assertRejected(withColumn("currency", "'USD'"));
        assertRejected(withColumn("period_month", "0"));
        assertRejected(withColumn("role_granted_yn", "'X'"));
        assertRejected(withColumn("provider_end_status", "'SOMETIME'"));
        assertRejected(withColumn("payment_method_status", "'LOST'"));
        assertRejected("insert into sys_subscription(sys_id, plant_cd, status, insert_user_id, insert_datetime)"
                + " values ('X','STORE','PENDING','T',now())");
        assertEquals(0, jdbc.queryForObject("select count(*) from sys_subscription", Integer.class));
        jdbc.update(withColumn("amount", "9900"));
        assertEquals("N", jdbc.queryForObject("select role_granted_yn from sys_subscription", String.class));
        assertEquals("NONE", jdbc.queryForObject("select provider_end_status from sys_subscription", String.class));
    }

    @Test void providerSubscriptionIdIsUniquePerProviderStore() {
        jdbc.update("""
                insert into sys_subscription(sys_id, plant_cd, owner_user_sys_id, status, provider, provider_store_id,
                  provider_subscription_id, insert_user_id, insert_datetime)
                values ('S1','A','O1','EXPIRED','fake','store-1','sub-1','T',now())
                """);
        assertRejected("""
                insert into sys_subscription(sys_id, plant_cd, owner_user_sys_id, status, provider, provider_store_id,
                  provider_subscription_id, insert_user_id, insert_datetime)
                values ('S2','B','O2','ACTIVE','fake','store-1','sub-1','T',now())
                """);
        jdbc.update("""
                insert into sys_subscription(sys_id, plant_cd, owner_user_sys_id, status, provider, provider_store_id,
                  provider_subscription_id, insert_user_id, insert_datetime)
                values ('S3','B','O2','ACTIVE','fake','store-2','sub-1','T',now())
                """);
    }

    @Test void invoiceRejectsNullKeyBadRefundAndDuplicate() {
        subscription("S1", "STORE", "ACTIVE");
        invoice("I1", "inv-1", "10000", "0");
        assertRejected(invoiceSql("I2", null, "10000", "0"));
        assertRejected(invoiceSql("I2", "inv-2", "10000", "10001"));
        assertRejected(invoiceSql("I2", "inv-2", "10000", "-1"));
        assertRejected(invoiceSql("I2", "inv-1", "10000", "0"));
        assertRejected(invoiceSql("I2", "inv-2", "-1", "0"));
        assertRejected(invoiceSql("I2", "inv-2", "10000", "0").replace("'PAID'", "'LOST'"));
        assertRejected(invoiceSql("I2", "inv-2", "10000", "0").replace("'S1'", "'NO-SUCH'"));
        invoice("I3", "inv-3", "10000", "10000");
        assertEquals(2, jdbc.queryForObject("select count(*) from sys_subscription_invoice", Integer.class));
    }

    @Test void webhookEventRejectsNullIdAndDuplicate() {
        webhook("W1", "'wh-1'");
        assertRejected(webhookSql("W2", "null"));
        assertRejected(webhookSql("W2", "'wh-1'"));
        assertRejected(webhookSql("W2", "'wh-2'").replace("'PROCESSED'", "'MAYBE'"));
        webhook("W3", "'wh-3'");
        assertEquals(2, jdbc.queryForObject("select count(*) from sys_billing_webhook_event", Integer.class));
    }

    @Test void rollbackRefusesRowsThenDropsAndReapplies() throws Exception {
        subscription("S1", "STORE", "PENDING");
        assertThrows(DataAccessException.class, () -> jdbc.execute(TeamSchemaFixture.migration(ROLLBACK)));
        assertEquals(1, jdbc.queryForObject("select count(*) from sys_subscription", Integer.class));
        clean();
        jdbc.execute(TeamSchemaFixture.migration(ROLLBACK));
        assertNull(jdbc.queryForObject("select to_regclass('public.sys_subscription')::text", String.class));
        assertNull(jdbc.queryForObject("select to_regclass('public.sys_subscription_invoice')::text", String.class));
        assertNull(jdbc.queryForObject("select to_regclass('public.sys_billing_webhook_event')::text", String.class));
        jdbc.execute(TeamSchemaFixture.migration(DRY_RUN));
        jdbc.execute(TeamSchemaFixture.migration(APPLY));
        assertNotNull(jdbc.queryForObject("select to_regclass('public.sys_subscription')::text", String.class));
    }

    private String withColumn(String column, String value) {
        return "insert into sys_subscription(sys_id, plant_cd, owner_user_sys_id, status, " + column
                + ", insert_user_id, insert_datetime) values ('X','STORE','OWNER','PENDING'," + value + ",'T',now())";
    }

    private void subscription(String id, String store, String status) {
        jdbc.update("insert into sys_subscription(sys_id, plant_cd, owner_user_sys_id, status, insert_user_id, insert_datetime)"
                + " values (?,?,'OWNER',?,'T',now())", id, store, status);
    }

    private String invoiceSql(String id, String providerInvoiceId, String amount, String refunded) {
        return """
                insert into sys_subscription_invoice(sys_id, subscription_sys_id, provider, provider_store_id,
                  provider_invoice_id, charge_kind, amount, refunded_amount, currency, status, provider_updated_at,
                  insert_user_id, insert_datetime)
                values ('%s','S1','fake','store-1',%s,'RECURRING',%s,%s,'KRW','PAID',now(),'T',now())
                """.formatted(id, providerInvoiceId == null ? "null" : "'" + providerInvoiceId + "'", amount, refunded);
    }

    private void invoice(String id, String providerInvoiceId, String amount, String refunded) {
        jdbc.update(invoiceSql(id, providerInvoiceId, amount, refunded));
    }

    private String webhookSql(String id, String webhookId) {
        return """
                insert into sys_billing_webhook_event(sys_id, provider, provider_store_id, webhook_id, event_type,
                  received_at, result)
                values ('%s','fake','store-1',%s,'Invoice.Paid',now(),'PROCESSED')
                """.formatted(id, webhookId);
    }

    private void webhook(String id, String webhookId) {
        jdbc.update(webhookSql(id, webhookId));
    }

    private void assertRejected(String sql) {
        assertThrows(DataAccessException.class, () -> jdbc.update(sql), sql);
    }
}
