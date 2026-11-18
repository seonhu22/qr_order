package htms.QROrder.system;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.common.dto.FileRequest;
import htms.QROrder.system.controller.SettingsController;
import htms.QROrder.system.dto.NoticeRequest;
import htms.QROrder.system.service.*;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class NoticeAudienceMultipartTest {
    private final NoticeService notice=mock(NoticeService.class);
    private final MockMvc mvc=MockMvcBuilders.standaloneSetup(new SettingsController(
        mock(CommonMasterService.class),mock(CommonDetailService.class),mock(PlantService.class),mock(AdminUserService.class),
        mock(MenuService.class),mock(MessageService.class),mock(RuleMasterService.class),mock(RuleDetailService.class),
        mock(PaymentService.class),mock(PlantStatusService.class),mock(PaymentCouponService.class),mock(SysAccessLogService.class),
        mock(AuditTrailService.class),notice,mock(QnaService.class))).build();
    private MockHttpSession session() {
        var session=new MockHttpSession();var actor=new Login();actor.setUserId("SYSTEM");actor.setSysPlantCd("ADMIN");
        session.setAttribute("loginUser",actor);session.setAttribute("menuCd","NOTICE");return session;
    }
    @Test void createMultipartBindsAllThreeTargetValues() throws Exception {
        for(String target:List.of("all","manager","staff")) {
            mvc.perform(multipart("/api/system/settings/board/notice/new").session(session())
                .param("noticeTitle","AUTO-QA").param("noticeDescription","body").param("target",target)
                .param("startDate","2026-11-18 09:00:00").param("useYn","Y")).andExpect(status().isOk());
        }
        var capture=ArgumentCaptor.forClass(NoticeRequest.class);
        verify(notice,times(3)).newNotice(capture.capture(),any(FileRequest.class),eq("SYSTEM"),eq("ADMIN"),eq("NOTICE"));
        assertEquals(List.of("all","manager","staff"),capture.getAllValues().stream().map(NoticeRequest::getTarget).toList());
    }
    @Test void updateMultipartBindsTargetAndKeepsOmissionNullForServicePreservation() throws Exception {
        mvc.perform(multipart("/api/system/settings/board/notice/update").session(session())
            .param("sysId","N1").param("target","manager")).andExpect(status().isOk());
        mvc.perform(multipart("/api/system/settings/board/notice/update").session(session())
            .param("sysId","N1")).andExpect(status().isOk());
        var capture=ArgumentCaptor.forClass(NoticeRequest.class);
        verify(notice,times(2)).updateNotice(capture.capture(),any(FileRequest.class),eq("SYSTEM"),eq("ADMIN"),eq("NOTICE"));
        assertEquals("manager",capture.getAllValues().get(0).getTarget());
        assertNull(capture.getAllValues().get(1).getTarget());
    }
}
