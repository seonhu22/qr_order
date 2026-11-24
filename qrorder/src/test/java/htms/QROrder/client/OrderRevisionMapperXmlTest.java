package htms.QROrder.client;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class OrderRevisionMapperXmlTest {
    @Test
    void preservesPaymentAndImplementsRevisionInvariants() throws Exception {
        String sql = Files.readString(Path.of("src/main/resources/mapper/client/OrderRevisionMapper.xml"));
        assertTrue(sql.contains("ON CONFLICT (sys_plant_cd, client_request_id) DO NOTHING"));
        assertTrue(sql.contains("FOR UPDATE OF og"));
        assertTrue(sql.contains("FOR UPDATE OF od"));
        assertTrue(sql.contains("cancel_type = 'ORDER_REVISION'"));
        assertTrue(sql.contains("order_status IN ('01', '02')"));
        assertFalse(sql.contains("payment_yn = 'N'"));
        assertFalse(sql.contains("request_note"));
    }

    @Test
    void bindsValidatedUnitPricesForAddedMenuAndOption() throws Exception {
        String sql = Files.readString(Path.of("src/main/resources/mapper/client/OrderRevisionMapper.xml"))
                .replaceAll("\\s+", " ");
        assertTrue(sql.contains("qty, order_unit_price, payment_yn)"));
        assertTrue(sql.contains("#{quantity}, #{unitPrice}, 'Y')"));
        assertTrue(sql.contains("link_sys_id2, qty, order_unit_price)"));
        assertTrue(sql.contains("#{optionSysId}, #{quantity}, #{unitPrice})"));
    }
}
