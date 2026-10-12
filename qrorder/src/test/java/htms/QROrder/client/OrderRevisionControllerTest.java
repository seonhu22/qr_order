package htms.QROrder.client;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.controller.OrderManageController;
import htms.QROrder.client.exception.OrderRevisionException;
import htms.QROrder.client.service.*;
import htms.QROrder.common.exception.GlobalExceptionHandler;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class OrderRevisionControllerTest {
    @ParameterizedTest
    @CsvSource({"400,ORDER_REVISION_INVALID_REQUEST", "404,ORDER_REVISION_MENU_NOT_FOUND", "409,TABLE_INACTIVE"})
    void exposesStableErrorEnvelope(int status, String code) throws Exception {
        OrderRevisionService service = mock(OrderRevisionService.class);
        when(service.revise(eq("P1"), eq("U1"), any())).thenThrow(new OrderRevisionException(
                HttpStatus.valueOf(status), code, "revision error"));
        OrderManageController controller = new OrderManageController(mock(StatusService.class),
                mock(OrderHistoryService.class), mock(OrderRevisionCatalogService.class), service);
        MockMvc mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler()).build();
        MockHttpSession session = new MockHttpSession();
        Login login = new Login(); login.setSysPlantCd("P1"); login.setUserId("U1");
        session.setAttribute("loginUser", login);

        mvc.perform(post("/api/client/order_manage/status/revise_order").session(session)
                        .contentType("application/json")
                        .content("{\"clientRequestId\":\"123e4567-e89b-12d3-a456-426614174000\",\"orderGroupIds\":[\"G1\"],\"removeDetailIds\":[\"D1\"],\"addedItems\":[]}"))
                .andExpect(status().is(status))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value(code))
                .andExpect(jsonPath("$.message").value("revision error"));
        verify(service).revise(eq("P1"), eq("U1"), any());
    }
}
