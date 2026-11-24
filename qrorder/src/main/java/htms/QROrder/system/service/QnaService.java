package htms.QROrder.system.service;

import htms.QROrder.audit.service.AuditService;
import htms.QROrder.common.dto.AttachScope;
import htms.QROrder.common.dto.FileRequest;
import htms.QROrder.common.service.FileService;
import htms.QROrder.system.dto.QnaRequest;
import htms.QROrder.system.dto.QnaResponse;
import htms.QROrder.system.repository.QnaMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class QnaService {

    private final QnaMapper qnaMapper;
    private final AuditService auditService;
    private final FileService fileService;

    public List<QnaResponse> getQna(String searchKeyword) {
        return qnaMapper.getQna(searchKeyword);
    }

    public void updateQna(QnaRequest qnaRequest,
                            FileRequest fileRequest,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {

        QnaResponse oldData = qnaMapper.getOldData(qnaRequest);
        if (oldData == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "문의사항을 찾을 수 없습니다.");
        }
        String linkSysId = oldData.getSysId();
        setNewFileLinkSysId(fileRequest, linkSysId);

        auditService.insertUpdateAuditTrailData(oldData, qnaRequest, qnaRequest.getSysId(), menuCd, "brd_qna", userId, sysPlantCd);
        if (qnaMapper.updateQna(qnaRequest, userId) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "문의사항을 찾을 수 없습니다.");
        }
        fileService.saveFile(fileRequest, userId, new AttachScope(sysPlantCd, linkSysId), menuCd);
    }

    private void setNewFileLinkSysId(FileRequest fileRequest, String sysId) {

        fileRequest.getNewItems().forEach(item -> item.setLinkSysId(sysId));
    }
}
