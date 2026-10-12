package htms.QROrder.client;

import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;

class OrderRevisionCatalogMapperXmlTest {

    private Configuration configuration;

    @BeforeEach
    void setUp() throws Exception {
        configuration = new Configuration();
        String resource = "mapper/client/OrderRevisionCatalogMapper.xml";
        try (InputStream input = Resources.getResourceAsStream(resource)) {
            new XMLMapperBuilder(input, configuration, resource, configuration.getSqlFragments()).parse();
        }
    }

    @Test
    void availableMenuQueryIsPlantScopedAndFiltersInactiveDeletedAndSoldOutRows() {
        String sql = sql("findAvailableMenus");

        assertTrue(sql.contains("smd.sys_plant_cd = ?"));
        assertTrue(sql.contains("smd.use_yn = 'Y'"));
        assertTrue(sql.contains("smd.delete_yn = 'N'"));
        assertTrue(sql.contains("smd.sold_out_yn = 'N'"));
        assertTrue(sql.contains("smm.use_yn = 'Y'"));
        assertTrue(sql.contains("smm.delete_yn = 'N'"));
        assertTrue(sql.contains("required_group.required_yn = 'Y'"));
        assertTrue(sql.contains("available_option.sold_out_yn = 'N'"));
        assertTrue(sql.contains("order by smm.ord_no asc, smd.ord_no asc, smd.sys_id asc"));
    }

    @Test
    void availableOptionQueryIsPlantScopedAndFiltersEveryOptionLevel() {
        String sql = sql("findAvailableOptions");

        assertTrue(sql.contains("smd.sys_plant_cd = ?"));
        assertTrue(sql.contains("smog.sys_plant_cd = smd.sys_plant_cd"));
        assertTrue(sql.contains("smog.use_yn = 'Y'"));
        assertTrue(sql.contains("smog.delete_yn = 'N'"));
        assertTrue(sql.contains("smod.sys_plant_cd = smog.sys_plant_cd"));
        assertTrue(sql.contains("smod.use_yn = 'Y'"));
        assertTrue(sql.contains("smod.delete_yn = 'N'"));
        assertTrue(sql.contains("smod.sold_out_yn = 'N'"));
        assertTrue(sql.contains("required_group.required_yn = 'Y'"));
        assertTrue(sql.contains("available_option.sold_out_yn = 'N'"));
        assertTrue(sql.contains(
                "order by smm.ord_no asc, smd.ord_no asc, smog.ord_no asc, smod.ord_no asc, smod.sys_id asc"));
    }

    private String sql(String statementId) {
        String namespace = "htms.QROrder.client.repository.OrderRevisionCatalogMapper.";
        return configuration.getMappedStatement(namespace + statementId)
                .getBoundSql(Map.of("sysPlantCd", "PLANT-1"))
                .getSql()
                .replaceAll("\\s+", " ")
                .trim();
    }
}
