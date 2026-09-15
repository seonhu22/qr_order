package htms.QROrder.client;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.controller.OrderManageController;
import htms.QROrder.client.dto.StatusRequest;
import htms.QROrder.client.service.OrderHistoryService;
import htms.QROrder.client.service.StatusService;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OrderManageControllerTest {

    @Test
    void forwardsLoginPlantToEveryOrderMutationAndScopedLookup() {
        StatusService statusService = mock(StatusService.class);
        OrderHistoryService orderHistoryService = mock(OrderHistoryService.class);
        HttpSession session = mock(HttpSession.class);
        Login login = new Login();
        login.setUserId("USER-1");
        login.setSysPlantCd("PLANT-1");
        when(session.getAttribute("loginUser")).thenReturn(login);
        OrderManageController controller = new OrderManageController(statusService, orderHistoryService);
        StatusRequest request = new StatusRequest();

        controller.cancelOrder(request, session);
        controller.goToCooking(request, session);
        controller.backToReceiveOrder(request, session);
        controller.goToServingComplete(request, session);
        controller.backToCooking(request, session);
        controller.changeOrder(List.of("DETAIL-1"), session);
        controller.getStatusCancelResponses("GROUP-1", session);

        verify(statusService).cancelOrder(request, "USER-1", "PLANT-1");
        verify(statusService).goToCooking(request, "USER-1", "PLANT-1");
        verify(statusService).backToReceiveOrder(request, "USER-1", "PLANT-1");
        verify(statusService).goToServingComplete(request, "USER-1", "PLANT-1");
        verify(statusService).backToCooking(request, "USER-1", "PLANT-1");
        verify(statusService).changeOrder(List.of("DETAIL-1"), "USER-1", "PLANT-1");
        verify(statusService).getStatusCancelResponses("GROUP-1", "PLANT-1");
    }
}
