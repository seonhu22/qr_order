package htms.QROrder.consumer.menu;

import htms.QROrder.common.dto.FileInfo;
import htms.QROrder.common.service.FileService;
import htms.QROrder.consumer.menu.controller.ConsumerMenuController;
import htms.QROrder.consumer.menu.dto.ConsumerMenuImage;
import htms.QROrder.consumer.menu.repository.ConsumerMenuMapper;
import htms.QROrder.consumer.menu.service.ConsumerMenuService;
import htms.QROrder.qr.dto.QrConnectResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Consumer 메뉴 이미지 API.
 *
 * 이 API의 존재 이유는 이미지를 보여주는 것이 아니라, 파일 ID만으로 남의 매장 파일이
 * 열리던 것을 막는 데 있다. 그래서 거부 경로의 검증이 성공 경로보다 많다.
 */
class ConsumerMenuImageTest {

    private ConsumerMenuMapper consumerMenuMapper;
    private FileService fileService;
    private ConsumerMenuService consumerMenuService;
    private MockMvc mockMvc;
    private MockHttpSession qrSession;

    @BeforeEach
    void setUp() {
        consumerMenuMapper = mock(ConsumerMenuMapper.class);
        fileService = mock(FileService.class);
        consumerMenuService = new ConsumerMenuService(consumerMenuMapper, fileService);

        mockMvc = MockMvcBuilders
                .standaloneSetup(new ConsumerMenuController(consumerMenuService))
                .build();

        QrConnectResponse qrTableInfo = new QrConnectResponse();
        qrTableInfo.setSysPlantCd("PC002");
        qrTableInfo.setTableNum(10);

        qrSession = new MockHttpSession();
        qrSession.setAttribute("qrTableInfo", qrTableInfo);
    }

    private static FileInfo fileInfo(String mimeType, String fileExt, String pdfYn) {
        FileInfo fileInfo = new FileInfo();
        fileInfo.setSysId("FILE001");
        fileInfo.setMimeType(mimeType);
        fileInfo.setFileExt(fileExt);
        fileInfo.setPdfYn(pdfYn);
        return fileInfo;
    }

    private static Resource imageBytes() {
        return new ByteArrayResource("fake-image".getBytes());
    }

    private void givenOwnedImage(FileInfo fileInfo) {
        when(consumerMenuMapper.getMenuImageFileSysId("PC002", "MENU001")).thenReturn("FILE001");
        when(fileService.getFileInfo("FILE001")).thenReturn(fileInfo);
        when(fileService.readFile(fileInfo)).thenReturn(imageBytes());
    }

    // ---------- 성공 경로 ----------

    @Test
    void servesOwnedMenuImageInline() throws Exception {
        givenOwnedImage(fileInfo("image/jpeg", ".jpg", "N"));

        mockMvc.perform(get("/api/consumer/menu/MENU001/image").session(qrSession))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/jpeg"))
                .andExpect(header().string("Content-Disposition", "inline"))
                .andExpect(content().bytes("fake-image".getBytes()));
    }

