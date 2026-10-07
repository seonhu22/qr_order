package htms.QROrder.client;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.controller.StaffCallNotificationController;
import htms.QROrder.client.service.StaffCallNotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class StaffCallNotificationControllerTest {

    private StaffCallNotificationService service;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(StaffCallNotificationService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new StaffCallNotificationController(service))
                .build();
    }

    @Test
    void marksOneNotificationReadForLoggedInStore() throws Exception {
        Login login = new Login();
        login.setSysPlantCd("PLANT-1");

        mockMvc.perform(post("/api/client/staff-call/notifications/MASTER-1/read")
                        .sessionAttr("loginUser", login))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(service).markRead("MASTER-1", "PLANT-1");
    }
}
