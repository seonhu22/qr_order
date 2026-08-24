package htms.QROrder.consumer.menu;

import htms.QROrder.auth.Interceptor.LoginCheckInterceptor;
import htms.QROrder.auth.domain.Login;
import htms.QROrder.consumer.menu.controller.ConsumerMenuController;
import htms.QROrder.consumer.menu.dto.ConsumerMenuDetailBody;
import htms.QROrder.consumer.menu.dto.ConsumerMenuDetailResponse;
import htms.QROrder.consumer.menu.dto.ConsumerMenuMainBody;
import htms.QROrder.consumer.menu.dto.ConsumerMenuMainHeader;
import htms.QROrder.consumer.menu.dto.ConsumerMenuMainResponse;
import htms.QROrder.consumer.menu.dto.ConsumerMenuItem;
import htms.QROrder.consumer.menu.dto.ConsumerMenuSearchResponse;
import htms.QROrder.consumer.menu.service.ConsumerMenuService;
import htms.QROrder.common.exception.GlobalExceptionHandler;
import htms.QROrder.common.exception.ValidationException;
import htms.QROrder.qr.dto.QrConnectResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ConsumerMenuControllerTest {

    private ConsumerMenuService consumerMenuService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        consumerMenuService = mock(ConsumerMenuService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new ConsumerMenuController(consumerMenuService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .addInterceptors(new LoginCheckInterceptor())
                .build();
    }

    @Test
    void returnsMainMenuForQrSession() throws Exception {
        QrConnectResponse qrTableInfo = new QrConnectResponse();
        qrTableInfo.setSysPlantCd("PC002");
        qrTableInfo.setTableNum(10);

        ConsumerMenuMainResponse response = new ConsumerMenuMainResponse(
                "테스트 매장",
                10,
                new ConsumerMenuMainHeader(List.of()),
                new ConsumerMenuMainBody(List.of())
        );

        when(consumerMenuService.getMain("PC002", 10)).thenReturn(response);

        mockMvc.perform(get("/api/consumer/menu/main")
                        .sessionAttr("qrTableInfo", qrTableInfo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.storeName").value("테스트 매장"))
                .andExpect(jsonPath("$.data.tableNum").value(10))
                .andExpect(jsonPath("$.data.header.categoryList").isArray())
                .andExpect(jsonPath("$.data.body.menuList").isArray());
    }

    @Test
    void returnsUnauthorizedWithoutQrSession() throws Exception {
        mockMvc.perform(get("/api/consumer/menu/main"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("세션이 만료되었습니다. 다시 로그인해주세요."));

        verifyNoInteractions(consumerMenuService);
    }

    @Test
    void returnsQrUnauthorizedWhenOnlyLoginSessionExists() throws Exception {
        mockMvc.perform(get("/api/consumer/menu/main")
                        .sessionAttr("loginUser", new Login()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("QR 세션이 만료되었습니다. QR코드를 다시 스캔해주세요."));

        verifyNoInteractions(consumerMenuService);
    }

    @Test
    void clearsQrSessionWhenStoreIsNoLongerAvailable() throws Exception {
        QrConnectResponse qrTableInfo = new QrConnectResponse();
        qrTableInfo.setSysPlantCd("PC002");
        qrTableInfo.setTableNum(10);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("qrTableInfo", qrTableInfo);
        when(consumerMenuService.getMain("PC002", 10)).thenReturn(null);

        mockMvc.perform(get("/api/consumer/menu/main").session(session))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("QR 세션이 만료되었습니다. QR코드를 다시 스캔해주세요."));

        org.junit.jupiter.api.Assertions.assertNull(session.getAttribute("qrTableInfo"));
    }

    @Test
    void returnsOnlyMenuBodyForSearch() throws Exception {
        QrConnectResponse qrTableInfo = new QrConnectResponse();
        qrTableInfo.setSysPlantCd("PC002");
        qrTableInfo.setTableNum(10);

        ConsumerMenuItem menuItem = new ConsumerMenuItem();
        menuItem.setMenuName("불고기 버거");
        ConsumerMenuSearchResponse response = new ConsumerMenuSearchResponse(
                new ConsumerMenuMainBody(List.of(menuItem))
        );

        when(consumerMenuService.search("PC002", "불고기", "category-1"))
                .thenReturn(response);

        mockMvc.perform(get("/api/consumer/menu/search")
                        .param("searchKeyword", "불고기")
                        .param("categorySysId", "category-1")
                        .sessionAttr("qrTableInfo", qrTableInfo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.body.menuList[0].menuName").value("불고기 버거"))
                .andExpect(jsonPath("$.data.storeName").doesNotExist())
                .andExpect(jsonPath("$.data.tableNum").doesNotExist())
                .andExpect(jsonPath("$.data.header").doesNotExist());
    }

    @Test
    void passesOptionalSearchParametersToService() throws Exception {
        QrConnectResponse qrTableInfo = new QrConnectResponse();
        qrTableInfo.setSysPlantCd("PC002");
        qrTableInfo.setTableNum(10);

        ConsumerMenuSearchResponse response = new ConsumerMenuSearchResponse(
                new ConsumerMenuMainBody(List.of())
        );
        when(consumerMenuService.search("PC002", "   ", null)).thenReturn(response);

        mockMvc.perform(get("/api/consumer/menu/search")
                        .param("searchKeyword", "   ")
                        .sessionAttr("qrTableInfo", qrTableInfo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.body.menuList").isArray());
    }

    @Test
    void returnsQrUnauthorizedForSearchWithOnlyLoginSession() throws Exception {
        mockMvc.perform(get("/api/consumer/menu/search")
                        .sessionAttr("loginUser", new Login()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("QR 세션이 만료되었습니다. QR코드를 다시 스캔해주세요."));

        verifyNoInteractions(consumerMenuService);
    }

    @Test
    void returnsBadRequestWhenSearchConditionIsTooLong() throws Exception {
        QrConnectResponse qrTableInfo = new QrConnectResponse();
        qrTableInfo.setSysPlantCd("PC002");
        qrTableInfo.setTableNum(10);

        when(consumerMenuService.search("PC002", "가".repeat(101), null))
                .thenThrow(new ValidationException("검색어는 100자 이하여야 합니다."));

        mockMvc.perform(get("/api/consumer/menu/search")
                        .param("searchKeyword", "가".repeat(101))
                        .sessionAttr("qrTableInfo", qrTableInfo))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("검색어는 100자 이하여야 합니다."))
                .andExpect(jsonPath("$.error").doesNotExist());
    }

    @Test
    void clearsQrSessionWhenSearchStoreIsNoLongerAvailable() throws Exception {
        QrConnectResponse qrTableInfo = new QrConnectResponse();
        qrTableInfo.setSysPlantCd("PC002");
        qrTableInfo.setTableNum(10);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("qrTableInfo", qrTableInfo);
        when(consumerMenuService.search("PC002", null, null)).thenReturn(null);

        mockMvc.perform(get("/api/consumer/menu/search").session(session))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("QR 세션이 만료되었습니다. QR코드를 다시 스캔해주세요."));

        org.junit.jupiter.api.Assertions.assertNull(session.getAttribute("qrTableInfo"));
    }

    @Test
    void returnsMenuDetailForQrSession() throws Exception {
        QrConnectResponse qrTableInfo = new QrConnectResponse();
        qrTableInfo.setSysPlantCd("PC002");
        qrTableInfo.setTableNum(10);

        ConsumerMenuDetailResponse response = new ConsumerMenuDetailResponse(
                new ConsumerMenuDetailBody(
                        "menu-1",
                        "category-1",
                        "버거",
                        "불고기 버거",
                        8000,
                        null,
                        null,
                        "01,03",
                        "Y",
                        "N",
                        List.of()
                )
        );

        when(consumerMenuService.isStoreAvailable("PC002")).thenReturn(true);
        when(consumerMenuService.getDetail("PC002", "menu-1")).thenReturn(response);

        mockMvc.perform(get("/api/consumer/menu/menu-1")
                        .sessionAttr("qrTableInfo", qrTableInfo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.header").doesNotExist())
                .andExpect(jsonPath("$.data.body.menuSysId").value("menu-1"))
                .andExpect(jsonPath("$.data.body.menuTag").value("01,03"))
                .andExpect(jsonPath("$.data.body.optionGroupList").isArray());
    }

    @Test
    void returnsNotFoundWithoutClearingQrSessionWhenMenuIsUnavailable() throws Exception {
        QrConnectResponse qrTableInfo = new QrConnectResponse();
        qrTableInfo.setSysPlantCd("PC002");
        qrTableInfo.setTableNum(10);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("qrTableInfo", qrTableInfo);

        when(consumerMenuService.isStoreAvailable("PC002")).thenReturn(true);
        when(consumerMenuService.getDetail("PC002", "missing-menu")).thenReturn(null);

        mockMvc.perform(get("/api/consumer/menu/missing-menu").session(session))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("메뉴를 찾을 수 없습니다."))
                .andExpect(jsonPath("$.data").doesNotExist());

        org.junit.jupiter.api.Assertions.assertNotNull(session.getAttribute("qrTableInfo"));
    }

    @Test
    void clearsQrSessionWhenDetailStoreIsNoLongerAvailable() throws Exception {
        QrConnectResponse qrTableInfo = new QrConnectResponse();
        qrTableInfo.setSysPlantCd("PC002");
        qrTableInfo.setTableNum(10);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("qrTableInfo", qrTableInfo);
        when(consumerMenuService.isStoreAvailable("PC002")).thenReturn(false);

        mockMvc.perform(get("/api/consumer/menu/menu-1").session(session))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("QR 세션이 만료되었습니다. QR코드를 다시 스캔해주세요."));

        org.junit.jupiter.api.Assertions.assertNull(session.getAttribute("qrTableInfo"));
        verify(consumerMenuService).isStoreAvailable("PC002");
    }

    @Test
    void hidesInternalDetailsWhenOptionDataViolatesContract() throws Exception {
        QrConnectResponse qrTableInfo = new QrConnectResponse();
        qrTableInfo.setSysPlantCd("PC002");
        qrTableInfo.setTableNum(10);

        when(consumerMenuService.isStoreAvailable("PC002")).thenReturn(true);
        when(consumerMenuService.getDetail("PC002", "menu-1"))
                .thenThrow(new IllegalStateException("정의되지 않은 옵션 선택 코드입니다: 주문 옵션"));

        mockMvc.perform(get("/api/consumer/menu/menu-1")
                        .sessionAttr("qrTableInfo", qrTableInfo))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message")
                        .value("메뉴 옵션 정보를 불러올 수 없습니다. 관리자에게 문의해주세요."))
                .andExpect(jsonPath("$.error").doesNotExist());
    }

    @Test
    void hidesPersistenceDetailsForMainMenu() throws Exception {
        QrConnectResponse qrTableInfo = qrTableInfo();
        when(consumerMenuService.getMain("PC002", 10))
                .thenThrow(new DataAccessResourceFailureException("relation secret_table does not exist"));

        mockMvc.perform(get("/api/consumer/menu/main").sessionAttr("qrTableInfo", qrTableInfo))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("메뉴 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요."))
                .andExpect(jsonPath("$.error").doesNotExist());
    }

    @Test
    void hidesPersistenceDetailsForSearch() throws Exception {
        QrConnectResponse qrTableInfo = qrTableInfo();
        when(consumerMenuService.search("PC002", null, null))
                .thenThrow(new DataAccessResourceFailureException("SQL state 42P01"));

        mockMvc.perform(get("/api/consumer/menu/search").sessionAttr("qrTableInfo", qrTableInfo))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("메뉴 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요."))
                .andExpect(jsonPath("$.error").doesNotExist());
    }

    @Test
    void hidesPersistenceDetailsForDetail() throws Exception {
        QrConnectResponse qrTableInfo = qrTableInfo();
        when(consumerMenuService.isStoreAvailable("PC002"))
                .thenThrow(new DataAccessResourceFailureException("mapper XML path"));

        mockMvc.perform(get("/api/consumer/menu/menu-1").sessionAttr("qrTableInfo", qrTableInfo))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("메뉴 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요."))
                .andExpect(jsonPath("$.error").doesNotExist());
    }

    private QrConnectResponse qrTableInfo() {
        QrConnectResponse qrTableInfo = new QrConnectResponse();
        qrTableInfo.setSysPlantCd("PC002");
        qrTableInfo.setTableNum(10);
        return qrTableInfo;
    }
}
