package htms.QROrder.consumer.order;

import htms.QROrder.consumer.order.repository.ConsumerOrderWriteRows;
import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ConsumerOrderMapperXmlTest {

    private Configuration configuration;

    @BeforeEach
    void setUp() throws Exception {
        configuration = new Configuration();
        String resource = "mapper/consumer/order/ConsumerOrderMapper.xml";
        try (InputStream input = Resources.getResourceAsStream(resource)) {
            new XMLMapperBuilder(input, configuration, resource, configuration.getSqlFragments()).parse();
        }
    }

    @Test
    void bindsOrderGroupRequiredColumns() {
        ConsumerOrderWriteRows.Group row = new ConsumerOrderWriteRows.Group(
                "ORDER-1", "VISIT-1", "PLANT-1", 1002, LocalDateTime.now());

        String sql = sql("insertOrderGroup", row);

        assertTrue(sql.contains("cancel_reason"));
        assertTrue(sql.contains("order_status"));
        assertTrue(sql.contains("order_num"));
    }

    @Test
    void marksDetailWithOptions() {
        ConsumerOrderWriteRows.Item row = new ConsumerOrderWriteRows.Item(
                "ITEM-1", "VISIT-1", "ORDER-1", "MENU-1", "PLANT-1",
                2, true, LocalDateTime.now());

        String sql = sql("insertOrderDetail", row);

        assertTrue(sql.contains("'Y'"));
        assertFalse(sql.contains("'N', 'CONSUMER'"));
    }

    @Test
    void marksNewOrderDetailAsPayable() {
        ConsumerOrderWriteRows.Item row = new ConsumerOrderWriteRows.Item(
                "ITEM-1", "VISIT-1", "ORDER-1", "MENU-1", "PLANT-1",
                2, false, LocalDateTime.now());

        String sql = sql("insertOrderDetail", row);

        assertTrue(sql.contains("qty, payment_yn"));
        assertTrue(sql.endsWith("'Y' )"));
    }

    @Test
    void bindsStoredOptionQuantity() {
        ConsumerOrderWriteRows.Option row = new ConsumerOrderWriteRows.Option(
                "ORDER-OPTION-1", "ITEM-1", "OPTION-1", "PLANT-1",
                4, LocalDateTime.now());

        BoundSql boundSql = boundSql("insertOrderDetailOption", row);

        assertTrue(normalize(boundSql.getSql()).contains("order_detail_option"));
        assertTrue(boundSql.getParameterMappings().stream()
                .anyMatch(mapping -> "quantity".equals(mapping.getProperty())));
    }

    @Test
    void bindsSharedVisitScopeToAllOrderQueries() {
        Map<String, Object> parameters = Map.of(
                "consumerSessionId", "VISIT-1",
                "sysPlantCd", "PLANT-1",
                "orderId", "ORDER-1"
        );

        for (String statement : new String[]{
                "findOrders", "findOrderDetailHeader", "findOrderItems", "findOrderOptions"}) {
            String sql = sql(statement, parameters);
            assertTrue(sql.contains("om.insert_user_id = 'CONSUMER'"));
            assertTrue(sql.contains("og.link_sys_id = ?"));
            assertTrue(sql.contains("og.sys_plant_cd = ?"));
        }
    }

    @Test
    void detectsClosedVisitFromOrderMasterStatusInsteadOfDetailPaymentFlag() {
        Map<String, Object> parameters = Map.of(
                "consumerSessionId", "VISIT-1",
                "sysPlantCd", "PLANT-1");

        String sql = sql("existsClosedVisit", parameters);

        assertTrue(sql.contains("om.order_status IN ('02', '03')"));
        assertFalse(sql.contains("od.payment_yn"));
    }

    @Test
    void consumerVisitMapperLocksTableBeforeEvaluatingUseYn() throws Exception {
        Configuration visitConfiguration = configuration(
                "mapper/consumer/session/ConsumerVisitMapper.xml");
        Map<String, Object> parameters = Map.of(
                "tableSysId", "TABLE-1",
                "sysPlantCd", "PLANT-1");
        String namespace = "htms.QROrder.consumer.session.repository.ConsumerVisitMapper.";
        String sql = normalize(visitConfiguration
                .getMappedStatement(namespace + "lockTableUseYn")
                .getBoundSql(parameters)
                .getSql());

        assertTrue(sql.contains("SELECT use_yn FROM table_info"));
        assertTrue(sql.contains("sys_id = ?"));
        assertTrue(sql.contains("sys_plant_cd = ?"));
        assertTrue(sql.endsWith("FOR UPDATE"));
        assertFalse(sql.contains("use_yn = 'Y'"));
    }

    @Test
    void consumerVisitMapperProjectsCurrentTableActivity() throws Exception {
        Configuration visitConfiguration = configuration(
                "mapper/consumer/session/ConsumerVisitMapper.xml");
        Map<String, Object> parameters = Map.of(
                "consumerSessionId", "VISIT-1",
                "tableSysId", "TABLE-1",
                "sysPlantCd", "PLANT-1");
        String namespace = "htms.QROrder.consumer.session.repository.ConsumerVisitMapper.";
        String sql = normalize(visitConfiguration
                .getMappedStatement(namespace + "findConsumerVisit")
                .getBoundSql(parameters)
                .getSql());

        assertTrue(sql.contains("FROM table_info ti"));
        assertTrue(sql.contains("ti.use_yn = 'Y'"));
        assertTrue(sql.contains("AS table_active"));
    }

    private String sql(String statementId, Object parameter) {
        return normalize(boundSql(statementId, parameter).getSql());
    }

    private BoundSql boundSql(String statementId, Object parameter) {
        String namespace = "htms.QROrder.consumer.order.repository.ConsumerOrderMapper.";
        return configuration.getMappedStatement(namespace + statementId).getBoundSql(parameter);
    }

    private String normalize(String sql) {
        return sql.replaceAll("\\s+", " ").trim();
    }

    private Configuration configuration(String resource) throws Exception {
        Configuration parsed = new Configuration();
        try (InputStream input = Resources.getResourceAsStream(resource)) {
            new XMLMapperBuilder(input, parsed, resource, parsed.getSqlFragments()).parse();
        }
        return parsed;
    }
}
