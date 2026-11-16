package htms.QROrder.client;

import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.Test;
import java.util.Map;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class ClientUserMapperScopeTest {
    private Configuration configuration() throws Exception {
        var config = new Configuration(); String path = "mapper/client/ClientUserMapper.xml";
        try (var input = getClass().getClassLoader().getResourceAsStream(path)) {
            new XMLMapperBuilder(input, config, path, config.getSqlFragments()).parse();
        }
        return config;
    }
    @Test void ordinaryUpdateCannotChangeRoleAndAlwaysScopesStoreAndStaff() throws Exception {
        var bound = configuration().getMappedStatement("htms.QROrder.client.repository.ClientUserMapper.updateClientUser")
                .getBoundSql(Map.of("sysPlantCd", "STORE"));
        String sql = bound.getSql().replaceAll("\\s+", " ").toLowerCase();
        assertFalse(sql.substring(0, sql.indexOf("where")).contains("user_role"));
        assertTrue(sql.contains("plant_cd = ?"));
        assertTrue(sql.contains("user_role = '02'"));
        assertTrue(sql.contains("delete_yn = 'n'"));
    }
    @Test void newUsersUseServerStoreAndStaffRole() throws Exception {
        String sql = configuration().getMappedStatement("htms.QROrder.client.repository.ClientUserMapper.newClientUser")
                .getBoundSql(Map.of("sysPlantCd", "STORE")).getSql();
        assertTrue(sql.contains("'02'"));
        var mappings = configuration().getMappedStatement("htms.QROrder.client.repository.ClientUserMapper.newClientUser")
                .getBoundSql(Map.of("sysPlantCd", "STORE")).getParameterMappings();
        assertFalse(mappings.stream().anyMatch(p -> p.getProperty().equals("newItems.plantCd") || p.getProperty().equals("newItems.userRole")));
    }
}
