package htms.QROrder.system;

import htms.QROrder.audit.service.AuditService;
import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.repository.ClientNoticeMapper;
import htms.QROrder.client.service.ClientNoticeService;
import htms.QROrder.common.dto.FileRequest;
import htms.QROrder.common.service.FileService;
import htms.QROrder.system.dto.NoticeRequest;
import htms.QROrder.system.dto.NoticeResponse;
import htms.QROrder.system.repository.NoticeMapper;
import htms.QROrder.system.service.NoticeService;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class NoticeAudienceServiceTest {
    @Test void roleComesFromActorAndUnknownRoleNeverQueries() {
        var mapper = mock(ClientNoticeMapper.class);
        var service = new ClientNoticeService(mapper);
        var actor = new Login(); actor.setSysPlantCd("STORE"); actor.setUserRole("01");
        service.getNotice(null,actor); verify(mapper).getNotice(null,"manager");
        actor.setUserRole("02"); service.getNotice(null,actor); verify(mapper).getNotice(null,"staff");
        clearInvocations(mapper);
        actor.setUserRole("all");
        assertEquals(403,assertThrows(ResponseStatusException.class,()->service.getNotice(null,actor)).getStatusCode().value());
        assertEquals(401,assertThrows(ResponseStatusException.class,()->service.getNotice(null,null)).getStatusCode().value());
        verifyNoInteractions(mapper);
    }
    @Test void invalidTargetFailsBeforeAnyAuditFileOrPersistenceSideEffect() {
        var mapper=mock(NoticeMapper.class); var audit=mock(AuditService.class); var files=mock(FileService.class);
        var service=new NoticeService(mapper,audit,files);
        for(String target:new String[]{"", "select", "ADMIN", "manager,staff"}) {
            var request=new NoticeRequest(); request.setTarget(target);
            assertEquals(400,assertThrows(ResponseStatusException.class,()->service.newNotice(request,new FileRequest(),"ADMIN","ADMIN","NOTICE")).getStatusCode().value());
            assertEquals(400,assertThrows(ResponseStatusException.class,()->service.updateNotice(request,new FileRequest(),"ADMIN","ADMIN","NOTICE")).getStatusCode().value());
        }
        verifyNoInteractions(mapper,audit,files);
    }
    @Test void newMissingTargetDefaultsAllAndUpdateMissingTargetPreservesLockedValue() {
        var mapper=mock(NoticeMapper.class); var service=new NoticeService(mapper,mock(AuditService.class),mock(FileService.class));
        var created=new NoticeRequest(); service.newNotice(created,new FileRequest(),"ADMIN","ADMIN","NOTICE");
        assertEquals("all",created.getTarget());
        var old=new NoticeResponse(); old.setTarget("staff"); when(mapper.getOldData("N1", "ADMIN")).thenReturn(old);
        var update=new NoticeRequest(); update.setSysId("N1");
        service.updateNotice(update,new FileRequest(),"ADMIN","ADMIN","NOTICE");
        assertEquals("staff",update.getTarget()); verify(mapper).updateNotice(update,"ADMIN","ADMIN");
    }
}
