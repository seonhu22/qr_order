package htms.QROrder.system.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.common.exception.DuplicateException;
import htms.QROrder.system.domain.CommonDetail;
import htms.QROrder.system.dto.CommonDetailRequest;
import htms.QROrder.system.repository.CommonDetailMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class CommonDetailService {
    private final CommonDetailMapper commonDetailMapper;
    private final AuditService auditService;

    public List<CommonDetail> findCommonDetailBySearchCond(String linkSysId,
                                                            String searchCond) {

        return commonDetailMapper.findCommonDetailBySearchCond(linkSysId , searchCond);
    }

    public void newCommonDetail(List<CommonDetail> commonDetail,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        String tempLinkSysId = commonDetail.stream()
                .findFirst()
                .map(CommonDetail::getLinkSysId)
                .orElse(null);

        if(checkDuplicate(commonDetail, tempLinkSysId)) {

            List<CommonDetail> commonDetails = checkDuplicateData(commonDetail);

            String result = commonDetails.stream()
                .map(u -> u.getCommonNm() + "(" + u.getCommonCd() + ")")
                .collect(Collectors.joining(", "));

            throw new DuplicateException("중복된 코드가 존재합니다.\n" + result);
        }
        else {
            commonDetail.forEach(item -> item.setSysId(UlidCreator.getMonotonicUlid().toString()));
            auditService.insertNewAuditTrailData(commonDetail, menuCd, "sys_common_detail", userId, sysPlantCd);
            commonDetailMapper.newCommonDetail(commonDetail, userId);
        }
    }

    public void delCommonDetail(List<CommonDetail> commonDetail,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        List<String> ids = commonDetail.stream().map(CommonDetail::getSysId).collect(Collectors.toList());

        auditService.insertDeleteAuditTrailData(commonDetail, menuCd, "sys_common_detail", userId, sysPlantCd);
        commonDetailMapper.delCommonDetail(ids, userId);
    }

    public void updateCommonDetail(List<CommonDetail> commonDetail,
                                    String userId,
                                String sysPlantCd,
                                String menuCd) {

        List<CommonDetail> oldData = commonDetailMapper.getOldData(commonDetail);
        auditService.insertUpdateAuditTrailData(oldData, commonDetail, menuCd, "sys_common_detail", userId, sysPlantCd);
        commonDetailMapper.updateCommonDetail(commonDetail, userId);
    }

    public boolean checkDuplicate(List<CommonDetail> commonDetail,
                                    String tempLinkSysId) {

        return  commonDetailMapper.checkDuplicate(commonDetail, tempLinkSysId);
    }

    public List<CommonDetail> checkDuplicateData(List<CommonDetail> commonDetail) {

        return commonDetailMapper.checkDuplicateData(commonDetail);
    }

    public void saveCommonDetail(CommonDetailRequest requestData,
                                    String userId,
                                    String sysPlantId,
                                    String menuCd) {

        if(!requestData.getNewItems().isEmpty()) {
            newCommonDetail(requestData.getNewItems(), userId, sysPlantId, menuCd);
        }
        if(!requestData.getUpdateItems().isEmpty()) {
            updateCommonDetail(requestData.getUpdateItems(), userId, sysPlantId, menuCd);
        }
        if(!requestData.getDeleteItems().isEmpty()) {
            delCommonDetail(requestData.getDeleteItems(), userId, sysPlantId, menuCd);
        }
    }
}
