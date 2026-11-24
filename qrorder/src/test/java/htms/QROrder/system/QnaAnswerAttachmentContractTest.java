package htms.QROrder.system;

import htms.QROrder.audit.service.AuditService;
import htms.QROrder.common.dto.FileRequest;
import htms.QROrder.common.service.FileService;
import htms.QROrder.system.dto.QnaRequest;
import htms.QROrder.system.dto.QnaResponse;
import htms.QROrder.system.repository.QnaMapper;
import htms.QROrder.system.service.QnaService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.mock.web.MockMultipartHttpServletRequest;
import org.springframework.web.bind.ServletRequestDataBinder;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class QnaAnswerAttachmentContractTest {
    @Test
    void bindsFlatMultipartAndUsesInquiryIdForAnswerFiles() {
        var request = new MockMultipartHttpServletRequest();
        var upload = new MockMultipartFile("newItems[0].file", "answer.txt", "text/plain", "answer".getBytes());
        request.addFile(upload);
        request.addParameter("sysId", "QNA-1");
        request.addParameter("answerDescription", "확인했습니다.");
        request.addParameter("newItems[0].convertFileNm", "unique-file-name");
        request.addParameter("newItems[0].filePath", "/2026/11");
        request.addParameter("newItems[0].ordNo", "1");
        request.addParameter("newItems[0].linkSysId", "UNTRUSTED-GROUP");

        var answer = new QnaRequest();
        var files = new FileRequest();
        var answerBinder = new ServletRequestDataBinder(answer);
        var fileBinder = new ServletRequestDataBinder(files);
        answerBinder.bind(request);
        fileBinder.bind(request);
        assertFalse(answerBinder.getBindingResult().hasErrors());
        assertFalse(fileBinder.getBindingResult().hasErrors());
        assertEquals("QNA-1", answer.getSysId());
        assertEquals(upload, files.getNewItems().get(0).getFile());
        assertEquals("unique-file-name", files.getNewItems().get(0).getConvertFileNm());
        assertEquals("/2026/11", files.getNewItems().get(0).getFilePath());
        assertEquals(1, files.getNewItems().get(0).getOrdNo());

        var mapper = mock(QnaMapper.class);
        var storage = mock(FileService.class);
        when(mapper.getOldData(answer)).thenReturn(new QnaResponse());
        when(mapper.updateQna(answer, "ADMIN-USER")).thenReturn(1);
        new QnaService(mapper, mock(AuditService.class), storage)
                .updateQna(answer, files, "ADMIN-USER", "ADMIN", "QNA");

        assertEquals("QNA-1", files.getNewItems().get(0).getLinkSysId());
        assertTrue(files.getDelItems().isEmpty());
        verify(mapper).updateQna(answer, "ADMIN-USER");
        verify(storage).saveFile(files, "ADMIN-USER", "ADMIN", "QNA");
    }

    @Test
    void rejectsAnUnavailableInquiryBeforeSavingAnswerFiles() {
        var answer = new QnaRequest();
        answer.setSysId("MISSING-QNA");
        var mapper = mock(QnaMapper.class);
        var audit = mock(AuditService.class);
        var storage = mock(FileService.class);
        var service = new QnaService(mapper, audit, storage);

        var error = assertThrows(ResponseStatusException.class,
                () -> service.updateQna(answer, new FileRequest(), "ADMIN-USER", "ADMIN", "QNA"));

        assertEquals(404, error.getStatusCode().value());
        verify(mapper, never()).updateQna(any(), any());
        verifyNoInteractions(audit, storage);
    }
}
