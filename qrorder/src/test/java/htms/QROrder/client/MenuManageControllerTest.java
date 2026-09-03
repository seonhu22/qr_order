package htms.QROrder.client;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.controller.MenuManageController;
import htms.QROrder.client.dto.MenuDetailRequest;
import htms.QROrder.client.service.MenuDetailService;
import htms.QROrder.client.service.MenuMasterService;
import htms.QROrder.client.service.MenuOptionDetailService;
import htms.QROrder.client.service.MenuOptionGroupService;
import htms.QROrder.client.service.MenuOptionMasterService;
import htms.QROrder.common.dto.FileRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MenuManageControllerTest {

    private MenuDetailService menuDetailService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        menuDetailService = mock(MenuDetailService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new MenuManageController(
                        mock(MenuMasterService.class),
                        menuDetailService,
                        mock(MenuOptionMasterService.class),
                        mock(MenuOptionGroupService.class),
                        mock(MenuOptionDetailService.class)
                ))
                .build();
    }

    @Test
    void keepsAttachmentFieldsOutOfMenuDetailItems() throws Exception {
        Login login = new Login();
        login.setUserId("ADMIN");
        login.setSysPlantCd("PC002");
        MockMultipartFile menuDetailRequest = new MockMultipartFile(
                "menuDetailRequest",
                "",
                MediaType.APPLICATION_JSON_VALUE,
                "{\"newItems\":[],\"updateItems\":[],\"delItems\":[]}".getBytes()
        );
        MockMultipartFile image = new MockMultipartFile(
                "newItems[0].file",
                "menu.png",
                MediaType.IMAGE_PNG_VALUE,
                "image".getBytes()
        );

        mockMvc.perform(multipart("/api/client/menu_manage/menu/detail/save")
                        .file(menuDetailRequest)
                        .file(image)
                        .param("newItems[0].linkSysId", "FILE-ULID-1")
                        .param("newItems[0].convertFileNm", "converted-name")
                        .param("newItems[0].filePath", "/2026/09")
                        .param("newItems[0].ordNo", "1")
                        .sessionAttr("loginUser", login)
                        .sessionAttr("menuCd", "MENU001"))
                .andExpect(status().isOk());

        ArgumentCaptor<MenuDetailRequest> menuCaptor = ArgumentCaptor.forClass(MenuDetailRequest.class);
        ArgumentCaptor<FileRequest> fileCaptor = ArgumentCaptor.forClass(FileRequest.class);
        verify(menuDetailService).saveMenuDetail(
                menuCaptor.capture(),
                fileCaptor.capture(),
                eq("ADMIN"),
                eq("PC002"),
                eq("MENU001")
        );

        assertTrue(menuCaptor.getValue().getNewItems().isEmpty());
        assertEquals(1, fileCaptor.getValue().getNewItems().size());
        assertEquals("FILE-ULID-1", fileCaptor.getValue().getNewItems().get(0).getLinkSysId());
        assertEquals("menu.png", fileCaptor.getValue().getNewItems().get(0).getFile().getOriginalFilename());
    }
}
