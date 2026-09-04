package htms.QROrder.client;

import htms.QROrder.client.dto.StatusItem;
import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.util.Map;

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

    private String sql(String statementId, Object parameter) {
        String namespace = "htms.QROrder.client.repository.StatusMapper.";
        return configuration.getMappedStatement(namespace + statementId)
                .getBoundSql(parameter)
                .getSql()
                .replaceAll("\\s+", " ")
                .trim();
    }
}
