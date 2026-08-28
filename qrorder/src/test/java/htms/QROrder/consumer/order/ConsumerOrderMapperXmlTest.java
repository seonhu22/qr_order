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
}
