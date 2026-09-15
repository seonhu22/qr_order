package htms.QROrder.system.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.common.dto.FileRequest;
import htms.QROrder.common.service.FileService;
import htms.QROrder.system.dto.NoticeRequest;
import htms.QROrder.system.dto.NoticeResponse;
import htms.QROrder.system.dto.QnaRequest;
import htms.QROrder.system.dto.QnaResponse;
import htms.QROrder.system.repository.NoticeMapper;
import htms.QROrder.system.repository.QnaMapper;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class QnaService {

    private final QnaMapper qnaMapper;
    private final AuditService auditService;
    private final FileService fileService;

    public List<QnaResponse> getQna(String searchKeyword,
                                        String sysPlantCd) {

        return qnaMapper.getQna(searchKeyword, sysPlantCd);
    }

    public void updateQna(QnaRequest qnaRequest,
                            FileRequest fileRequest,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {

        QnaResponse oldData = getOldData(qnaRequest);
        setNewFileLinkSysId(fileRequest, qnaRequest.getSysId());

        auditService.insertUpdateAuditTrailData(oldData, qnaRequest, qnaRequest.getSysId(), menuCd, "brd_qna", userId, sysPlantCd);
        qnaMapper.updateQna(qnaRequest, userId, sysPlantCd);
        fileService.saveFile(fileRequest, userId, sysPlantCd, menuCd);
    }

    private QnaResponse getOldData(QnaRequest qnaRequest) {

        return qnaMapper.getOldData(qnaRequest);
    }

    private void setNewFileLinkSysId(FileRequest fileRequest, String sysId) {

        fileRequest.getNewItems().forEach(item -> item.setLinkSysId(sysId));
    }
}
