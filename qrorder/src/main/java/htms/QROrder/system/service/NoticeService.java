package htms.QROrder.system.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.common.dto.FileRequest;
import htms.QROrder.common.service.FileService;
import htms.QROrder.system.dto.NoticeRequest;
import htms.QROrder.system.dto.NoticeResponse;
import htms.QROrder.system.repository.NoticeMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeMapper noticeMapper;
    private final AuditService auditService;
    private final FileService fileService;

    public List<NoticeResponse> getNotice(String searchKeyword,
                                            String sysPlantCd) {

        return noticeMapper.getNotice(searchKeyword, sysPlantCd);
    }

    public void newNotice(NoticeRequest noticeRequest,
                            FileRequest fileRequest,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {

        String ULID = UlidCreator.getMonotonicUlid().toString();
        String fileUlid = UlidCreator.getMonotonicUlid().toString();
        noticeRequest.setSysId(ULID);
        noticeRequest.setFileUuid(fileUlid);

        auditService.insertNewAuditTrailData(noticeRequest, noticeRequest.getSysId(), menuCd, "brd_notice", userId, sysPlantCd);
        noticeMapper.newNotice(noticeRequest, userId, sysPlantCd);
        fileService.saveFile(fileRequest, userId, sysPlantCd, menuCd);
    }

    public void updateNotice(NoticeRequest noticeRequest,
                                FileRequest fileRequest,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        NoticeResponse oldData = noticeMapper.getOldData(noticeRequest.getSysId());

        auditService.insertUpdateAuditTrailData(oldData, noticeRequest, noticeRequest.getSysId(), menuCd, "brd_notice", userId, sysPlantCd);
        noticeMapper.updateNotice(noticeRequest, userId, sysPlantCd);
        fileService.saveFile(fileRequest, userId, sysPlantCd, menuCd);
    }

    public void delNotice(List<NoticeRequest> noticeRequest,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {

        auditService.insertDeleteAuditTrailData(noticeRequest, menuCd, "brd_notice", userId, sysPlantCd);
        noticeMapper.delNotice(noticeRequest, userId, sysPlantCd);
    }
}