    @Test
    void marksImageCacheablePerViewerOnly() throws Exception {
        givenOwnedImage(fileInfo("image/png", ".png", "N"));

        mockMvc.perform(get("/api/consumer/menu/MENU001/image").session(qrSession))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "max-age=3600, private"));
    }

    // ---------- 소유권: 거부되어야 할 것들 ----------

    @Test
    void hidesImageOwnedByAnotherStore() throws Exception {
        // 다른 사업장 파일이면 소유권 조회 자체가 비어 나온다.
        when(consumerMenuMapper.getMenuImageFileSysId("PC002", "MENU-OF-OTHER-STORE")).thenReturn(null);

        mockMvc.perform(get("/api/consumer/menu/MENU-OF-OTHER-STORE/image").session(qrSession))
                .andExpect(status().isNotFound())
                .andExpect(content().string(""));

        verifyNoInteractions(fileService);
    }

    @Test
    void hidesAttachmentNotLinkedToMenu() throws Exception {
        when(consumerMenuMapper.getMenuImageFileSysId("PC002", "MENU001")).thenReturn(null);

        mockMvc.perform(get("/api/consumer/menu/MENU001/image").session(qrSession))
                .andExpect(status().isNotFound());

        verifyNoInteractions(fileService);
    }

    @Test
    void hidesFileMissingFromAttachTable() throws Exception {
        when(consumerMenuMapper.getMenuImageFileSysId("PC002", "MENU001")).thenReturn("FILE001");
        when(fileService.getFileInfo("FILE001")).thenReturn(null);

        mockMvc.perform(get("/api/consumer/menu/MENU001/image").session(qrSession))
                .andExpect(status().isNotFound());
    }

    // ---------- MIME 안전장치 ----------

    @Test
    void refusesToServePdfAsImage() throws Exception {
        givenOwnedImage(fileInfo("application/pdf", ".pdf", "Y"));

        mockMvc.perform(get("/api/consumer/menu/MENU001/image").session(qrSession))
                .andExpect(status().isNotFound());
    }

    @Test
    void refusesNonImageMimeType() throws Exception {
        givenOwnedImage(fileInfo("text/html", ".html", "N"));

        mockMvc.perform(get("/api/consumer/menu/MENU001/image").session(qrSession))
                .andExpect(status().isNotFound());
    }

    @Test
    void refusesSvgToAvoidInlineScript() throws Exception {
        givenOwnedImage(fileInfo("image/svg+xml", ".svg", "N"));

        mockMvc.perform(get("/api/consumer/menu/MENU001/image").session(qrSession))
                .andExpect(status().isNotFound());
    }

    @Test
    void fallsBackToFileExtensionWhenMimeTypeIsMissing() throws Exception {
        // mime_type은 업로드 시 클라이언트가 보낸 값이라 비어 있을 수 있다.
        givenOwnedImage(fileInfo(null, ".PNG", "N"));

        mockMvc.perform(get("/api/consumer/menu/MENU001/image").session(qrSession))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"));
    }

    @Test
    void fallsBackToFileExtensionWhenMimeTypeIsMalformed() throws Exception {
        givenOwnedImage(fileInfo("not a mime type", ".jpg", "N"));

        mockMvc.perform(get("/api/consumer/menu/MENU001/image").session(qrSession))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/jpeg"));
    }

    @Test
    void hidesFileWithNeitherUsableMimeTypeNorExtension() throws Exception {
        givenOwnedImage(fileInfo(null, null, "N"));

        mockMvc.perform(get("/api/consumer/menu/MENU001/image").session(qrSession))
                .andExpect(status().isNotFound());
    }

    // ---------- 세션·오류 처리 ----------

    @Test
    void doesNotClearQrSessionWhenImageRequestFails() throws Exception {
        when(consumerMenuMapper.getMenuImageFileSysId("PC002", "MENU001")).thenReturn(null);

        mockMvc.perform(get("/api/consumer/menu/MENU001/image").session(qrSession))
                .andExpect(status().isNotFound());

        assertNotNull(qrSession.getAttribute("qrTableInfo"),
                "이미지 요청 한 건이 QR 세션을 지우면 안 된다");
    }

    @Test
    void rejectsRequestWithoutQrSession() throws Exception {
        // 실서비스에서는 인터셉터가 먼저 막는다. 컨트롤러 자체 방어선도 확인한다.
        mockMvc.perform(get("/api/consumer/menu/MENU001/image"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(consumerMenuMapper);
        verifyNoInteractions(fileService);
    }

    @Test
    void hidesServerPathWhenFileIsMissingOnDisk() throws Exception {
        FileInfo fileInfo = fileInfo("image/jpeg", ".jpg", "N");
        when(consumerMenuMapper.getMenuImageFileSysId("PC002", "MENU001")).thenReturn("FILE001");
        when(fileService.getFileInfo("FILE001")).thenReturn(fileInfo);
        when(fileService.readFile(fileInfo))
                .thenThrow(new RuntimeException("파일을 찾을 수 없습니다: /srv/uploads/2026/08/abc.jpg"));

        mockMvc.perform(get("/api/consumer/menu/MENU001/image").session(qrSession))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string(""));
    }

    @Test
    void hidesPersistenceDetailsWhenOwnershipQueryFails() throws Exception {
        when(consumerMenuMapper.getMenuImageFileSysId(anyString(), anyString()))
                .thenThrow(new DataAccessResourceFailureException("connection refused to 10.0.0.5:5432"));

        mockMvc.perform(get("/api/consumer/menu/MENU001/image").session(qrSession))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string(""));
    }

    // ---------- 서비스 계층 직접 확인 ----------

    @Test
    void serviceReturnsNullInsteadOfLeakingForeignFile() {
        when(consumerMenuMapper.getMenuImageFileSysId("PC002", "MENU-OF-OTHER-STORE")).thenReturn(null);

        assertNull(consumerMenuService.getMenuImage("PC002", "MENU-OF-OTHER-STORE"));
    }

    @Test
    void serviceResolvesContentTypeFromMimeType() {
        givenOwnedImage(fileInfo("image/webp", ".webp", "N"));

        ConsumerMenuImage image = consumerMenuService.getMenuImage("PC002", "MENU001");

        assertNotNull(image);
        assertEquals("image/webp", image.getContentType().toString());
    }
}
