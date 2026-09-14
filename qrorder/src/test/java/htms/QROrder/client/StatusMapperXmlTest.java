package htms.QROrder.client;

import htms.QROrder.client.dto.StatusItem;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.Map;

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
}
