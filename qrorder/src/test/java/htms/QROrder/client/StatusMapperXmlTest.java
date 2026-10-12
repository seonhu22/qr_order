package htms.QROrder.client;

import htms.QROrder.client.dto.StatusItem;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StatusMapperXmlTest {

    private Configuration configuration;

    @BeforeEach
    void setUp() throws Exception {
        configuration = new Configuration();
        String resource = "mapper/client/StatusMapper.xml";
        try (InputStream input = Resources.getResourceAsStream(resource)) {
            new XMLMapperBuilder(input, configuration, resource, configuration.getSqlFragments()).parse();
        }
    }

    @Test
    void scopesPaymentReadsToLoginPlant() {
        StatusItem.Header header = new StatusItem.Header();
        header.setSysId("ORDER-1");
        Map<String, Object> parameters = Map.of("header", header, "sysPlantCd", "PLANT-1");

        for (String statement : new String[]{
                "getPaymentCompleteHeaders", "getPaymentCompleteBodyItems", "getPaymentCompleteFooterItems"}) {
            assertTrue(sql(statement, parameters).contains("sys_plant_cd = ?"));
        }
    }

    @Test
    void scopesPaymentWritesToLoginPlant() {
        Map<String, Object> parameters = Map.of(
                "paymentType", "카드",
                "unpaidReason", "CUSTOMER_ABSENT",
                "unpaidDescription", "",
                "sysId", "MASTER-1",
                "userId", "USER-1",
                "sysPlantCd", "PLANT-1");

        for (String statement : new String[]{
                "paymentCompleteOrderMaster", "paymentCompleteOrderGroup",
                "paymentNotCompleteOrderMaster", "paymentNotCompleteOrderGroup"}) {
            assertTrue(sql(statement, parameters).contains("sys_plant_cd = ?"));
        }
        assertTrue(sql("paymentNotCompleteOrderGroup", parameters).contains("order_status != '99!'"));
        assertTrue(sql("lockPaymentMasterStatus", parameters).endsWith("for update"));
        assertTrue(sql("lockPaymentOrderStatuses", parameters).endsWith("for update"));
    }

    @Test
    void requiresOpenMasterStatusOnPaymentWriteToPreventDoubleClose() {
        Map<String, Object> parameters = Map.of(
                "paymentType", "카드",
                "unpaidReason", "CUSTOMER_ABSENT",
                "unpaidDescription", "",
                "sysId", "MASTER-1",
                "userId", "USER-1",
                "sysPlantCd", "PLANT-1");

        for (String statement : new String[]{"paymentCompleteOrderMaster", "paymentNotCompleteOrderMaster"}) {
            assertTrue(
                    sql(statement, parameters).contains("order_status = '01'"),
                    statement + " must filter by open status to guard against concurrent double-close");
        }
    }

    @Test
    void scopesOrderStatusMutationsToPlantAndExpectedState() {
        StatusItem.Header header = new StatusItem.Header();
        header.setSysId("GROUP-1");
        Map<String, Object> parameters = Map.of(
                "header", header,
                "cancelType", "CUSTOMER_REQUEST",
                "cancelReason", "",
                "cancelDescription", "",
                "userId", "USER-1",
                "sysPlantCd", "PLANT-1",
                "expectedStatus", "01");

        for (String statement : new String[]{
                "cancelOrder", "goToCooking", "backToReceiveOrder",
                "goToServingComplete", "backToCooking"}) {
            String sql = sql(statement, parameters);
            assertTrue(sql.contains("sys_plant_cd = ?"));
            assertTrue(sql.contains("order_status = ?") || sql.contains("order_status in"));
        }
        assertTrue(sql("lockOrderGroupStatus", parameters).endsWith("for update"));
    }

    @Test
    void buildsVisitWideReceiptFromMasterScope() {
        StatusItem.Header header = new StatusItem.Header();
        header.setSysId("MASTER-1");
        Map<String, Object> parameters = Map.of("header", header, "sysPlantCd", "PLANT-1");

        for (String statement : new String[]{
                "getPaymentCompleteBodyItems", "getPaymentCompleteFooterItems"}) {
            String sql = sql(statement, parameters);
            assertTrue(sql.contains("og.link_sys_id = ?"));
            assertTrue(sql.contains("og.order_status != '99!'"));
        }
    }

    @Test
    void excludesRevisionRemovedDetailsFromAllReadModels() throws Exception {
        for (String statement : new String[]{
                "getStatusBodyItems", "getStatusFooterItems",
                "getPaymentCompleteBodyItems", "getPaymentCompleteFooterItems"}) {
            StatusItem.Header header = new StatusItem.Header();
            header.setSysId("MASTER-1");
            assertTrue(sql(statement, Map.of("header", header, "sysPlantCd", "PLANT-1"))
                    .contains("client_order_revision_removed_detail"));
        }
        assertTrue(sql("getStatusBodyItems", Map.of("sysPlantCd", "PLANT-1"))
                .contains("inner join order_detail_option"));

        assertRemoved("consumer/order/ConsumerOrderMapper.xml",
                "findOrderDetailHeader", "findOrders", "findOrderItems", "findOrderOptions");
        assertRemoved("client/PaymentInfoMasterMapper.xml", "getPaymentInfoMaster");
        assertRemoved("client/PaymentInfoDetailMapper.xml", "getPaymentInfoDetail");
        assertRemoved("client/SettlementMapper.xml",
                "getSettlementSummary", "getSettlementDailyList");
        assertRemoved("client/OrderHistoryMapper.xml",
                "getOrderMasterHistory", "getOrderMasterTotalPrice", "getOrderDetailHistory",
                "getOrderDetailTotalPrice", "getOrderDetailOption");

        String history = mapperXml("client/OrderHistoryMapper.xml");
        for (String statement : new String[]{"getOrderDetailTotalPrice", "getOrderDetailOption"}) {
            String query = selectBlock(history, statement);
            assertTrue(query.contains("inner join order_detail od"));
            assertTrue(query.contains("removed.order_detail_sys_id = od.sys_id"));
        }

        String settlement = mapperXml("client/SettlementMapper.xml");
        for (String statement : new String[]{"getSettlementSummary", "getSettlementDailyList"}) {
            String query = selectBlock(settlement, statement);
            assertTrue(query.contains("LEFT JOIN client_order_revision_removed_detail removed"));
            assertTrue(query.contains("removed.order_detail_sys_id IS NULL"));
            assertTrue(query.contains("COUNT(DISTINCT CASE WHEN og.order_status"));
            assertTrue(query.contains("WHEN og.order_status = '99!' AND removed.order_detail_sys_id IS NULL"));
        }
    }

    @Test
    void mapsTimestampColumnsToDateTimeFields() throws Exception {
        for (String fieldName : new String[]{"orderDatetime", "cancelDatetime"}) {
            var field = StatusItem.Header.class.getDeclaredField(fieldName);

            assertEquals(LocalDateTime.class, field.getType());
            assertEquals("yyyy-MM-dd HH:mm:ss", field.getAnnotation(JsonFormat.class).pattern());
            assertEquals("date-time", field.getAnnotation(io.swagger.v3.oas.annotations.media.Schema.class).format());
        }
    }

    private String sql(String statementId, Object parameter) {
        String namespace = "htms.QROrder.client.repository.StatusMapper.";
        return configuration.getMappedStatement(namespace + statementId)
                .getBoundSql(parameter)
                .getSql()
                .replaceAll("\\s+", " ")
                .trim();
    }

    private void assertRemoved(String mapper, String... statementIds) throws Exception {
        String xml = mapperXml(mapper);
        for (String statementId : statementIds) {
            assertTrue(selectBlock(xml, statementId)
                            .contains("client_order_revision_removed_detail removed"),
                    mapper + ":" + statementId);
        }
    }

    private String mapperXml(String mapper) throws Exception {
        return Files.readString(Path.of("src/main/resources/mapper", mapper));
    }

    private String selectBlock(String xml, String statementId) {
        Matcher matcher = Pattern.compile(
                "<select\\s+id=\\\"" + Pattern.quote(statementId) + "\\\"[\\s\\S]*?</select>")
                .matcher(xml);
        assertTrue(matcher.find(), "Missing select: " + statementId);
        return matcher.group();
    }
}
