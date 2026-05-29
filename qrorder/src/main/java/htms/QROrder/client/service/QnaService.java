package htms.QROrder.client.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.client.dto.NoticeResponse;
import htms.QROrder.client.dto.QnaRequest;
import htms.QROrder.client.dto.QnaResponse;
import htms.QROrder.client.repository.NoticeMapper;
import htms.QROrder.client.repository.QnaMapper;
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

    private final AuditService auditService;
    private final QnaMapper qnaMapper;

    public List<QnaResponse> getQna(String searchKeyword,
                                        String sysPlantCd) {

        return qnaMapper.getQna(searchKeyword, sysPlantCd);
    }

    public void newQna(QnaRequest qnaRequest,
                        String userId,
                        String sysPlantCd,
                        String menuCd) {

        String ULID = UlidCreator.getMonotonicUlid().toString();
        String FileULID = UlidCreator.getMonotonicUlid().toString();
        qnaRequest.setSysId(ULID);
        qnaRequest.setFileUlid(FileULID);

        auditService.insertNewAuditTrailData(qnaRequest, qnaRequest.getSysId(), menuCd, "brd_qna", userId, sysPlantCd);
        qnaMapper.newQna(qnaRequest, userId, sysPlantCd);
    }

    public void updateQna(QnaRequest qnaRequest,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {

        QnaResponse oldData = qnaMapper.getOldData(qnaRequest.getSysId());

        auditService.insertUpdateAuditTrailData(oldData, qnaRequest, qnaRequest.getSysId(),  menuCd, "brd_qna", userId, sysPlantCd);
        qnaMapper.updateQna(qnaRequest, userId, sysPlantCd);
    }

    public void delQna(QnaRequest qnaRequest,
                        String userId,
                        String sysPlantCd,
                        String menuCd) {

        auditService.insertDeleteAuditTrailData(qnaRequest, qnaRequest.getSysId(), menuCd, "brd_qna", userId, sysPlantCd);
        qnaMapper.delQna(qnaRequest, userId, sysPlantCd);
    }
}
