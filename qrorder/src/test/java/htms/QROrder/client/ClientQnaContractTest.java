package htms.QROrder.client;

import htms.QROrder.audit.service.AuditService;
import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.controller.BoardController;
import htms.QROrder.client.dto.ClientQnaRequest;
import htms.QROrder.client.repository.ClientQnaMapper;
import htms.QROrder.client.service.ClientNoticeService;
import htms.QROrder.client.service.ClientQnaService;
import htms.QROrder.common.dto.FileRequest;
import htms.QROrder.common.service.FileService;
import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.mapping.ParameterMapping;
import org.apache.ibatis.session.Configuration;
import org.apache.ibatis.session.SqlSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ClientQnaContractTest {
    private static final String NAMESPACE = ClientQnaMapper.class.getName() + ".";

    private final Login login = new Login();
    private final Configuration configuration = new Configuration();
    private final SqlSession sqlSession = mock(SqlSession.class);
    private final FileService files = mock(FileService.class);
    private MockMvc mvc;

    @BeforeEach
    void setUp() throws Exception {
        login.setUserId("OWNER");
        login.setSysPlantCd("DEMO01");
        var service = new ClientQnaService(mock(AuditService.class), loadMapper(), files);
        mvc = MockMvcBuilders.standaloneSetup(new BoardController(mock(ClientNoticeService.class), service)).build();
    }

    @Test
    void updatesOwnedInquiryThroughMappedJsonRequest() throws Exception {
        when(sqlSession.update(eq(NAMESPACE + "updateQna"), any())).thenReturn(1);

        postInquiryUpdate("QNA-1").andExpect(status().isOk());

        var request = captureRequest("updateQna", false);
        assertEquals("QNA-1", request.getSysId());
        assertEquals("Updated title", request.getQnaTitle());
        assertEquals("Updated inquiry", request.getQnaDescription());
        var sql = configuration.getMappedStatement(NAMESPACE + "updateQna").getBoundSql(Map.of());
        assertTrue(sql.getSql().contains("sys_plant_cd = ?"));
        assertTrue(sql.getSql().contains("insert_user_id = ?"));
        assertTrue(sql.getSql().contains("delete_yn = 'N'"));
        assertTrue(sql.getSql().contains("modify_datetime = now()"));
    }

    @Test
    void returnsNotFoundWhenNoOwnedActiveInquiryWasUpdated() throws Exception {
        postInquiryUpdate("OTHER-QNA").andExpect(status().isNotFound());
    }

    @Test
    void softDeletesOnlyOwnedActiveInquiryInSessionStore() throws Exception {
        when(sqlSession.update(eq(NAMESPACE + "delQna"), any())).thenReturn(1);

        postInquiryDelete("QNA-1").andExpect(status().isOk());

        assertEquals("QNA-1", captureRequest("delQna", false).getSysId());
        var sql = configuration.getMappedStatement(NAMESPACE + "delQna").getBoundSql(Map.of());
        assertEquals("""
                update brd_qna set delete_yn = 'Y', modify_user_id = ?, modify_datetime = now() \
                where sys_id = ? and sys_plant_cd = ? and insert_user_id = ? and delete_yn = 'N'""",
                sql.getSql().replaceAll("\\s+", " ").trim());
        assertEquals(List.of("userId", "qnaRequest.sysId", "sysPlantCd", "userId"),
                sql.getParameterMappings().stream().map(ParameterMapping::getProperty).toList());
        verifyNoInteractions(files);
    }

    @Test
    void returnsNotFoundWhenDeleteChangesNoRows() throws Exception {
        when(sqlSession.update(eq(NAMESPACE + "delQna"), any())).thenReturn(0);

        postInquiryDelete("QNA-1").andExpect(status().isNotFound());

        assertEquals("QNA-1", captureRequest("delQna", false).getSysId());
        verifyNoInteractions(files);
    }

    @Test
    void savesOriginalMultipartFileUnderGeneratedFileUlid() throws Exception {
        byte[] contents = {1, 2, 3};
        var upload = new MockMultipartFile("newItems[0].file", "original.png", "image/png", contents);

        mvc.perform(multipart("/api/client/board/qna/new")
                        .file(upload)
                        .param("qnaTitle", "Original title")
                        .param("qnaDescription", "Original inquiry")
                        .param("newItems[0].linkSysId", "OTHER-GROUP")
                        .param("newItems[0].convertFileNm", "client-name")
                        .param("newItems[0].filePath", "/client-path")
                        .param("newItems[0].ordNo", "99")
                        .param("updateItems[0].sysId", "EXISTING-FILE")
                        .param("delItems[0].sysId", "EXISTING-FILE")
                        .sessionAttr("loginUser", login)
                        .sessionAttr("menuCd", "client-menu"))
                .andExpect(status().isOk());

        var request = captureRequest("newQna", true);
        assertEquals("Original title", request.getQnaTitle());
        assertNotEquals(request.getSysId(), request.getFileUlid());

        var fileRequest = ArgumentCaptor.forClass(FileRequest.class);
        verify(files).saveFile(fileRequest.capture(), eq("OWNER"), eq("DEMO01"), eq("QNA"));
        assertTrue(fileRequest.getValue().getDelItems().isEmpty());
        assertTrue(fileRequest.getValue().getUpdateItems().isEmpty());
        assertEquals(1, fileRequest.getValue().getNewItems().size());
        var original = fileRequest.getValue().getNewItems().get(0);
        assertEquals(request.getFileUlid(), original.getLinkSysId());
        assertEquals("original.png", original.getFile().getOriginalFilename());
        assertArrayEquals(contents, original.getFile().getBytes());
        assertTrue(original.getConvertFileNm().matches("[0-9A-Z]{26}"));
        assertTrue(original.getFilePath().matches("/\\d{4}/\\d{2}"));
        assertEquals(1, original.getOrdNo());
    }

    @Test
    void createsInquiryWithNoFileParts() throws Exception {
        mvc.perform(multipart("/api/client/board/qna/new")
                        .param("qnaTitle", "No files")
                        .param("qnaDescription", "Text")
                        .sessionAttr("loginUser", login))
                .andExpect(status().isOk());

        assertEquals("No files", captureRequest("newQna", true).getQnaTitle());
        verifyNoInteractions(files);
    }

    private ResultActions postInquiryUpdate(String sysId) throws Exception {
        return mvc.perform(post("/api/client/board/qna/update")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"sysId":"%s","qnaTitle":"Updated title","qnaDescription":"Updated inquiry"}
                        """.formatted(sysId))
                .sessionAttr("loginUser", login)
                .sessionAttr("menuCd", "QNA"));
    }

    private ResultActions postInquiryDelete(String sysId) throws Exception {
        return mvc.perform(post("/api/client/board/qna/del")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"sysId":"%s"}
                        """.formatted(sysId))
                .sessionAttr("loginUser", login)
                .sessionAttr("menuCd", "QNA"));
    }

    private ClientQnaMapper loadMapper() throws Exception {
        String resource = "mapper/client/ClientQnaMapper.xml";
        try (var input = Resources.getResourceAsStream(resource)) {
            new XMLMapperBuilder(input, configuration, resource, configuration.getSqlFragments()).parse();
        }
        when(sqlSession.getConfiguration()).thenReturn(configuration);
        return configuration.getMapper(ClientQnaMapper.class, sqlSession);
    }

    private ClientQnaRequest captureRequest(String statement, boolean insert) {
        var parameters = ArgumentCaptor.forClass(Map.class);
        if (insert) {
            verify(sqlSession).insert(eq(NAMESPACE + statement), parameters.capture());
        } else {
            verify(sqlSession).update(eq(NAMESPACE + statement), parameters.capture());
        }
        assertEquals("OWNER", parameters.getValue().get("userId"));
        assertEquals("DEMO01", parameters.getValue().get("sysPlantCd"));
        return (ClientQnaRequest) parameters.getValue().get("qnaRequest");
    }
}
