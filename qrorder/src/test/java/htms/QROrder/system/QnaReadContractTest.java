package htms.QROrder.system;

import htms.QROrder.system.dto.QnaResponse;
import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class QnaReadContractTest {
    @Test
    void searchesActiveInquiriesAcrossStoresAndExposesModificationTime() throws Exception {
        var configuration = new Configuration();
        String resource = "mapper/system/QnaMapper.xml";
        try (var input = Resources.getResourceAsStream(resource)) {
            new XMLMapperBuilder(input, configuration, resource, configuration.getSqlFragments()).parse();
        }
        String sql = configuration.getMappedStatement("htms.QROrder.system.repository.QnaMapper.getQna")
                .getBoundSql(Map.of("searchKeyword", "AUTO-QA"))
                .getSql().replaceAll("\\s+", " ");
        assertTrue(sql.contains("bq.modify_datetime"));
        assertFalse(sql.contains("sys_plant_cd"));
        assertTrue(sql.contains("bq.delete_yn = 'N'"));
        assertTrue(sql.contains("bq.qna_title like"));
        assertTrue(sql.contains("bq.qna_description like"));
        assertEquals(LocalDateTime.class, QnaResponse.class.getDeclaredField("modifyDatetime").getType());

        String answerSql = configuration.getMappedStatement("htms.QROrder.system.repository.QnaMapper.updateQna")
                .getBoundSql(Map.of()).getSql().replaceAll("\\s+", " ");
        assertFalse(answerSql.contains("sys_plant_cd"));
        assertTrue(answerSql.contains("delete_yn = 'N'"));
        assertTrue(answerSql.contains("modify_datetime = now()"));
    }

    @Test
    void serializesModificationTimeAsIsoAndExposesItInOpenApi() throws Exception {
        var response = new QnaResponse();
        response.setModifyDatetime(LocalDateTime.of(2026, 11, 10, 10, 11, 12));
        var json = JsonMapper.builder().build().valueToTree(response);
        assertEquals("2026-11-10T10:11:12", json.get("modifyDatetime").asText());
        assertTrue(JsonMapper.builder().build().valueToTree(new QnaResponse()).get("modifyDatetime").isNull());
        var schema = io.swagger.v3.core.converter.ModelConverters.getInstance()
                .read(QnaResponse.class).get("QnaResponse");
        var timeSchema = (io.swagger.v3.oas.models.media.Schema<?>) schema.getProperties().get("modifyDatetime");
        assertEquals("date-time", timeSchema.getFormat());
        var annotation = QnaResponse.class.getDeclaredField("modifyDatetime")
                .getAnnotation(io.swagger.v3.oas.annotations.media.Schema.class);
        assertTrue(java.util.Arrays.asList(annotation.types()).containsAll(java.util.List.of("string", "null")));
    }
}
